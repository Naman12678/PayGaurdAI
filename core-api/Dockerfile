# ── Stage 1: prod dependencies only ─────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
# openssl is required by the Prisma query engine binary on Alpine
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Stage 2: full install (dev deps needed for prisma generate) ───────────────
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
RUN npm ci
COPY prisma ./prisma
COPY src ./src
# Generate the Prisma client artefacts into node_modules
RUN npx prisma generate

# ── Stage 3: lean production image ───────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# openssl required at runtime by the Prisma query engine
RUN apk add --no-cache openssl

# Production node_modules
COPY --from=deps /app/node_modules ./node_modules
# Overlay the generated Prisma client from the builder stage
COPY --from=builder /app/node_modules/.prisma  ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma  ./node_modules/@prisma

COPY prisma ./prisma
COPY src ./src
COPY package.json ./

EXPOSE 4000

# Boot sequence:
#   1. Apply any pending migrations (idempotent — safe to run on every start)
#   2. Seed demo data (upserts, so always safe to re-run)
#   3. Start the API server
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/index.js"]
