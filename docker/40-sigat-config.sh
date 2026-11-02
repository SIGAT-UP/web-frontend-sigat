#!/bin/sh
# Configura nginx para la API de SIGAT al arrancar el contenedor (lo ejecuta el entrypoint
# oficial de nginx desde /docker-entrypoint.d/). Genera /etc/nginx/snippets/sigat-api.conf y,
# si la API está en otro dominio, agrega ese origen al connect-src de la CSP.
#
# Variables:
#   SIGAT_VITE_API_URL   URL base con la que se compiló la web (la fija el Dockerfile desde el
#                        build-arg VITE_API_URL). No se cambia en tiempo de ejecución.
#   SIGAT_API_UPSTREAM   Solo con URL relativa: dirección del backend para el proxy, sin ruta,
#                        p. ej. http://sigat-durazno-api:8000. Obligatoria en ese modo.
#
# Modos (inequívocos):
#   A) SIGAT_VITE_API_URL=/api/v1 (por defecto): nginx reenvía /api/v1/ a SIGAT_API_UPSTREAM.
#      Sin SIGAT_API_UPSTREAM el contenedor NO arranca.
#   B) SIGAT_VITE_API_URL=https://host/api/v1: no hay proxy; /api/ responde 404 JSON y el origen
#      https://host se agrega a connect-src. SIGAT_API_UPSTREAM debe estar vacía.
# En ambos modos cualquier ruta /api/ responde JSON, nunca el index.html de la SPA.
set -eu

SNIPPETS=/etc/nginx/snippets
API_CONF="$SNIPPETS/sigat-api.conf"
HEADERS="$SNIPPETS/sigat-security-headers.conf"
URL="${SIGAT_VITE_API_URL:-/api/v1}"
UPSTREAM="${SIGAT_API_UPSTREAM:-}"

error() { echo "sigat-config: ERROR: $*" >&2; exit 1; }

# Respuesta JSON de nginx para /api/ cuando la ruta no corresponde a la API.
problema() { # $1 estado, $2 codigo, $3 detalle
  printf "default_type application/problem+json;\n    return %s '{\"type\":\"about:blank\",\"title\":\"%s\",\"status\":%s,\"detail\":\"%s\",\"codigo\":\"%s\",\"errores\":[]}';\n" "$1" "$2" "$1" "$3" "$2"
}

case "$URL" in
  /api/*)
    RUTA="${URL%/}"
    echo "$RUTA" | grep -Eq '^/api(/[A-Za-z0-9._~-]+)+$' || error "SIGAT_VITE_API_URL=\"$URL\" no es una ruta válida bajo /api/."
    case "$RUTA" in */.|*/..|*/./*|*/../*) error "SIGAT_VITE_API_URL no puede contener segmentos . o .." ;; esac
    [ -n "$UPSTREAM" ] || error "La web se compiló con VITE_API_URL=$URL (mismo dominio): defina SIGAT_API_UPSTREAM con la dirección del backend, p. ej. http://<servicio-backend>:8000."
    echo "$UPSTREAM" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?$' \
      || error "SIGAT_API_UPSTREAM=\"$UPSTREAM\" no es válida: use esquema://host[:puerto], sin ruta ni barra final."
    cat > "$API_CONF" <<CONF
# Generado por 40-sigat-config.sh — modo A: API en el mismo dominio, reenviada al backend.
location ^~ $RUTA/ {
    proxy_pass $UPSTREAM;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_connect_timeout 10s;
    proxy_read_timeout 60s;
    client_max_body_size 10m;
    error_page 502 503 504 = @sigat_api_no_disponible;
}
location = $RUTA {
    $(problema 404 RUTA_NO_ENCONTRADA 'Ruta de la API inexistente.')
}
location @sigat_api_no_disponible {
    $(problema 502 API_NO_DISPONIBLE 'El servidor de la API no responde. Intente de nuevo en unos minutos.')
}
location ^~ /api/ {
    $(problema 404 RUTA_NO_ENCONTRADA 'Ruta de la API inexistente.')
}
location = /api {
    $(problema 404 RUTA_NO_ENCONTRADA 'Ruta de la API inexistente.')
}
CONF
    echo "sigat-config: modo A — $RUTA/ → $UPSTREAM"
    ;;
  https://*)
    [ -z "$UPSTREAM" ] || error "La web se compiló con una API en otro dominio ($URL): deje SIGAT_API_UPSTREAM vacía."
    ORIGEN=$(echo "$URL" | sed -E 's#^(https://[^/]+).*#\1#')
    echo "$ORIGEN" | grep -Eq '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?$' || error "No se pudo obtener el origen de \"$URL\"."
    cat > "$API_CONF" <<CONF
# Generado por 40-sigat-config.sh — modo B: API en otro dominio ($ORIGEN); aquí no hay proxy.
location ^~ /api/ {
    $(problema 404 API_EN_OTRO_DOMINIO 'Esta web usa la API en otro dominio.')
}
location = /api {
    $(problema 404 API_EN_OTRO_DOMINIO 'Esta web usa la API en otro dominio.')
}
CONF
    grep -q "connect-src 'self' $ORIGEN" "$HEADERS" || sed -i "s#connect-src 'self'#connect-src 'self' $ORIGEN#" "$HEADERS"
    grep -q "connect-src 'self' $ORIGEN" "$HEADERS" || error "No se pudo agregar $ORIGEN a connect-src."
    echo "sigat-config: modo B — API en $ORIGEN (agregado a connect-src)"
    ;;
  *)
    error "SIGAT_VITE_API_URL=\"$URL\" no es compatible con esta imagen: use una ruta bajo /api/ (con proxy) o https://."
    ;;
esac
