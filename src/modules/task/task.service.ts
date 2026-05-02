import { AppError } from "@/lib/errors";
import { Role, TaskStatus, type PaginatedResponse, type ITask, type IProjectMember } from "@/types";
import type { IProjectRepository } from "@/modules/project/project.repository";
import type {
  DashboardStats,
  ITaskRepository,
  TasksByStatus,
} from "@/modules/task/task.repository";
import type {
  CreateTaskInput,
  TaskFilters,
  UpdateStatusInput,
  UpdateTaskInput,
} from "@/modules/task/task.schema";

import { PrismaClient, Prisma } from "@prisma/client";

// Inferred types to avoid flaky namespace resolution
type TaskCreateInput = Prisma.Args<PrismaClient["task"], "create">["data"];
type TaskUpdateInput = Prisma.Args<PrismaClient["task"], "update">["data"];

export interface ITaskService {
  createTask(data: CreateTaskInput, requesterId: string): Promise<ITask>;
  getTasksByFilters(
    filters: TaskFilters,
    requesterId: string
  ): Promise<PaginatedResponse<ITask>>;
  getTasksByProject(
    projectId: string,
    requesterId: string
  ): Promise<TasksByStatus>;
  getDashboardStats(userId: string): Promise<DashboardStats>;
  getTaskById(taskId: string, requesterId: string): Promise<ITask>;
  updateTask(
    taskId: string,
    data: UpdateTaskInput,
    requesterId: string
  ): Promise<ITask>;
  updateStatus(
    taskId: string,
    data: UpdateStatusInput,
    requesterId: string
  ): Promise<ITask>;
  deleteTask(taskId: string, requesterId: string): Promise<void>;
}

export class TaskService implements ITaskService {
  readonly #repository: ITaskRepository;
  readonly #projectRepository: IProjectRepository;

  constructor(
    repository: ITaskRepository,
    projectRepository: IProjectRepository
  ) {
    this.#repository = repository;
    this.#projectRepository = projectRepository;
  }

  async createTask(data: CreateTaskInput, requesterId: string): Promise<ITask> {
    await this.#verifyProjectMembership(requesterId, data.projectId);

    if (data.assignedToId) {
      await this.#verifyProjectMembership(data.assignedToId, data.projectId);
    }

    if (data.dueDate && data.dueDate < new Date()) {
      throw AppError.unprocessable("Due date cannot be in the past");
    }

    return this.#repository.create({
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
    } satisfies TaskCreateInput);
  }

  async getTasksByFilters(
    filters: TaskFilters,
    requesterId: string
  ): Promise<PaginatedResponse<ITask>> {
    if (filters.projectId) {
      await this.#verifyProjectMembership(requesterId, filters.projectId);
    }
    return this.#repository.findTasksWithFilters(filters);
  }

  async getTasksByProject(
    projectId: string,
    requesterId: string
  ): Promise<TasksByStatus> {
    await this.#verifyProjectMembership(requesterId, projectId);
    return this.#repository.findTasksByProject(projectId);
  }

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    return this.#repository.getDashboardStats(userId);
  }

  async getTaskById(taskId: string, requesterId: string): Promise<ITask> {
    const task = await this.#repository.findById(taskId);
    await this.#verifyProjectMembership(requesterId, task.projectId);
    return task;
  }

  async updateTask(
    taskId: string,
    data: UpdateTaskInput,
    requesterId: string
  ): Promise<ITask> {
    const task = await this.#repository.findById(taskId);
    const membership = await this.#verifyProjectMembership(
      requesterId,
      task.projectId
    );
    this.#verifyTaskAccess(task, requesterId, membership);

    if (data.assignedToId !== undefined && data.assignedToId !== null) {
      await this.#verifyProjectMembership(data.assignedToId, task.projectId);
    }

    return this.#repository.update(taskId, {
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
    } satisfies TaskUpdateInput);
  }

  async updateStatus(
    taskId: string,
    data: UpdateStatusInput,
    requesterId: string
  ): Promise<ITask> {
    const task = await this.#repository.findById(taskId);
    await this.#verifyProjectMembership(requesterId, task.projectId);

    return this.#repository.update(taskId, {
      status: data.status,
    } satisfies TaskUpdateInput);
  }

  async deleteTask(taskId: string, requesterId: string): Promise<void> {
    const task = await this.#repository.findById(taskId);
    const membership = await this.#verifyProjectMembership(
      requesterId,
      task.projectId
    );
    this.#verifyTaskAccess(task, requesterId, membership);
    await this.#repository.delete(taskId);
  }

  async #verifyProjectMembership(
    userId: string,
    projectId: string
  ): Promise<IProjectMember> {
    const membership = await this.#projectRepository.findMembership(
      userId,
      projectId
    );

    if (!membership) {
      throw AppError.forbidden("You are not a member of this project.");
    }

    return membership;
  }

  #verifyTaskAccess(
    task: ITask,
    userId: string,
    projectMember: IProjectMember
  ): void {
    const isCreator = task.createdById === userId;
    const isAdmin = projectMember.role === Role.ADMIN;

    if (!isCreator && !isAdmin) {
      throw AppError.forbidden(
        "Only the task creator or a project admin can modify this task."
      );
    }
  }
}
