import { request } from "./api.client";
import {
  IProject,
  IProjectWithMeta,
  PaginatedResponse,
  PaginationParams,
  ApiResponse,
} from "@/types";
import {
  CreateProjectInput,
  UpdateProjectInput,
  AddMemberInput,
} from "@/modules/project/project.schema";

export const projectService = {
  async getProjects(
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<IProjectWithMeta>>> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request<PaginatedResponse<IProjectWithMeta>>(`/api/projects${queryString}`);
  },

  async getProject(id: string): Promise<ApiResponse<IProjectWithMeta>> {
    return request<IProjectWithMeta>(`/api/projects/${id}`);
  },

  async createProject(data: CreateProjectInput): Promise<ApiResponse<IProject>> {
    return request<IProject>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateProject(
    id: string,
    data: UpdateProjectInput
  ): Promise<ApiResponse<IProject>> {
    return request<IProject>(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return request<void>(`/api/projects/${id}`, {
      method: "DELETE",
    });
  },

  async addMember(
    projectId: string,
    data: AddMemberInput
  ): Promise<ApiResponse<void>> {
    return request<void>(`/api/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async removeMember(
    projectId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    return request<void>(`/api/projects/${projectId}/members/${userId}`, {
      method: "DELETE",
    });
  },
};
