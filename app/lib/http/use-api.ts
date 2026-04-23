/**
 * use-api.ts
 * Hook imperativo para peticiones que modifican datos (POST, PUT, PATCH, DELETE).
 * Se dispara manualmente con `execute(variables)` o `executeAsync(variables)`.
 * Expone callbacks onSuccess/onError/onSettled y cancela el request en curso si se
 * llama de nuevo antes de que el anterior termine. Firma compatible con TanStack Query.
 */

import { useCallback, useRef, useState } from "react";
import type { ApiResponse } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseApiState<TData> {
  data: TData | undefined;
  error: Error | undefined;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  isIdle: boolean;
}

export interface UseApiOptions<TData, TVariables> {
  mutationFn: (variables: TVariables, signal: AbortSignal) => Promise<ApiResponse<TData>>;
  onSuccess?: (response: ApiResponse<TData>, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (
    response: ApiResponse<TData> | undefined,
    error: Error | undefined,
    variables: TVariables,
  ) => void;
}

export interface UseApiResult<TData, TVariables> extends UseApiState<TData> {
  execute: (variables: TVariables) => void;
  executeAsync: (variables: TVariables) => Promise<ApiResponse<TData>>;
  reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useApi — hook imperativo para POST / PUT / PATCH / DELETE.
 *
 * @example
 * const { execute, isPending } = useApi({
 *   mutationFn: (body) => apiClient.post("/users", body),
 *   onSuccess: () => refetch(),
 * });
 *
 * // Fire-and-forget (no espera resultado)
 * execute({ name: "Alice" });
 *
 * // Espera el resultado
 * const response = await executeAsync({ name: "Alice" });
 *
 * Migración a TanStack Query:
 *   const { mutate } = useMutation({
 *     mutationFn: (body) => apiClient.post("/users", body).then(r => r.data),
 *   });
 */
export function useApi<TData, TVariables = void>(
  options: UseApiOptions<TData, TVariables>,
): UseApiResult<TData, TVariables> {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const controllerRef = useRef<AbortController | null>(null);

  const [state, setState] = useState<UseApiState<TData>>({
    data: undefined,
    error: undefined,
    isPending: false,
    isError: false,
    isSuccess: false,
    isIdle: true,
  });

  const executeAsync = useCallback(async (variables: TVariables): Promise<ApiResponse<TData>> => {
    // Cancela el request anterior si todavía está en curso
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    setState({
      data: undefined,
      error: undefined,
      isPending: true,
      isError: false,
      isSuccess: false,
      isIdle: false,
    });

    try {
      const response = await optionsRef.current.mutationFn(variables, controllerRef.current.signal);

      setState({
        data: response.data,
        error: undefined,
        isPending: false,
        isError: false,
        isSuccess: true,
        isIdle: false,
      });

      optionsRef.current.onSuccess?.(response, variables);
      optionsRef.current.onSettled?.(response, undefined, variables);

      return response;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // Vuelve a idle si fue cancelado — no se expone como error
        setState({
          data: undefined,
          error: undefined,
          isPending: false,
          isError: false,
          isSuccess: false,
          isIdle: true,
        });
        throw err;
      }

      const error = err instanceof Error ? err : new Error(String(err));

      setState({
        data: undefined,
        error,
        isPending: false,
        isError: true,
        isSuccess: false,
        isIdle: false,
      });

      optionsRef.current.onError?.(error, variables);
      optionsRef.current.onSettled?.(undefined, error, variables);

      throw error;
    }
  }, []);

  const execute = useCallback(
    (variables: TVariables) => {
      executeAsync(variables).catch(() => {
        // Se suprime — el error queda expuesto en state.error
      });
    },
    [executeAsync],
  );

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setState({
      data: undefined,
      error: undefined,
      isPending: false,
      isError: false,
      isSuccess: false,
      isIdle: true,
    });
  }, []);

  return { ...state, execute, executeAsync, reset };
}
