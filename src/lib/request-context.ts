import { AppError } from "@/lib/errors";

export function getRequiredUserId(headers: Headers): string {
  const userId = headers.get("x-user-id");

  if (!userId) {
    throw AppError.unauthorized("Authentication is required.");
  }

  return userId;
}
