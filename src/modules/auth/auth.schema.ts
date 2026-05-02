import { z } from "zod";

// =============================================================================
// Register schema
// =============================================================================

export const registerSchema = z.object({
  name: z
    .string({ error: "Name is required." })
    .min(2, "Name must be at least 2 characters long.")
    .max(100, "Name must not exceed 100 characters."),

  email: z
    .string({ error: "Email is required." })
    .email("Please enter a valid email address.")
    .max(255, "Email must not exceed 255 characters."),

  password: z
    .string({ error: "Password is required." })
    .min(8, "Password must be at least 8 characters long.")
    .max(72, "Password must not exceed 72 characters.")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number."
    ),
});

// =============================================================================
// Login schema
// =============================================================================

export const loginSchema = z.object({
  email: z
    .string({ error: "Email is required." })
    .email("Please enter a valid email address."),

  password: z
    .string({ error: "Password is required." })
    .min(1, "Password is required."),
});

// =============================================================================
// Inferred types (re-exported for consumers)
// =============================================================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
