export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const message = getNestedString(error, ["response", "data", "message"]);
    if (message) {
      return message;
    }
  }

  return fallback;
}

export function getValidationErrors(error: unknown): Record<string, string[]> | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const errors = getNestedValue(error, ["response", "data", "errors"]);
  if (typeof errors !== "object" || errors === null || Array.isArray(errors)) {
    return null;
  }

  const fieldErrors: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(errors)) {
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      fieldErrors[key] = value;
    }
  }

  return fieldErrors;
}

function getNestedString(source: object, path: readonly string[]): string | null {
  const value = getNestedValue(source, path);
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getNestedValue(source: object, path: readonly string[]): unknown {
  let current: unknown = source;

  for (const segment of path) {
    if (typeof current !== "object" || current === null || !(segment in current)) {
      return null;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}
