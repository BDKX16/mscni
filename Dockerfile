# ── Etapa 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias primero (aprovecha cache de capas)
COPY package*.json ./
RUN npm ci

# Copiar fuentes
COPY . .

# VITE_API_BASE_URL=/api -> las peticiones van a /api/* en el cliente
# nginx se encarga de proxearlas a jsonplaceholder en produccion
ENV VITE_API_BASE_URL=/api

RUN npm run build

# ── Etapa 2: serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Configuracion de nginx con proxy /api y fallback SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar solo los archivos estaticos generados (SPA = build/client)
COPY --from=builder /app/build/client /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]