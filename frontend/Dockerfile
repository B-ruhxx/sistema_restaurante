# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app
# Install dependencies based on lockfile for reproducibility
COPY package*.json ./
RUN npm ci --legacy-peer-deps
# Copy source code and build
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:alpine

# ====> AGREGAR ESTA LÍNEA AQUÍ PARA REEMPLAZAR LA CONFIGURACIÓN POR DEFECTO <====
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
# Expose HTTP port
EXPOSE 80
# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]