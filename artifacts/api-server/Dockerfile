# API server container for Render
FROM node:24-bullseye-slim

WORKDIR /app

# Enable pnpm via corepack (bundled with Node 24)
RUN corepack enable

# Copy workspace manifests for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/db/package.json ./lib/db/
COPY lib/replit-auth-web/package.json ./lib/replit-auth-web/
COPY scripts/package.json ./scripts/

# Install all workspace dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy source files
COPY tsconfig.base.json tsconfig.json ./
COPY artifacts/api-server ./artifacts/api-server
COPY lib ./lib
COPY scripts ./scripts

# Build the API server
RUN pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production
EXPOSE 8080

CMD ["pnpm", "--filter", "@workspace/api-server", "run", "start"]
