# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Build args allow Docker Compose to pass Vite env vars at build time
ARG VITE_CORE_API_URL=http://localhost:4000
ARG VITE_AGENT_API_URL=http://localhost:4100

ENV VITE_CORE_API_URL=${VITE_CORE_API_URL}
ENV VITE_AGENT_API_URL=${VITE_AGENT_API_URL}

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: serve with nginx ─────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Remove default nginx config and replace with SPA-friendly one
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config: serve index.html for all routes (React Router)
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
