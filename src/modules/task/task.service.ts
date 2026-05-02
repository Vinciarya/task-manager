import { AppError } from "@/lib/errors";
import { Role, TaskStatus } from "@/types";
import type { PaginatedResponse } from "@/types";
import type { TaskRepository, TasksByStatus, DashboardStats } from "@/modules/task/task.repository";
import type { TaskFilters, CreateTaskInput, UpdateTaskInput, UpdateStatusInput } from "@/modules/task/task.schema";
import type { ProjectRepository } from "@/modules/project/project.repository";

import type { Task, Prisma } from "../../app/generated/prisma";

// =============================================================================
// TaskService
// =============================================================================

/**
 * Business-logic layer for task management.
 *
 * **Dependency injection**: receives both `TaskRepository` and
 * `ProjectRepository` so it can verify project membership and roles without
 * duplicating that logic.
 *
 * **Access-control model**
 * - Any project member can create, read, and update-status a task.
 * - Any project member can update a task's fields.
 * - Only the task creator OR a project ADMIN can delete a task.
 * - The assignee (if provided) must be a project member.
 */
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Creates a new task inside a project.
   *
   * - Requester must be a project member.
   * - If `assignedToId` is supplied, that user must also be a project member.
   *
   * @throws {AppError} 403 if the requester is not a project member.
   * @throws {AppError} 422 if the assignee is not a project member.
   */
  async createTask(data: CreateTaskInput, requesterId: string): Promise<Task> {
    // Gate: requester must be a member
    await this.verifyMembership(requesterId, data.projectId);

    // Gate: assignee must be a member (when provided)
    if (data.assignedToId) {
      await this.verifyAssigneeMembership(data.assignedToId, data.projectId);
    }

    return this.taskRepository.create({
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? TaskStatus.TODO,
      priority: data.priority ?? "MEDIUM",
      dueDate: data.dueDate ?? null,
      project: { connect: { id: data.projectId } },
      createdBy: { connect: { id: requesterId } },
      ...(data.assignedToId && {
        assignedTo: { connect: { id: data.assignedToId } },
      }),
    } satisfies Prisma.TaskCreateInput);
  }

  /**
   * Returns a paginated, filtered list of tasks for a project.
   *
   * @throws {AppError} 403 if the requester is not a project member.
   */
  async getTasksByFilters(
    filters: TaskFilters,
    requesterId: string
  ): Promise<PaginatedResponse<Task>> {
    await this.verifyMembership(requesterId, filters.projectId);
    return this.taskRepository.findTasksWithFilters(filters);
  }

  /**
   * Returns all tasks in a project grouped by status (for Kanban boards).
   *
   * @throws {AppError} 403 if the requester is not a project member.
   */
  async getTasksByProject(
    projectId: string,
    requesterId: string
  ): Promise<TasksByStatus> {
    await this.verifyMembership(requesterId, projectId);
    return this.taskRepository.findTasksByProject(projectId);
  }

  /**
   * Returns dashboard statistics for the requesting user.
   */
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    return this.taskRepository.getDashboardStats(userId);
  }

  /**
   * Updates task fields (title, description, priority, dueDate, assignedToId).
   *
   * - Any project member can edit a task.
   * - If changing the assignee, the new assignee must be a project member.
   *
   * @throws {AppError} 403 if the requester is not a project member.
   * @throws {AppError} 404 if the task does not exist.
   * @throws {AppError} 422 if the new assignee is not a project member.
   */
  async updateTask(
    taskId: string,
    data: UpdateTaskInput,
    requesterId: string
  ): Promise<Task> {
    const task = await this.resolveTask(taskId);

    await this.verifyMembership(requesterId, task.projectId);

    // Validate new assignee membership when the field is being changed
    if (data.assignedToId !== undefined && data.assignedToId !== null) {
      await this.verifyAssigneeMembership(data.assignedToId, task.projectId);
    }

    return this.taskRepository.update(taskId, {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
      ...(data.assignedToId !== undefined && {
        assignedTo: data.assignedToId
          ? { connect: { id: data.assignedToId } }
          : { disconnect: true },
      }),
    } satisfies Prisma.TaskUpdateInput);
  }

  /**
   * Updates only the status of a task.
   * Any project member can call this (e.g., drag-and-drop on the Kanban board).
   *
   * @throws {AppError} 403 if the requester is not a project member.
   * @throws {AppError} 404 if the task does not exist.
   */
  async updateStatus(
    taskId: string,
    data: UpdateStatusInput,
    requesterId: string
  ): Promise<Task> {
    const task = await this.resolveTask(taskId);

    await this.verifyMembership(requesterId, task.projectId);

    return this.taskRepository.update(taskId, {
      status: data.status,
    } satisfies Prisma.TaskUpdateInput);
  }

  /**
   * Permanently deletes a task.
   *
   * Only the task's **creator** or a project-level **ADMIN** may delete it.
   *
   * @throws {AppError} 403 if the requester is neither the creator nor an ADMIN.
   * @throws {AppError} 404 if the task does not exist.
   */
  async deleteTask(taskId: string, requesterId: string): Promise<void> {
    const task = await this.resolveTask(taskId);

    const membership = await this.projectRepository.findMembership(
      requesterId,
      task.projectId
    );

    if (!membership) {
      throw AppError.forbidden("You are not a member of this project.");
    }

    const isCreator = task.createdById === requesterId;
    const isAdmin = membership.role === Role.ADMIN;

    if (!isCreator && !isAdmin) {
      throw AppError.forbidden(
        "Only the task creator or a project admin can delete this task."
      );
    }

    await this.taskRepository.delete(taskId);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Fetches a task by ID, throwing 404 if it doesn't exist.
   */
  private async resolveTask(taskId: string): Promise<Task> {
    // BaseRepository.findById already throws AppError.notFound on a miss.
    return this.taskRepository.findById(taskId);
  }

  /**
   * Asserts that `userId` is a member of `projectId`.
   * @throws {AppError} 403 if not a member.
   */
  private async verifyMembership(
    userId: string,
    projectId: string
  ): Promise<void> {
    const membership = await this.projectRepository.findMembership(
      userId,
      projectId
    );

    if (!membership) {
      throw AppError.forbidden("You are not a member of this project.");
    }
  }

  /**
   * Asserts that the intended assignee is a member of the project.
   * Uses a 422 Unprocessable Entity so callers can distinguish this validation
   * failure from a general 403 access-control error.
   *
   * @throws {AppError} 422 if the assignee is not a member.
   */
  private async verifyAssigneeMembership(
    assigneeId: string,
    projectId: string
  ): Promise<void> {
    const membership = await this.projectRepository.findMembership(
      assigneeId,
      projectId
    );

    if (!membership) {
      throw new AppError(
        "The assigned user is not a member of this project.",
        422
      );
    }
  }
}
