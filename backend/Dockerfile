# Build stage - build from monorepo root context
FROM node:20-alpine AS builder

# Install bash and pnpm
RUN apk add --no-cache bash && npm install -g pnpm

WORKDIR /app

# Copy workspace config and lock file
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy the packages we need
COPY packages/shared ./packages/shared
COPY backend ./backend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared types first, then backend
WORKDIR /app/packages/shared
RUN pnpm build 2>/dev/null || echo "No build script in shared"

WORKDIR /app/backend
RUN pnpm build

# Production stage
FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy built packages
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist

# Install production dependencies only
WORKDIR /app/backend
RUN pnpm install --prod --frozen-lockfile

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/index.js"]
