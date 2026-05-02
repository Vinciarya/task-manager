import type { IProject, IProjectMember, TaskStatus } from "@/types";

// Re-export inferred Zod types so consumers import from one place.
export type {
  CreateProjectInput,
  UpdateProjectInput,
  AddMemberInput,
} from "@/modules/project/project.schema";

// =============================================================================
// ProjectWithMeta
// =============================================================================

/**
 * IProject enriched with live-computed aggregates fetched by the repository.
 * Mirrors {@link IProjectWithMeta} from `@/types` but is scoped here so the
 * module can evolve the shape independently.
 */
export interface ProjectWithMeta extends IProject {
  /** Total number of members (including the owner). */
  memberCount: number;
  /** Task counts broken down by status. */
  taskCounts: Record<TaskStatus, number>;
}

// =============================================================================
// ProjectWithDetails
// =============================================================================

/**
 * Full project record used by the single-project detail endpoint.
 * Includes the resolved member list with nested user info.
 */
export interface ProjectWithDetails extends IProject {
  members: IProjectMember[];
  memberCount: number;
  taskCounts: Record<TaskStatus, number>;
}
