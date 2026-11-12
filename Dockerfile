# syntax=docker/dockerfile:1

ARG NODE_VERSION=22

# ---- Build stage -----------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS build

WORKDIR /app

# Prisma needs OpenSSL to detect and run its query engine.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma

# Prisma's postinstall needs the schema (copied above) to generate the client.
RUN npm ci

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npx prisma generate \
  && npm run build \
  && npm prune --omit=dev

# ---- Runtime stage ---------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# OpenSSL is required by the Prisma query engine at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --chown=node:node package.json ./
COPY --chown=node:node docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main"]
