import { BaseRepository } from "@/lib/base.repository";
import { AppError } from "@/lib/errors";
import { TaskStatus } from "@/types";
import type { PaginatedResponse } from "@/types";
import type { TaskFilters } from "@/modules/task/task.schema";

// ---------------------------------------------------------------------------
// Prisma imports
// Generated client output: prisma/schema.prisma → output = "../app/generated/prisma"
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../../app/generated/prisma") as typeof import("../../app/generated/prisma");

import type { Task, Prisma } from "../../app/generated/prisma";

const prisma = new PrismaClient();

// =============================================================================
// Supporting types
// =============================================================================

/** Tasks grouped by their status — the shape consumed by a Kanban board. */
export interface TasksByStatus {
  [TaskStatus.TODO]: Task[];
  [TaskStatus.IN_PROGRESS]: Task[];
  [TaskStatus.DONE]: Task[];
}

/** Aggregated statistics returned by the dashboard endpoint. */
export interface DashboardStats {
  /** Total tasks assigned to or created by the user across all projects. */
  totalTasks: number;
  /** Count of the user's tasks broken down by status. */
  byStatus: Record<TaskStatus, number>;
  /** Number of tasks past their due date that are not yet DONE. */
  overdueTasks: number;
  /** Number of tasks whose due date falls on today (any time). */
  tasksDueToday: number;
  /** The 5 most recently updated tasks for the activity feed. */
  recentActivity: Task[];
}

// =============================================================================
// TaskRepository
// =============================================================================

/**
 * Data-access layer for tasks.
 *
 * Extends {@link BaseRepository} for generic CRUD; adds three domain-specific
 * query methods: filter/paginate, group by status, and dashboard stats.
 *
 * @example
 * ```ts
 * const repo = new TaskRepository();
 * const page = await repo.findTasksWithFilters({ projectId, page: 1, limit: 20 });
 * ```
 */
export class TaskRepository extends BaseRepository<
  Task,
  Prisma.TaskCreateInput,
  Prisma.TaskUpdateInput
> {
  protected model = prisma.task;

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns a paginated, filtered list of tasks for a project.
   *
   * Filter rules:
   * - `status` / `priority` / `assignedToId` — exact match when provided.
   * - `overdue` — `dueDate < now` AND `status != DONE`.
   */
  async findTasksWithFilters(
    filters: TaskFilters
  ): Promise<PaginatedResponse<Task>> {
    const {
      projectId,
      status,
      priority,
      overdue,
      assignedToId,
      page,
      limit,
    } = filters;

    const now = new Date();

    const where: Prisma.TaskWhereInput = {
      projectId,
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(assignedToId !== undefined && { assignedToId }),
      ...(overdue === true && {
        dueDate: { lt: now },
        NOT: { status: TaskStatus.DONE },
      }),
    };

    try {
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        prisma.task.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip,
          take: limit,
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true } },
          },
        }),
        prisma.task.count({ where }),
      ]);

      return {
        items: items as Task[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.handleError(error, "Failed to fetch tasks.");
    }
  }

  /**
   * Returns all tasks in a project grouped by their status.
   * Used by the Kanban board view — no pagination applied.
   */
  async findTasksByProject(projectId: string): Promise<TasksByStatus> {
    try {
      const tasks = await prisma.task.findMany({
        where: { projectId },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });

      const grouped: TasksByStatus = {
        [TaskStatus.TODO]: [],
        [TaskStatus.IN_PROGRESS]: [],
        [TaskStatus.DONE]: [],
      };

      for (const task of tasks) {
        const bucket = task.status as TaskStatus;
        if (bucket in grouped) {
          grouped[bucket].push(task as Task);
        }
      }

      return grouped;
    } catch (error) {
      this.handleError(error, "Failed to fetch tasks by project.");
    }
  }

  /**
   * Computes dashboard statistics for a single user.
   *
   * Fetches tasks where the user is either the creator or the assignee, then
   * derives all aggregates in JavaScript to avoid multiple round-trips.
   */
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      const now = new Date();

      // Today's date boundaries (midnight → 23:59:59.999)
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      // Single broad fetch — all tasks the user owns or is assigned to.
      const allTasks = await prisma.task.findMany({
        where: {
          OR: [{ createdById: userId }, { assignedToId: userId }],
        },
        orderBy: { updatedAt: "desc" },
      });

      // Initialise counters
      const byStatus: Record<TaskStatus, number> = {
        [TaskStatus.TODO]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.DONE]: 0,
      };

      let overdueTasks = 0;
      let tasksDueToday = 0;

      for (const task of allTasks) {
        // Status buckets
        const s = task.status as TaskStatus;
        if (s in byStatus) byStatus[s]++;

        // Overdue: has a due date, is past now, and not yet DONE
        if (
          task.dueDate &&
          task.dueDate < now &&
          task.status !== TaskStatus.DONE
        ) {
          overdueTasks++;
        }

        // Due today: due date falls within today's boundaries
        if (
          task.dueDate &&
          task.dueDate >= todayStart &&
          task.dueDate <= todayEnd
        ) {
          tasksDueToday++;
        }
      }

      return {
        totalTasks: allTasks.length,
        byStatus,
        overdueTasks,
        tasksDueToday,
        // Most-recently-updated 5 tasks for the activity feed
        recentActivity: allTasks.slice(0, 5) as Task[],
      };
    } catch (error) {
      this.handleError(error, "Failed to fetch dashboard statistics.");
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private handleError(error: unknown, fallbackMessage: string): never {
    if (error instanceof AppError) throw error;
    const message = error instanceof Error ? error.message : fallbackMessage;
    throw AppError.internal(message);
  }
}
