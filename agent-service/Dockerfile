# ── Stage 1: dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --legacy-peer-deps

# ── Stage 2: production image ─────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

EXPOSE 4100

# Security assertion baked into the entrypoint:
# If DATABASE_URL or RAZORPAY keys somehow appeared in the environment,
# the index.js startup guard will catch them and exit(1) before any
# request is served.
CMD ["node", "src/index.js"]
