# syntax=docker/dockerfile:1

# ==========================================
# STAGE 1: Vite Static Asset Builder
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .

# Vite injects VITE_* variables statically into JS bundles at build time
ARG VITE_API_BASE_URL
ARG VITE_CARTO_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_CARTO_API_KEY=$VITE_CARTO_API_KEY

RUN npm run build

# ==========================================
# STAGE 2: Production Nginx Static Server
# ==========================================
FROM nginx:1.27-alpine AS runner

# Remove default Nginx static assets & config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy custom Nginx config and ONLY the compiled dist/ folder
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]