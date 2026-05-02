import { ApiResponse } from "@/types";

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public data: unknown = null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Base fetch wrapper that handles automatic JSON headers, auth parsing,
 * and standardizing error responses.
 */
export async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers);

  // Automatically set JSON content type if not provided
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    // Include credentials for NextAuth to work automatically on the client side
    credentials: options.credentials || "include",
  };

  // If we are on the server side
  if (typeof window === "undefined") {
    if (url.startsWith("/")) {
      const baseUrl =
        process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000";
      url = `${baseUrl}${url}`;
    }

    try {
      const { cookies } = await import("next/headers");
      // Use cookies to pass the session for server components
      const cookieStore = await cookies();
      const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");
      
      if (cookieHeader) {
        headers.set("cookie", cookieHeader);
      }
    } catch (e) {
      // Ignore if not running in a context where next/headers is available
    }
  }

  try {
    const response = await fetch(url, fetchOptions);

    let data: any;
    const isJson = response.headers.get("content-type")?.includes("application/json");

    if (isJson) {
      data = await response.json();
    }

    if (!response.ok) {
      throw new ApiError(
        data?.message || response.statusText || "An error occurred",
        response.status,
        data?.data
      );
    }

    // Wrap in ApiResponse shape if it isn't already (though our backend always returns it)
    if (data && typeof data === "object" && "success" in data) {
      return data as ApiResponse<T>;
    }

    return {
      success: true,
      message: "Success",
      data: data as T,
      statusCode: response.status,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Network error",
      500
    );
  }
}
