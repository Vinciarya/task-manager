import { AppError } from "@/lib/errors";
import { Role, type PaginatedResponse } from "@/types";
import type { IUserRepository } from "@/modules/auth/auth.repository";
import type { IProjectRepository } from "@/modules/project/project.repository";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/modules/project/project.schema";
import type {
  ProjectWithDetails,
  ProjectWithMeta,
} from "@/modules/project/project.types";
import type { Project, ProjectMember, Prisma } from "@prisma/client";

export interface IProjectService {
  createProject(data: CreateProjectInput, userId: string): Promise<Project>;
  getProjects(
    userId: string,
    page?: number,
    limit?: number
  ): Promise<PaginatedResponse<ProjectWithMeta>>;
  getProjectById(id: string, userId: string): Promise<ProjectWithDetails>;
  updateProject(
    id: string,
    data: UpdateProjectInput,
    userId: string
  ): Promise<Project>;
  deleteProject(id: string, userId: string): Promise<void>;
  addMember(
    projectId: string,
    email: string,
    role: Role,
    requesterId: string
  ): Promise<ProjectMember>;
  removeMember(
    projectId: string,
    targetUserId: string,
    requesterId: string
  ): Promise<void>;
}

export class ProjectService implements IProjectService {
  readonly #repository: IProjectRepository;
  readonly #userRepository: IUserRepository;

  constructor(
    repository: IProjectRepository,
    userRepository: IUserRepository
  ) {
    this.#repository = repository;
    this.#userRepository = userRepository;
  }

  async createProject(
    data: CreateProjectInput,
    userId: string
  ): Promise<Project> {
    return this.#repository.createWithOwner(
      {
        name: data.name,
        description: data.description ?? null,
        owner: { connect: { id: userId } },
      } satisfies Prisma.ProjectCreateInput,
      userId
    );
  }

  async getProjects(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<ProjectWithMeta>> {
    const all = await this.#repository.findProjectsForUser(userId);
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

  async getProjectById(id: string, userId: string): Promise<ProjectWithDetails> {
    await this.#verifyMembership(userId, id);
    const project = await this.#repository.findProjectWithDetails(id);

    if (!project) {
      throw AppError.notFound("Project not found.");
    }

    return project;
  }

  async updateProject(
    id: string,
    data: UpdateProjectInput,
    userId: string
  ): Promise<Project> {
    await this.#verifyAdminAccess(userId, id);

    return this.#repository.update(id, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    } satisfies Prisma.ProjectUpdateInput);
  }

  async deleteProject(id: string, userId: string): Promise<void> {
    await this.#verifyAdminAccess(userId, id);
    await this.#repository.delete(id);
  }

  async addMember(
    projectId: string,
    email: string,
    role: Role,
    requesterId: string
  ): Promise<ProjectMember> {
    await this.#verifyAdminAccess(requesterId, projectId);

    const targetUser = await this.#userRepository.findByEmail(email);
    if (!targetUser) {
      throw AppError.notFound(`No user found with email "${email}".`);
    }

    const existingMembership = await this.#repository.findMembership(
      targetUser.id,
      projectId
    );
    if (existingMembership) {
      throw AppError.conflict("This user is already a member of the project.");
    }

    const member = await this.#repository.addMember({
      project: { connect: { id: projectId } },
      user: { connect: { id: targetUser.id } },
      role,
    } satisfies Prisma.ProjectMemberCreateInput);

    return {
      ...member,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
      }
    } as any;
  }

  async removeMember(
    projectId: string,
    targetUserId: string,
    requesterId: string
  ): Promise<void> {
    await this.#verifyAdminAccess(requesterId, projectId);
    const targetMembership = await this.#repository.findMembership(
      targetUserId,
      projectId
    );

    if (!targetMembership) {
      throw AppError.notFound("The specified user is not a member of this project.");
    }

    if (targetMembership.role === Role.ADMIN) {
      const adminCount = await this.#repository.getAdminCount(projectId);

      if (adminCount <= 1) {
        throw AppError.badRequest("Cannot remove the only admin from project");
      }
    }

    await this.#repository.removeMember(targetUserId, projectId);
  }

  async #verifyMembership(
    userId: string,
    projectId: string
  ): Promise<ProjectMember> {
    const membership = await this.#repository.findMembership(userId, projectId);

    if (!membership) {
      throw AppError.forbidden("You are not a member of this project.");
    }

    return membership;
  }

  async #verifyAdminAccess(userId: string, projectId: string): Promise<void> {
    const membership = await this.#verifyMembership(userId, projectId);

    if (membership.role !== Role.ADMIN) {
      throw AppError.forbidden("Only project admins can perform this action.");
    }
  }
}
