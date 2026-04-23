# mscni — Dev Lab

Colección de demostraciones interactivas de módulos de arquitectura frontend: HTTP wrapper, gestión de estado, autenticación, y más.

Stack: **React Router v7** (SPA) · **TypeScript** · **MUI v6** · **Zustand v5**

## Inicio rápido

```bash
npm install
npm run dev        # http://localhost:5173
```

Para verificar tipos:

```bash
npm run typecheck
```

---

## Demostraciones

### HTTP Wrapper — `/http-demo`

Cliente `fetch` personalizado con cancelación, manejo de errores uniforme y hooks compatibles con la API de TanStack Query.

| Sección | Qué demuestra |
|---|---|
| 1. `useFetch` GET + params | Request declarativo con AbortController automático. Cambiar `_limit` cancela el request anterior. |
| 2. `useFetch` + `enabled` | Query dependiente: el fetch solo se lanza cuando `enabled: true`. Simula `enabled: !!id` de TanStack Query. |
| 3. `useApi` — `execute` | Mutación POST fire-and-forget. Estados: `isIdle` → `isPending` → `isSuccess / isError`. |
| 4. `useApi` — `executeAsync` | Igual que `execute` pero retorna una `Promise` — permite `await` y encadenar lógica. |
| 5. `AbortManager` | Cancelación de requests en vuelo con clave. `abortManager.abort(key)` interrumpe sin propagar error al estado del hook. |

**Archivos clave:**

```
app/lib/http/
├── client.ts          # HttpClient + singleton apiClient
├── types.ts           # RequestOptions, ApiResponse, ApiError
├── use-fetch.ts       # Hook declarativo GET
├── use-api.ts         # Hook imperativo POST/PUT/PATCH/DELETE
├── abort-manager.ts   # AbortManager con mapa de keys
└── README.md          # Docs de uso y guía de migración a TanStack Query
```

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL del BFF / API. En dev usa el proxy de Vite. | `/api` |

El proxy de Vite reenvía `/api/*` → `https://jsonplaceholder.typicode.com` (configurado en `vite.config.ts`).

- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
