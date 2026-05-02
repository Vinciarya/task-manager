import { z } from "zod";
import { TaskStatus, TaskPriority } from "@/types";

// =============================================================================
// Create task
// =============================================================================

export const createTaskSchema = z.object({
  title: z
    .string({ error: "Title is required." })
    .min(3, "Title must be at least 3 characters long.")
    .max(200, "Title must not exceed 200 characters."),

  description: z
    .string()
    .max(2000, "Description must not exceed 2000 characters.")
    .optional(),

  status: z
    .enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE], {
      error: `Status must be one of: ${Object.values(TaskStatus).join(", ")}.`,
    })
    .optional(),

  priority: z
    .enum([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH], {
      error: `Priority must be one of: ${Object.values(TaskPriority).join(", ")}.`,
    })
    .optional(),

  /**
   * Accepts ISO strings, timestamps, or Date objects from the request body.
   * z.coerce.date() handles the conversion; the refinement then guards that
   * the date lies in the future (relative to when the request is processed).
   */
  dueDate: z
    .coerce
    .date({ error: "Due date must be a valid date." })
    .refine((d) => d > new Date(), {
      message: "Due date must be a future date.",
    })
    .optional(),

  assignedToId: z
    .string({ error: "Assigned user ID must be a string." })
    .cuid("Assigned user ID must be a valid CUID.")
    .optional(),

  /** The project this task belongs to — required at creation time. */
  projectId: z
    .string({ error: "Project ID is required." })
    .cuid("Project ID must be a valid CUID."),
});

// =============================================================================
// Update task (all fields optional — PATCH semantics)
// =============================================================================

export const updateTaskSchema = createTaskSchema
  .omit({ projectId: true })   // projectId cannot change after creation
  .partial();

// =============================================================================
// Quick status update
// =============================================================================

/** Lightweight schema for the dedicated status-change endpoint. */
export const updateStatusSchema = z.object({
  status: z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE], {
    error: `Status must be one of: ${Object.values(TaskStatus).join(", ")}.`,
  }),
});

// =============================================================================
// Task filter / list query
// =============================================================================

export const taskFilterSchema = z.object({
  projectId: z
    .string({ error: "Project ID is required." })
    .cuid("Project ID must be a valid CUID."),

  status: z
    .enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE], {
      error: `Status must be one of: ${Object.values(TaskStatus).join(", ")}.`,
    })
    .optional(),

  priority: z
    .enum([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH], {
      error: `Priority must be one of: ${Object.values(TaskPriority).join(", ")}.`,
    })
    .optional(),

  /** When `true`, only returns tasks that are past their due date and not DONE. */
  overdue: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => (typeof v === "string" ? v === "true" : v))
    .optional(),

  assignedToId: z
    .string()
    .cuid("Assigned user ID must be a valid CUID.")
    .optional(),

  page: z
    .coerce
    .number({ error: "Page must be a number." })
    .int("Page must be an integer.")
    .min(1, "Page must be at least 1.")
    .default(1),

  limit: z
    .coerce
    .number({ error: "Limit must be a number." })
    .int("Limit must be an integer.")
    .min(1, "Limit must be at least 1.")
    .max(100, "Limit must not exceed 100.")
    .default(20),
});

// =============================================================================
// Inferred types
// =============================================================================

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type TaskFilters = z.infer<typeof taskFilterSchema>;
