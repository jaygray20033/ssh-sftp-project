# ShellDeck web image (React SPA + nginx). Build context = repository root:
#   docker build -f infra/docker/web.Dockerfile -t shelldeck-web .

###############
# Build stage #
###############
FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

COPY frontend/package.json frontend/pnpm-lock.yaml* ./
RUN pnpm install

COPY frontend/ ./

# Relative URL: nginx in this image proxies /api to the backend.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm build

#################
# Runtime stage #
#################
FROM nginx:1.27-alpine AS runtime

# SPA fallback (try_files ... /index.html) and the /api proxy live in this nginx config.
COPY infra/nginx/web.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1
