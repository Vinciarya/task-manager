import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL").min(1, "NEXTAUTH_URL is required"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NODE_ENV: process.env.NODE_ENV,
};

const parsed = envSchema.safeParse(processEnv);

if (!parsed.success) {
  const fieldErrors = parsed.error.flatten().fieldErrors;
  const errorDetails = Object.entries(fieldErrors)
    .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
    .join("; ");
    
  throw new Error(`Missing or invalid environment variables: ${errorDetails}`);
}

export const env: Readonly<Env> = Object.freeze(parsed.data);
