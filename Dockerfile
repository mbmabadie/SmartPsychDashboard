# ═══════════════════════════════════════════════════════════
# Smart Psych Dashboard - Dockerfile (Vite + React)
# Multi-stage build: Node for building, Nginx for serving
# ═══════════════════════════════════════════════════════════

# ─── Stage 1: Build ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the production bundle (outputs to /app/dist by default)
RUN npm run build

# ─── Stage 2: Serve ────────────────────────────────────────
FROM nginx:alpine AS runner

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the built static files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config (handles React Router SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
