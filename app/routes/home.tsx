import { Link } from "react-router";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export function meta() {
  return [{ title: "mscni — Dev Lab" }];
}

interface Module {
  title: string;
  description: string;
  path: string;
  status: "stable" | "wip";
  tags: string[];
}

const MODULES: Module[] = [
  {
    title: "HTTP Wrapper",
    description:
      "Cliente fetch personalizado con soporte de AbortController, query params, manejo de errores uniforme y hooks declarativos/imperativos compatibles con la API de TanStack Query.",
    path: "/http-demo",
    status: "stable",
    tags: ["useFetch", "useApi", "AbortManager", "HttpClient"],
  },
];

export default function Home() {
  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: { xs: 3, md: 6 } }}>
      <Typography variant="overline" color="text.secondary" letterSpacing={2}>
        mscni
      </Typography>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
        Dev Lab
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 5, maxWidth: 560 }}>
        Coleccion de demostraciones interactivas de los modulos del proyecto.
        Cada seccion muestra el codigo real que se ejecuta.
      </Typography>

      <Stack spacing={2}>
        {MODULES.map((mod) => (
          <Card key={mod.path} variant="outlined" sx={{ transition: "box-shadow 0.2s", "&:hover": { boxShadow: 4 } }}>
            <CardActionArea component={Link} to={mod.path} sx={{ p: 0 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {mod.title}
                      </Typography>
                      <Chip
                        label={mod.status === "stable" ? "estable" : "en progreso"}
                        size="small"
                        color={mod.status === "stable" ? "success" : "warning"}
                        variant="outlined"
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {mod.description}
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {mod.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" sx={{ fontFamily: "monospace", fontSize: 11 }} />
                      ))}
                    </Stack>
                  </Box>
                  <ArrowForwardIcon sx={{ color: "text.disabled", flexShrink: 0, mt: 0.5 }} />
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
