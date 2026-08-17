# ── Stage 1: Install dependencies ────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM node:22-alpine

ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S backend -u 1001

WORKDIR /app

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY package.json ./
COPY src ./src

USER backend

EXPOSE 5000

CMD ["node", "src/server.js"]
