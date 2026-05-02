type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export class Logger {
  static info(message: string, details?: unknown): void {
    if (process.env.NODE_ENV !== "production") {
      Logger.write("INFO", message, details);
    }
  }

  static warn(message: string, details?: unknown): void {
    Logger.write("WARN", message, details);
  }

  static error(message: string, details?: unknown): void {
    Logger.write("ERROR", message, details);
  }

  static debug(message: string, details?: unknown): void {
    if (process.env.NODE_ENV !== "production") {
      Logger.write("DEBUG", message, details);
    }
  }

  private static write(level: LogLevel, message: string, details?: unknown): void {
    const timestamp = new Date().toISOString();
    const suffix = details === undefined ? "" : ` ${Logger.formatDetails(details)}`;
    const line = `[${level}] [${timestamp}] ${message}${suffix}`;

    if (level === "ERROR") {
      console.error(line);
      return;
    }

    if (level === "WARN") {
      console.warn(line);
      return;
    }

    console.info(line);
  }

  private static formatDetails(details: unknown): string {
    if (details instanceof Error) {
      return details.message;
    }

    if (typeof details === "string") {
      return details;
    }

    try {
      return JSON.stringify(details);
    } catch {
      return String(details);
    }
  }
}
