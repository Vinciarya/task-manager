// =============================================================================
// Enums
// =============================================================================

export enum Role {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

// =============================================================================
// Domain Interfaces
// =============================================================================

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProject {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectMember {
  userId: string;
  projectId: string;
  role: Role;
  joinedAt: Date;
  user?: IUser;
}

export interface ITask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  projectId: string;
  assignedToId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/** IProject enriched with aggregated metadata. */
export interface IProjectWithMeta extends IProject {
  memberCount: number;
  taskCounts: Record<TaskStatus, number>;
}

// =============================================================================
// API Types
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  statusCode: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================================================
// Auth Types
// =============================================================================

/** Minimal user shape stored in the session / JWT. */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }

  // `User` is the shape returned by the `authorize` / OAuth profile callbacks.
  interface User extends SessionUser {}
}

declare module "next-auth/jwt" {
  interface JWT extends SessionUser {}
}
