import { request } from "./api.client";
import { ITask, PaginatedResponse, ApiResponse, PaginationParams } from "@/types";
import {
  CreateTaskInput,
  UpdateTaskInput,
  UpdateStatusInput,
  TaskFilters,
} from "@/modules/task/task.schema";

export const taskService = {
  async getTasks(
    filters?: TaskFilters & PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<ITask>>> {
    const query = new URLSearchParams();

    if (filters?.page) query.append("page", filters.page.toString());
    if (filters?.limit) query.append("limit", filters.limit.toString());
    if (filters?.projectId) query.append("projectId", filters.projectId);
    if (filters?.status) query.append("status", filters.status);
    if (filters?.priority) query.append("priority", filters.priority);
    if (filters?.assignedToId) query.append("assignedToId", filters.assignedToId);
    if (filters?.overdue !== undefined) {
      query.append("overdue", filters.overdue.toString());
    }

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request<PaginatedResponse<ITask>>(`/api/tasks${queryString}`);
  },

  async getTask(id: string): Promise<ApiResponse<ITask>> {
    return request<ITask>(`/api/tasks/${id}`);
  },

  async createTask(data: CreateTaskInput): Promise<ApiResponse<ITask>> {
    return request<ITask>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateTask(
    id: string,
    data: UpdateTaskInput
  ): Promise<ApiResponse<ITask>> {
    return request<ITask>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async updateTaskStatus(
    id: string,
    data: UpdateStatusInput
  ): Promise<ApiResponse<ITask>> {
    return request<ITask>(`/api/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteTask(id: string): Promise<ApiResponse<void>> {
    return request<void>(`/api/tasks/${id}`, {
      method: "DELETE",
    });
  },
};
