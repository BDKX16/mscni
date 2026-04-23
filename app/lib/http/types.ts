/**
 * types.ts
 * Define los tipos compartidos por todo el módulo HTTP:
 * - RequestOptions: opciones que acepta cualquier request (params, body, signal, etc.)
 * - ApiResponse: envoltura tipada de la respuesta exitosa
 * - ApiError: error enriquecido con status, url y body para manejo centralizado de errores
 */

// ─── Request ────────────────────────────────────────────────────────────────

export interface RequestOptions<TBody = unknown> extends Omit<RequestInit, "body" | "signal"> {
  /** Query params que se añaden a la URL */
  params?: Record<string, string | number | boolean | null | undefined>;
  /** Body del request — se serializa a JSON automáticamente */
  body?: TBody;
  /** AbortSignal para cancelar el request */
  signal?: AbortSignal;
}

// ─── Response ───────────────────────────────────────────────────────────────

export interface ApiResponse<TData> {
  data: TData;
  status: number;
  headers: Headers;
}

// ─── Error ──────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  readonly status: number;
  readonly url: string;
  readonly body: unknown;

  constructor(message: string, status: number, url: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
    this.body = body;
  }
}
