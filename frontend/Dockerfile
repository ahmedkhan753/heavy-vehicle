# ── Stage 1: Install ALL dependencies (dev+prod for build) ───
FROM node:22-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build the Next.js app ──────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars (NEXT_PUBLIC_* are inlined at build time)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

RUN npm run build

# ── Stage 3: Production runtime (standalone) ────────────────
FROM node:22-alpine

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nextjs -u 1001

WORKDIR /app

# Copy standalone server + static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public            ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
