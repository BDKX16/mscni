import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { HttpClient } from "~/lib/http/client";
import { useApi } from "~/lib/http/use-api";
import { useFetch } from "~/lib/http/use-fetch";
import { abortManager } from "~/lib/http/abort-manager";

// El cliente local del demo usa el proxy de Vite (/api -> jsonplaceholder)
const api = new HttpClient("/api");

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

// ─── CodeBlock estilo VS Code ─────────────────────────────────────────────────

const TOKENS: [RegExp, string][] = [
  [/^(\/\/.*)/, "#6a9955"],
  [/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/, "#ce9178"],
  [/^\b(const|let|function|return|async|await|try|catch|new|import|from|export|default|void|if)\b/, "#c586c0"],
  [/^\b(true|false|null|undefined)\b/, "#569cd6"],
  [/^\b([A-Z][a-zA-Z0-9]*)\b/, "#4ec9b0"],
  [/^\b([a-z][a-zA-Z0-9]*)(?=\()/, "#dcdcaa"],
  [/^([{}()[\];,.<>:=+\-!|&?])/, "#d4d4d4"],
  [/^\b(\d+)\b/, "#b5cea8"],
  [/^\b([a-z][a-zA-Z0-9_]*)\b/, "#9cdcfe"],
];

function tokenizeLine(text: string): { v: string; c: string }[] {
  const out: { v: string; c: string }[] = [];
  let rest = text;
  while (rest.length > 0) {
    let hit = false;
    for (const [re, color] of TOKENS) {
      const m = rest.match(re);
      if (m) { out.push({ v: m[0], c: color }); rest = rest.slice(m[0].length); hit = true; break; }
    }
    if (!hit) { out.push({ v: rest[0], c: "#d4d4d4" }); rest = rest.slice(1); }
  }
  return out;
}

function CodeBlock({ code }: { code: string }) {
  const lines = code.replace(/^\n/, "").trimEnd().split("\n");
  return (
    <Box sx={{ mt: 2, borderRadius: 1, overflow: "hidden", border: "1px solid #3c3c3c", fontFamily: "'Cascadia Code','Fira Code','Consolas',monospace", fontSize: 13, lineHeight: 1.65 }}>
      <Box sx={{ bgcolor: "#252526", px: 2, py: 0.75, display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#ff5f57" }} />
        <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#febc2e" }} />
        <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#28c840" }} />
        <Typography variant="caption" sx={{ ml: 1, color: "#858585", fontFamily: "inherit" }}>demo.tsx</Typography>
      </Box>
      <Box sx={{ bgcolor: "#1e1e1e", py: 1, overflowX: "auto" }}>
        {lines.map((line, i) => (
          <Box key={i} sx={{ display: "flex", "&:hover": { bgcolor: "#2a2d2e" } }}>
            <Box sx={{ minWidth: 36, textAlign: "right", pr: 2, color: "#5a5a5a", userSelect: "none", fontFamily: "inherit", flexShrink: 0 }}>
              {i + 1}
            </Box>
            <Box sx={{ flex: 1, pr: 2, whiteSpace: "pre" }}>
              {tokenizeLine(line).map((t, j) => <span key={j} style={{ color: t.c }}>{t.v}</span>)}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Demo principal ───────────────────────────────────────────────────────────

export default function HttpDemo() {
  // 1. useFetch — GET lista con params + refetch
  const [limit, setLimit] = useState(3);
  const posts = useFetch<Post[]>("/posts", { params: { _limit: limit } });

  // 2. useFetch — query dependiente (enabled)
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [postPath, setPostPath] = useState<string | null>(null);
  const postEnabled = postPath !== null;
  const singlePost = useFetch<Post>(postPath ?? "", { enabled: postEnabled });

  // 3. useApi — POST (fire-and-forget)
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const createPost = useApi<Post, { title: string; body: string; userId: number }>({
    mutationFn: (vars, signal) => api.post("/posts", vars, { signal }),
  });

  // 4. useApi — executeAsync (awaitable)
  const [log, setLog] = useState<string[]>([]);
  const asyncOp = useApi<Post, void>({
    mutationFn: (_v, signal) =>
      api.post("/posts", { title: "async test", body: "demo", userId: 1 }, { signal }),
  });

  const handleAsync = async () => {
    setLog([]);
    try {
      setLog((l) => [...l, "Lanzando executeAsync..."]);
      const res = await asyncOp.executeAsync();
      setLog((l) => [...l, `id: ${res.data.id} — status HTTP: ${res.status}`]);
      setLog((l) => [...l, "Desde aqui puedes redirigir, mostrar un toast, etc."]);
    } catch {
      setLog((l) => [...l, "Error al ejecutar"]);
    }
  };

  // 5. AbortManager — cancelar request en vuelo
  const ABORT_KEY = "demo-slow-request";
  const [abortLog, setAbortLog] = useState<string[]>([]);
  const abortTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowOp = useApi<Post, void>({
    mutationFn: (_v, signal) =>
      new Promise((resolve, reject) => {
        const controller = abortManager.create(ABORT_KEY);
        signal.addEventListener("abort", () => controller.abort());
        abortTimerRef.current = setTimeout(() => {
          resolve({ data: { id: 999, title: "slow post", body: "", userId: 1 }, status: 201, headers: new Headers() });
        }, 4000);
        controller.signal.addEventListener("abort", () => {
          if (abortTimerRef.current) clearTimeout(abortTimerRef.current);
          const err = new Error("AbortError");
          err.name = "AbortError";
          reject(err);
        });
      }),
    onSuccess: () => setAbortLog((l) => [...l, "Completado sin cancelar"]),
  });

  const handleSlowStart = () => {
    setAbortLog(["Iniciado (4 segundos simulados)..."]);
    slowOp.execute();
  };

  const handleAbort = () => {
    abortManager.abort(ABORT_KEY);
    setAbortLog((l) => [...l, "abortManager.abort() llamado — request cancelado"]);
    slowOp.reset();
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        HTTP Module Demo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        API publica: <code>jsonplaceholder.typicode.com</code>
      </Typography>

      <Stack spacing={3}>

        {/* 1. useFetch GET con params + refetch */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>1. useFetch — GET lista con params + refetch</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
              {[3, 5, 10].map((n) => (
                <Button key={n} size="small"
                  variant={limit === n ? "contained" : "outlined"}
                  onClick={() => setLimit(n)}
                >
                  _limit={n}
                </Button>
              ))}
              <Button size="small" onClick={posts.refetch} disabled={posts.isLoading}>
                Refetch
              </Button>
              {posts.isLoading && <CircularProgress size={16} />}
            </Stack>
            {posts.isError && <Alert severity="error">{posts.error?.message}</Alert>}
            {posts.data?.map((p) => (
              <Box key={p.id} sx={{ py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="body2" component="div">
                  <Chip label={`#${p.id}`} size="small" sx={{ mr: 1 }} />
                  {p.title}
                </Typography>
              </Box>
            ))}
            <Divider sx={{ mt: 2 }} />
            <CodeBlock code={`
// useFetch usa apiClient (VITE_API_BASE_URL) con AbortController automatico
const posts = useFetch<Post[]>("/posts", { params: { _limit: limit } });

// Al cambiar params se cancela el request anterior y lanza uno nuevo
// refetch() fuerza un nuevo fetch sin cambiar los params
posts.refetch();

// Retorna: { data, isLoading, isError, isSuccess, error, refetch }
`} />
          </CardContent>
        </Card>

        {/* 2. useFetch — query dependiente (enabled) */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              2. useFetch — query dependiente con <code>enabled</code>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              El request no se lanza hasta pulsar "Buscar". Usa la opcion{" "}
              <code>{"enabled: !!postPath"}</code> nativa de useFetch.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
              <TextField
                label="Post ID (1-100)"
                type="number"
                size="small"
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value ? Number(e.target.value) : "");
                  setPostPath(null);
                }}
                sx={{ width: 160 }}
              />
              <Button
                variant="contained"
                disabled={!selectedId || (postEnabled && singlePost.isLoading)}
                onClick={() => setPostPath(`/posts/${selectedId}`)}
              >
                {postEnabled && singlePost.isLoading ? <CircularProgress size={18} /> : "Buscar"}
              </Button>
            </Stack>
            {postEnabled && singlePost.isError && (
              <Alert severity="error">{singlePost.error?.message}</Alert>
            )}
            {postEnabled && singlePost.data && (
              <Box>
                <Typography variant="subtitle2">
                  #{singlePost.data.id} — {singlePost.data.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {singlePost.data.body}
                </Typography>
              </Box>
            )}
            {!postEnabled && (
              <Typography variant="body2" color="text.disabled">
                Introduce un ID y pulsa Buscar para lanzar el request
              </Typography>
            )}
            <Divider sx={{ mt: 2 }} />
            <CodeBlock code={`
const [postPath, setPostPath] = useState<string | null>(null);

// enabled: false -> no fetcha, isLoading arranca en false
const singlePost = useFetch<Post>(postPath ?? "", { enabled: !!postPath });

// Solo al setear postPath se activa el fetch
const handleBuscar = () => setPostPath(\`/posts/\${selectedId}\`);
`} />
          </CardContent>
        </Card>

        {/* 3. useApi — execute POST */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              3. useApi — <code>execute</code> (POST)
            </Typography>
            <Stack spacing={1.5}>
              <TextField label="Titulo" size="small" value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)} />
              <TextField label="Body" size="small" multiline rows={2} value={newBody}
                onChange={(e) => setNewBody(e.target.value)} />
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  disabled={!newTitle || createPost.isPending}
                  onClick={() => createPost.execute({ title: newTitle, body: newBody, userId: 1 })}
                >
                  {createPost.isPending ? <CircularProgress size={18} /> : "Crear post"}
                </Button>
                {(createPost.isSuccess || createPost.isError) && (
                  <Button variant="text" onClick={createPost.reset}>Reset</Button>
                )}
              </Stack>
              {createPost.isError && <Alert severity="error">{createPost.error?.message}</Alert>}
              {createPost.isSuccess && createPost.data && (
                <Alert severity="success">
                  Creado con id <strong>{createPost.data.id}</strong>:{" "}
                  <em>{createPost.data.title}</em>
                </Alert>
              )}
            </Stack>
            <Divider sx={{ mt: 2 }} />
            <CodeBlock code={`
const createPost = useApi<Post, { title: string; body: string; userId: number }>({
  mutationFn: (vars, signal) => api.post("/posts", vars, { signal }),
});

// execute() es fire-and-forget: no lanza si aborta
createPost.execute({ title, body, userId: 1 });

// Estados: isIdle | isPending | isSuccess | isError
// createPost.reset() vuelve a isIdle
`} />
          </CardContent>
        </Card>

        {/* 4. useApi — executeAsync */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              4. useApi — <code>executeAsync</code> (awaitable)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Devuelve una Promise — util para encadenar logica despues de la respuesta.
            </Typography>
            <Stack spacing={1}>
              <Button
                variant="outlined"
                onClick={handleAsync}
                disabled={asyncOp.isPending}
                sx={{ alignSelf: "flex-start" }}
              >
                {asyncOp.isPending ? <CircularProgress size={18} /> : "Ejecutar y esperar resultado"}
              </Button>
              {log.map((line, i) => (
                <Typography key={i} variant="body2" sx={{ fontFamily: "monospace" }}>{line}</Typography>
              ))}
            </Stack>
            <Divider sx={{ mt: 2 }} />
            <CodeBlock code={`
import { useSnackbar } from "notistack";

const { enqueueSnackbar } = useSnackbar();

const asyncOp = useApi<Post, void>({
  mutationFn: (_v, signal) => api.post("/posts", { title: "async test" }, { signal }),
});

// executeAsync() lanza si el request falla -> capturamos con try/catch
const handleSubmit = async () => {
  try {
    const res = await asyncOp.executeAsync();
    enqueueSnackbar(\`Post #\${res.data.id} creado\`, { variant: "success" });
    navigate("/posts");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    enqueueSnackbar(msg, { variant: "error" });
  }
};
`} />
          </CardContent>
        </Card>

        {/* 5. AbortManager */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              5. AbortManager — cancelar request en vuelo
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Inicia un request simulado de 4 segundos. Pulsa{" "}
              <strong>Cancelar</strong> antes de que termine para ver como{" "}
              <code>abortManager.abort(key)</code> lo interrumpe sin propagar
              error al estado del hook.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
              <Button variant="contained" disabled={slowOp.isPending} onClick={handleSlowStart}>
                {slowOp.isPending ? <CircularProgress size={18} /> : "Iniciar (4 s)"}
              </Button>
              <Button variant="outlined" color="error" disabled={!slowOp.isPending} onClick={handleAbort}>
                Cancelar
              </Button>
            </Stack>
            {abortLog.map((line, i) => (
              <Typography key={i} variant="body2" sx={{ fontFamily: "monospace" }}>{line}</Typography>
            ))}
            <Divider sx={{ mt: 2 }} />
            <CodeBlock code={`
// AbortManager mantiene un Map<string, AbortController>
// create(key) cancela el controller previo con la misma clave
const controller = abortManager.create("demo-slow-request");

// Para cancelar desde cualquier parte de la UI:
abortManager.abort("demo-slow-request");

// El AbortError es capturado internamente por useApi
// -> el estado vuelve a isIdle sin exponer el error en isError
`} />
          </CardContent>
        </Card>

      </Stack>
    </Box>
  );
}
