/**
 * abort-manager.ts
 * Gestiona AbortControllers asociados a requests en curso identificados por clave.
 * Permite cancelar un request específico (abort(key)) o todos a la vez (abortAll()),
 * lo que es útil para limpiar requests al cambiar de ruta o desmontar vistas.
 *
 * Uso:
 *   const controller = abortManager.create("users-list");
 *   apiClient.get("/users", { signal: controller.signal });
 *   // más tarde:
 *   abortManager.abort("users-list");
 */
export class AbortManager {
  private readonly controllers = new Map<string, AbortController>();

  /** Crea (o reemplaza) un AbortController para la key indicada */
  create(key: string): AbortController {
    this.abort(key); // cancela el request anterior con la misma key
    const controller = new AbortController();
    this.controllers.set(key, controller);
    return controller;
  }

  /** Cancela el request asociado a la key (si existe) */
  abort(key: string): void {
    this.controllers.get(key)?.abort();
    this.controllers.delete(key);
  }

  /** Cancela todos los requests en curso */
  abortAll(): void {
    this.controllers.forEach((controller) => controller.abort());
    this.controllers.clear();
  }
}

export const abortManager = new AbortManager();
