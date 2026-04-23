/**
 * use-fetch.ts
 * Hook declarativo para peticiones GET. Ejecuta el request automáticamente al montar
 * el componente y lo cancela (AbortController) al desmontarlo o al cambiar path/params.
 * Soporta `enabled` para queries dependientes. Devuelve `refetch` para actualizaciones manuales.
 * Su firma es compatible con TanStack Query para facilitar la migración futura.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResponse, RequestOptions } from "./types";
import { apiClient } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseFetchState<TData> {
  data: TData | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

export interface UseFetchOptions extends Omit<RequestOptions, "body" | "signal"> {
  /**
   * Poner en false omite el request (útil para queries dependientes).
   * @default true
   */
  enabled?: boolean;
  /** Se llama tras un fetch exitoso */
  onSuccess?: (data: ApiResponse<unknown>) => void;
  /** Se llama tras un fetch fallido */
  onError?: (error: Error) => void;
}

export interface UseFetchResult<TData> extends UseFetchState<TData> {
  /** Vuelve a lanzar el request manualmente */
  refetch: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useFetch — hook declarativo para fetch de datos con cancelación automática.
 *
 * @example
 * const { data, isLoading, error } = useFetch<User[]>("/users");
 * const { data } = useFetch<User[]>("/users", { params: { page: 1 } });
 * const { data } = useFetch<User>(`/users/${id}`, { enabled: !!id });
 *
 * Migración a TanStack Query:
 *   const { data } = useQuery({
 *     queryKey: ["/users", params],
 *     queryFn: ({ signal }) => apiClient.get("/users", { signal, params }),
 *   });
 */
export function useFetch<TData>(
  path: string,
  options: UseFetchOptions = {},
): UseFetchResult<TData> {
  const { enabled = true, onSuccess, onError, ...requestOptions } = options;

  const [state, setState] = useState<UseFetchState<TData>>({
    data: undefined,
    error: undefined,
    isLoading: enabled,
    isError: false,
    isSuccess: false,
  });

  // Ref estable para que los callbacks no relancen el effect al cambiar
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  // Token de disparo — al incrementarlo fuerza un refetch
  const [trigger, setTrigger] = useState(0);

  // Serializa los params para compararlos como dependencia del effect
  const paramsKey = JSON.stringify(requestOptions.params ?? null);

  const execute = useCallback(() => {
    setTrigger((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const controller = new AbortController();

    setState((prev) => ({ ...prev, isLoading: true, isError: false, error: undefined }));

    apiClient
      .get<TData>(path, { ...requestOptions, signal: controller.signal })
      .then((response) => {
        setState({
          data: response.data,
          error: undefined,
          isLoading: false,
          isError: false,
          isSuccess: true,
        });
        onSuccessRef.current?.(response as ApiResponse<unknown>);
      })
      .catch((err: unknown) => {
        // Se ignoran los AbortError — son esperados al desmontar o navegar
        if (err instanceof Error && err.name === "AbortError") return;

        const error = err instanceof Error ? err : new Error(String(err));
        setState({
          data: undefined,
          error,
          isLoading: false,
          isError: true,
          isSuccess: false,
        });
        onErrorRef.current?.(error);
      });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, paramsKey, enabled, trigger]);

  return { ...state, refetch: execute };
}
