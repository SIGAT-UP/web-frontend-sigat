# --- build ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_URL=/api/v1
ARG VITE_API_TIMEOUT_MS=20000
ENV VITE_API_URL=$VITE_API_URL VITE_API_TIMEOUT_MS=$VITE_API_TIMEOUT_MS
RUN npm run build

# --- runtime ---
FROM nginx:1.27-alpine
ARG VITE_API_URL=/api/v1
# URL con la que se compiló la web: decide el modo de la API en 40-sigat-config.sh.
ENV SIGAT_VITE_API_URL=$VITE_API_URL
# Modo A (VITE_API_URL relativa): dirección del backend, p. ej. http://<servicio-backend>:8000.
# Se define al ejecutar (docker run -e / compose); sin ella el contenedor no arranca.
ENV SIGAT_API_UPSTREAM=
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.conf /etc/nginx/snippets/sigat-security-headers.conf
COPY --chmod=0755 docker/40-sigat-config.sh /docker-entrypoint.d/40-sigat-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
