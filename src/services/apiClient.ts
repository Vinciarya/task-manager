import { request } from "@/services/api.client";

const apiClient = {
  get: <T = unknown>(url: string): Promise<Awaited<ReturnType<typeof request<T>>>> =>
    request<T>(url),
  post: <T = unknown>(
    url: string,
    data: unknown
  ): Promise<Awaited<ReturnType<typeof request<T>>>> =>
    request<T>(url, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: <T = unknown>(url: string): Promise<Awaited<ReturnType<typeof request<T>>>> =>
    request<T>(url, {
      method: "DELETE",
    }),
};

export default apiClient;
