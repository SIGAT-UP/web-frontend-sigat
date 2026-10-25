# syntax=docker/dockerfile:1
#
# sigat-web · backoffice en React + Vite servido por Nginx
# Base Alpine en ambas etapas.
#
# VITE_API_URL se hornea en el bundle: es variable de BUILD, no de ejecución.
# En Coolify debe marcarse como variable de build antes de desplegar.

# ---------- etapa 1: build ----------
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- etapa 2: runtime ----------
FROM nginx:alpine AS runtime

RUN rm -f /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
