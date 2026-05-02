import { BaseRepository } from "@/lib/base.repository";
import { AppError } from "@/lib/errors";
import { TaskStatus } from "@/types";
import type { ProjectWithMeta, ProjectWithDetails } from "@/modules/project/project.types";

// ---------------------------------------------------------------------------
// Prisma imports
// Generated client output: prisma/schema.prisma → output = "../app/generated/prisma"
// Adjust the relative path if the prisma `output` option changes.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../../app/generated/prisma") as typeof import("../../app/generated/prisma");

import type { Project, ProjectMember, Prisma } from "../../app/generated/prisma";

const prisma = new PrismaClient();

// =============================================================================
// ProjectRepository
// =============================================================================

/**
 * Data-access layer for projects and project membership.
 *
 * Extends {@link BaseRepository} for generic CRUD (findById, findAll, create,
 * update, delete, count).  Project-specific queries are added below.
 *
 * @example
 * ```ts
 * const repo = new ProjectRepository();
 * const projects = await repo.findProjectsForUser(userId);
 * ```
 */
export class ProjectRepository extends BaseRepository<
  Project,
  Prisma.ProjectCreateInput,
  Prisma.ProjectUpdateInput
> {
  protected model = prisma.project;

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns all projects the user is a member of, enriched with member count
   * and per-status task counts.
   *
   * Does NOT paginate — callers wrap in `PaginatedResponse` at the service
   * layer if needed, or pass through to the generic `findAll`.
   */
  async findProjectsForUser(userId: string): Promise<ProjectWithMeta[]> {
    try {
      const projects = await prisma.project.findMany({
        where: {
          members: { some: { userId } },
        },
        include: {
          _count: {
            select: { members: true },
          },
          tasks: {
            select: { status: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return projects.map((p) => {
        const taskCounts = this.aggregateTaskCounts(
          p.tasks as Array<{ status: string }>
        );

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          ownerId: p.ownerId,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          memberCount: p._count.members,
          taskCounts,
        };
      });
    } catch (error) {
      this.handleError(error, "Failed to fetch projects for user.");
    }
  }

  /**
   * Returns a single project with its full member list (+ nested user info)
   * and task-status counts.  Returns `null` if no project with that id exists.
   */
  async findProjectWithDetails(id: string): Promise<ProjectWithDetails | null> {
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          members: {
            include: { user: true },
            orderBy: { joinedAt: "asc" },
          },
          _count: {
            select: { members: true },
          },
          tasks: {
            select: { status: true },
          },
        },
      });

      if (!project) return null;

      const taskCounts = this.aggregateTaskCounts(
        project.tasks as Array<{ status: string }>
      );

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        memberCount: project._count.members,
        taskCounts,
        // Map Prisma members → IProjectMember shape
        members: project.members.map((m) => ({
          userId: m.userId,
          projectId: m.projectId,
          role: m.role as import("@/types").Role,
          joinedAt: m.joinedAt,
          user: m.user
            ? {
                id: m.user.id,
                name: m.user.name,
                email: m.user.email,
                role: m.user.role as import("@/types").Role,
                createdAt: m.user.createdAt,
                updatedAt: m.user.updatedAt,
              }
            : undefined,
        })),
      };
    } catch (error) {
      this.handleError(error, "Failed to fetch project details.");
    }
  }

  /**
   * Checks whether `userId` is a member of `projectId`.
   * Returns the `ProjectMember` record or `null` — never throws on a miss.
   */
  async findMembership(
    userId: string,
    projectId: string
  ): Promise<ProjectMember | null> {
    try {
      const membership = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId } },
      });
      return membership ?? null;
    } catch (error) {
      this.handleError(error, "Failed to look up project membership.");
    }
  }

  // ---------------------------------------------------------------------------
  // Commands
  // ---------------------------------------------------------------------------

  /**
   * Adds a user to a project with the given role.
   * @throws {AppError} 409 if the user is already a member.
   */
  async addMember(data: Prisma.ProjectMemberCreateInput): Promise<ProjectMember> {
    try {
      return await prisma.projectMember.create({ data });
    } catch (error) {
      // Prisma P2002 = unique constraint violation (already a member)
      const code = (error as Record<string, unknown>)?.["code"];
      if (code === "P2002") {
        throw AppError.conflict("This user is already a member of the project.");
      }
      this.handleError(error, "Failed to add project member.");
    }
  }

  /**
   * Removes a user from a project.
   * @throws {AppError} 404 if the membership record does not exist.
   */
  async removeMember(userId: string, projectId: string): Promise<void> {
    try {
      await prisma.projectMember.delete({
        where: { userId_projectId: { userId, projectId } },
      });
    } catch (error) {
      const code = (error as Record<string, unknown>)?.["code"];
      if (code === "P2025") {
        throw AppError.notFound("Membership record not found.");
      }
      this.handleError(error, "Failed to remove project member.");
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Aggregates an array of task status strings into a `Record<TaskStatus, number>`.
   * Initialises every status to 0 so the shape is always fully populated.
   */
  private aggregateTaskCounts(
    tasks: Array<{ status: string }>
  ): Record<TaskStatus, number> {
    const counts: Record<TaskStatus, number> = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.DONE]: 0,
    };

    for (const { status } of tasks) {
      if (status in counts) {
        counts[status as TaskStatus]++;
      }
    }

    return counts;
  }

  /**
   * Centralised error handler.  Re-throws `AppError` unchanged and wraps
   * everything else as a 500 internal error.
   * Typed as `never` so TypeScript understands the call exhausts the path.
   */
  private handleError(error: unknown, fallbackMessage: string): never {
    if (error instanceof AppError) throw error;
    const message = error instanceof Error ? error.message : fallbackMessage;
    throw AppError.internal(message);
  }
}
