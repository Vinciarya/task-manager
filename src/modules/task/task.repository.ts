import { BaseRepository, type IBaseRepository } from "@/lib/base.repository";
import { db } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { TaskStatus, type PaginatedResponse, type ITask } from "@/types";
import type { TaskFilters } from "@/modules/task/task.schema";

import { PrismaClient, Prisma } from "@prisma/client";

// Use inferred types from the Prisma Client to avoid flaky namespace resolution
type TaskCreateInput = Prisma.Args<PrismaClient["task"], "create">["data"];
type TaskUpdateInput = Prisma.Args<PrismaClient["task"], "update">["data"];
type TaskWhereInput = Prisma.Args<PrismaClient["task"], "findMany">["where"];

// =============================================================================
// Supporting types
// =============================================================================

/** Tasks grouped by their status — the shape consumed by a Kanban board. */
export interface TasksByStatus {
  [TaskStatus.TODO]: ITask[];
  [TaskStatus.IN_PROGRESS]: ITask[];
  [TaskStatus.DONE]: ITask[];
}

/** Aggregated statistics returned by the dashboard endpoint. */
export interface DashboardStats {
  /** Total tasks assigned to or created by the user across all projects. */
  totalTasks: number;
  /** Count of the user's tasks broken down by status. */
  byStatus: Record<TaskStatus, number>;
  /** Number of tasks past their due date that are not yet DONE. */
  overdueCount: number;
  overdueTasks: number;
  /** Number of tasks whose due date falls on today (any time). */
  dueTodayCount: number;
  tasksDueToday: number;
  /** The 5 most recently updated tasks for the activity feed. */
  recentActivity: ITask[];
}

export interface ITaskRepository
  extends IBaseRepository<ITask, TaskCreateInput, TaskUpdateInput> {
  findTasksWithFilters(filters: TaskFilters): Promise<PaginatedResponse<ITask>>;
  findTasksByProject(projectId: string): Promise<TasksByStatus>;
  getDashboardStats(userId: string): Promise<DashboardStats>;
}

export class TaskRepository extends BaseRepository<
  ITask,
  TaskCreateInput,
  TaskUpdateInput
> implements ITaskRepository {
  constructor() {
    super(db.task);
  }

  /**
   * Returns a paginated, filtered list of tasks for a project.
   *
   * Filter rules:
   * - `status` / `priority` / `assignedToId` — exact match when provided.
   * - `overdue` — `dueDate < now` AND `status != DONE`.
   */
  async findTasksWithFilters(
    filters: TaskFilters
  ): Promise<PaginatedResponse<ITask>> {
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

    const where: TaskWhereInput = {
      ...(projectId !== undefined && { projectId }),
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
        db.task.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip,
          take: limit,
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true } },
          },
        }),
        db.task.count({ where }),
      ]);

      return {
        items: items as ITask[],
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
      const tasks = await db.task.findMany({
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
          grouped[bucket].push(task as ITask);
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
      const allTasks = await db.task.findMany({
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
        overdueCount: overdueTasks,
        overdueTasks, // Keep for backward compatibility
        dueTodayCount: tasksDueToday,
        tasksDueToday, // Keep for backward compatibility
        recentActivity: allTasks.slice(0, 5) as ITask[],
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
