/**
 * client.ts
 * Clase HttpClient que encapsula fetch con soporte de baseURL, headers por defecto,
 * query params, serialización/deserialización JSON y manejo de errores uniforme.
 * Exporta el singleton `apiClient` listo para usar en toda la aplicación.
 * Para añadir autenticación: apiClient.withAuth(token).get("/users")
 */

import { ApiError, type ApiResponse, type RequestOptions } from "./types";

export class HttpClient {
  private readonly baseURL: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor(baseURL: string, defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
    this.defaultHeaders = defaultHeaders;
  }

  // ─── Core ─────────────────────────────────────────────────────────────────

  private async _request<TData, TBody = unknown>(
    method: string,
    path: string,
    options: RequestOptions<TBody> = {},
  ): Promise<ApiResponse<TData>> {
    const { params, body, signal, headers: extraHeaders, ...restInit } = options;

    // Construye la URL con query params
    // Soporta tanto baseURL absoluta ("https://api.example.com") como relativa ("/api")
    const fullPath = `${this.baseURL}${path.startsWith("/") ? path : `/${path}`}`;
    const isAbsolute = /^https?:\/\//.test(fullPath);
    const base = isAbsolute ? undefined : (typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const url = new URL(fullPath, base);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.defaultHeaders,
      ...(extraHeaders as Record<string, string> | undefined),
    };

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      ...restInit,
    });

    // Parsea el body independientemente del status (las respuestas de error también pueden traer detalle)
    let responseBody: unknown;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    if (!response.ok) {
      throw new ApiError(
        `HTTP ${response.status} — ${response.statusText}`,
        response.status,
        url.toString(),
        responseBody,
      );
    }

    return {
      data: responseBody as TData,
      status: response.status,
      headers: response.headers,
    };
  }

  // ─── Métodos públicos ──────────────────────────────────────────────────────

  get<TData>(path: string, options?: Omit<RequestOptions, "body">): Promise<ApiResponse<TData>> {
    return this._request<TData>("GET", path, options);
  }

  post<TData, TBody = unknown>(path: string, body?: TBody, options?: RequestOptions<TBody>): Promise<ApiResponse<TData>> {
    return this._request<TData, TBody>("POST", path, { ...options, body });
  }

  put<TData, TBody = unknown>(path: string, body?: TBody, options?: RequestOptions<TBody>): Promise<ApiResponse<TData>> {
    return this._request<TData, TBody>("PUT", path, { ...options, body });
  }

  patch<TData, TBody = unknown>(path: string, body?: TBody, options?: RequestOptions<TBody>): Promise<ApiResponse<TData>> {
    return this._request<TData, TBody>("PATCH", path, { ...options, body });
  }

  delete<TData>(path: string, options?: RequestOptions): Promise<ApiResponse<TData>> {
    return this._request<TData>("DELETE", path, options);
  }

  // ─── Helpers de autenticación ───────────────────────────────────────────────

  /** Devuelve una nueva instancia del client con el header Authorization Bearer configurado */
  withAuth(token: string): HttpClient {
    return new HttpClient(this.baseURL, {
      ...this.defaultHeaders,
      Authorization: `Bearer ${token}`,
    });
  }
}

// Singleton — components call apiClient.get("/users") directly
// When migrating to TanStack Query:
//   queryFn: ({ signal }) => apiClient.get("/users", { signal })
export const apiClient = new HttpClient(
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
);
