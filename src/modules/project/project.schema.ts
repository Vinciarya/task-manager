import { z } from "zod";
import { Role } from "@/types";

// =============================================================================
// Create project
// =============================================================================

export const createProjectSchema = z.object({
  name: z
    .string({ error: "Project name is required." })
    .min(2, "Project name must be at least 2 characters long.")
    .max(100, "Project name must not exceed 100 characters."),

  description: z
    .string()
    .max(500, "Description must not exceed 500 characters.")
    .optional(),
});

// =============================================================================
// Update project (all fields optional — PATCH semantics)
// =============================================================================

export const updateProjectSchema = createProjectSchema.partial();

// =============================================================================
// Add member
// =============================================================================

export const addMemberSchema = z.object({
  email: z
    .string({ error: "Member email is required." })
    .email("Please provide a valid email address."),

  role: z.enum([Role.ADMIN, Role.MEMBER], {
    error: `Role must be one of: ${Role.ADMIN}, ${Role.MEMBER}.`,
  }),
});

// =============================================================================
// Inferred types (re-exported for consumers)
// =============================================================================

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
