# ShellDeck API image. Build context = repository root:
#   docker build -f infra/docker/api.Dockerfile -t shelldeck-api .

###############
# Build stage #
###############
FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Dependency manifests first (layer cache). pnpm-lock.yaml is optional on a fresh clone.
COPY backend/package.json backend/pnpm-lock.yaml* backend/.npmrc ./
RUN pnpm install

COPY backend/tsconfig.json backend/tsconfig.build.json ./
COPY backend/src/ ./src/

RUN pnpm build
RUN pnpm prune --prod --ignore-scripts

#################
# Runtime stage #
#################
FROM node:22-alpine AS runtime

RUN apk add --no-cache dumb-init \
 && addgroup -g 1001 -S appgroup \
 && adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/package.json ./

USER appuser

ENV NODE_ENV=production
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8080) + '/api/v1/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
