import { AppError } from "@/lib/errors";
import { Role } from "@/types";
import type { PaginatedResponse } from "@/types";
import type { ProjectRepository } from "@/modules/project/project.repository";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/modules/project/project.schema";
import type { ProjectWithMeta, ProjectWithDetails } from "@/modules/project/project.types";

import type { Project, ProjectMember, Prisma } from "../../app/generated/prisma";

// =============================================================================
// ProjectService
// =============================================================================

/**
 * Business-logic layer for project management.
 *
 * Receives a {@link ProjectRepository} via constructor injection for full
 * testability — swap in a mock repository in unit tests.
 *
 * **Access-control model**
 * - Any authenticated user can read projects they are a member of.
 * - Only project-level ADMINs can mutate a project (update, delete, manage members).
 * - The user who creates a project is automatically added as a project ADMIN.
 */
export class ProjectService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Creates a new project and adds the creator as a project-level ADMIN in
   * a single logical operation.
   *
   * @param data     - Validated create payload.
   * @param userId   - ID of the authenticated user making the request.
   */
  async createProject(
    data: CreateProjectInput,
    userId: string
  ): Promise<Project> {
    const project = await this.projectRepository.create({
      name: data.name,
      description: data.description ?? null,
      owner: { connect: { id: userId } },
    } satisfies Prisma.ProjectCreateInput);

    // Immediately enrol the creator as an ADMIN member.
    await this.projectRepository.addMember({
      project: { connect: { id: project.id } },
      user: { connect: { id: userId } },
      role: Role.ADMIN,
    } satisfies Prisma.ProjectMemberCreateInput);

    return project;
  }

  /**
   * Returns a paginated list of projects the given user is a member of.
   */
  async getProjects(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<ProjectWithMeta>> {
    // Fetch all matching projects then slice — suitable for moderate dataset
    // sizes.  Replace with a repository-level paginated query for large data.
    const all = await this.projectRepository.findProjectsForUser(userId);

    const start = (page - 1) * limit;
    const items = all.slice(start, start + limit);

    return {
      items,
      total: all.length,
      page,
      limit,
      totalPages: Math.ceil(all.length / limit),
    };
  }

  /**
   * Returns the full details of a single project.
   *
   * @throws {AppError} 404 if the project does not exist.
   * @throws {AppError} 403 if the requester is not a member.
   */
  async getProjectById(id: string, userId: string): Promise<ProjectWithDetails> {
    const project = await this.projectRepository.findProjectWithDetails(id);

    if (!project) {
      throw AppError.notFound("Project not found.");
    }

    // Gate: user must be a member to view the project.
    await this.verifyMembership(userId, id);

    return project;
  }

  /**
   * Updates project fields.
   *
   * @throws {AppError} 403 if the requester is not a project ADMIN.
   */
  async updateProject(
    id: string,
    data: UpdateProjectInput,
    userId: string
  ): Promise<Project> {
    await this.verifyAdminAccess(userId, id);

    return this.projectRepository.update(id, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    } satisfies Prisma.ProjectUpdateInput);
  }

  /**
   * Permanently deletes a project and all its related data (cascaded by
   * Prisma / DB foreign-key constraints).
   *
   * @throws {AppError} 403 if the requester is not a project ADMIN.
   */
  async deleteProject(id: string, userId: string): Promise<void> {
    await this.verifyAdminAccess(userId, id);
    await this.projectRepository.delete(id);
  }

  /**
   * Adds a user (looked up by email) to a project with the given role.
   *
   * @param projectId   - Target project.
   * @param email       - Email of the user to add.
   * @param role        - Role to assign to the new member.
   * @param requesterId - ID of the user performing the action (must be ADMIN).
   *
   * @throws {AppError} 403 if the requester is not a project ADMIN.
   * @throws {AppError} 404 if no user with that email exists.
   * @throws {AppError} 409 if the target user is already a member.
   */
  async addMember(
    projectId: string,
    email: string,
    role: Role,
    requesterId: string
  ): Promise<ProjectMember> {
    await this.verifyAdminAccess(requesterId, projectId);

    // Resolve email → userId via the User table.
    // We re-use the project-member join so we do not depend on AuthRepository.
    const targetUser = await this.resolveUserByEmail(email);

    return this.projectRepository.addMember({
      project: { connect: { id: projectId } },
      user: { connect: { id: targetUser.id } },
      role,
    } satisfies Prisma.ProjectMemberCreateInput);
  }

  /**
   * Removes a member from a project.
   *
   * Rules:
   * - A project ADMIN can remove any member.
   * - Removing the last ADMIN is prevented to avoid an un-administrable project.
   *
   * @throws {AppError} 403 if the requester is not a project ADMIN.
   * @throws {AppError} 409 if removing the target would leave the project with no ADMINs.
   * @throws {AppError} 404 if the target is not a member.
   */
  async removeMember(
    projectId: string,
    targetUserId: string,
    requesterId: string
  ): Promise<void> {
    await this.verifyAdminAccess(requesterId, projectId);

    // Guard: make sure the project always has at least one ADMIN.
    const targetMembership = await this.projectRepository.findMembership(
      targetUserId,
      projectId
    );

    if (!targetMembership) {
      throw AppError.notFound("The specified user is not a member of this project.");
    }

    if (targetMembership.role === Role.ADMIN) {
      // Count remaining ADMINs before allowing the removal.
      const details = await this.projectRepository.findProjectWithDetails(projectId);
      const adminCount = details?.members.filter((m) => m.role === Role.ADMIN).length ?? 0;

      if (adminCount <= 1) {
        throw AppError.conflict(
          "Cannot remove the last admin. Promote another member first."
        );
      }
    }

    await this.projectRepository.removeMember(targetUserId, projectId);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Asserts that `userId` is a member of `projectId`.
   *
   * @throws {AppError} 403 if the user is not a member.
   * @returns The membership record (useful for role checks by callers).
   */
  private async verifyMembership(
    userId: string,
    projectId: string
  ): Promise<ProjectMember> {
    const membership = await this.projectRepository.findMembership(userId, projectId);

    if (!membership) {
      throw AppError.forbidden("You are not a member of this project.");
    }

    return membership;
  }

  /**
   * Asserts that `userId` is a project-level ADMIN of `projectId`.
   *
   * @throws {AppError} 403 if the user is not a member or their role is not ADMIN.
   */
  private async verifyAdminAccess(userId: string, projectId: string): Promise<void> {
    const membership = await this.verifyMembership(userId, projectId);

    if (membership.role !== Role.ADMIN) {
      throw AppError.forbidden("Only project admins can perform this action.");
    }
  }

  /**
   * Resolves a user record by email address.
   * Thin wrapper around a direct Prisma call so we avoid coupling to
   * AuthRepository.
   *
   * @throws {AppError} 404 if no user with that email exists.
   */
  private async resolveUserByEmail(email: string): Promise<{ id: string }> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("../../app/generated/prisma") as typeof import("../../app/generated/prisma");
    const prisma = new PrismaClient();

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (!user) {
        throw AppError.notFound(`No user found with email "${email}".`);
      }

      return user;
    } finally {
      await prisma.$disconnect();
    }
  }
}
