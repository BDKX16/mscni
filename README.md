# HTTP Wrapper

## Features

| Feature | Descripción |
|---|---|
| **Cancelación automática** | Cada `useFetch` crea un `AbortController` que se activa al desmontar el componente o cambiar params — sin memory leaks ni race conditions |
| **Queries dependientes** | `enabled: false` evita el request hasta que los datos necesarios estén disponibles |
| **Tipado end-to-end** | `useFetch<User[]>` / `useApi<User, CreateDto>` — sin `any`, errores de tipo en compile time |
| **Estado declarativo** | `isLoading`, `isError`, `isSuccess` listos para renderizar — sin boilerplate de `useState` manual |
| **Errores normalizados** | `ApiError` siempre incluye `status`, `url` y `body` — el mismo shape independientemente del endpoint |
| **Refetch manual** | `refetch()` relanza el mismo request sin recargar la página |
| **Actions con callbacks** | `onSuccess`, `onError`, `onSettled` + `execute` (fire-and-forget) y `executeAsync` (awaitable) |
| **AbortManager** | Para requests imperativos repetidos: cancela el anterior automáticamente usando la misma key |
| **Preparado para TanStack Query** | Firmas compatibles — migrar es cambiar el import, no reescribir la lógica |

## Ventajas sobre `fetch` directo en un `useEffect`

```ts
// ❌ Sin wrapper — 15 líneas de boilerplate por cada request
useEffect(() => {
  let cancelled = false;
  setLoading(true);
  fetch("/users")
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(data => { if (!cancelled) setData(data); })
    .catch(err => { if (!cancelled) setError(err); })
    .finally(() => { if (!cancelled) setLoading(false); });
  return () => { cancelled = true; };
}, []);

// ✅ Con wrapper — 1 línea
const { data, isLoading, error } = useFetch<User[]>("/users");
```

- Sin el flag `cancelled` manual para evitar actualizar estado tras desmontar
- Sin try/catch repetido en cada componente
- Sin gestión manual de `loading` / `error` states
- Sin olvidarse de abortar en el cleanup

```ts
// GET
const { data, isLoading, error } = useFetch<User[]>("/users");

// GET con query params
const { data } = useFetch<User[]>("/users", { params: { page: 1, limit: 20 } });

// GET condicional (espera hasta que `id` exista)
const { data } = useFetch<User>(`/users/${id}`, { enabled: !!id });

// Refetch manual — vuelve a ejecutar el mismo request
// útil tras un execute o para un botón "recargar"
const { data, refetch } = useFetch<User[]>("/users");
<button onClick={refetch}>Recargar</button>

// POST / PUT / PATCH / DELETE
const { execute, isPending } = useApi({
  mutationFn: (body: CreateUserDto) => apiClient.post("/users", body),
  onSuccess: () => refetch(),
});
```

> El `AbortController` se gestiona automáticamente — el request se cancela al desmontar el componente o al cambiar el path/params.
