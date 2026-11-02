#!/bin/bash
# Prueba local de la configuración nginx de sigat-web-front SIN Docker: ejecuta docker/40-sigat-config.sh
# en todos los modos y consulta un nginx local con el dist/ real. Requiere Linux, nginx instalado,
# permisos de root (escribe /etc/nginx/snippets, como dentro de la imagen) y un backend corriendo.
# Uso (tras npm run build):  sudo docker/probar_nginx_local.sh . <puerto-del-backend>
set -u
WEB=$(cd "$1" && pwd); BACK=$2; PUERTO=8090
T=$(mktemp -d); mkdir -p /etc/nginx/snippets
sed -e "s#listen 80;#listen $PUERTO;#" -e "s#root /usr/share/nginx/html;#root $WEB/dist;#" "$WEB/nginx.conf" > "$T/default.conf"
cat > "$T/nginx.conf" <<CONF
pid $T/nginx.pid; error_log $T/error.log; events {}
http { include /etc/nginx/mime.types; access_log off; include $T/default.conf; }
CONF
preparar() { cp "$WEB/nginx-security-headers.conf" /etc/nginx/snippets/sigat-security-headers.conf; rm -f /etc/nginx/snippets/sigat-api.conf; }
arrancar() { nginx -c "$T/nginx.conf" -t 2>&1 | tail -1; nginx -c "$T/nginx.conf"; sleep 0.5; }
parar() { [ -f "$T/nginx.pid" ] && nginx -c "$T/nginx.conf" -s stop; sleep 0.5; }
pedir() { # ruta
  local r; r=$(curl -s -o "$T/cuerpo" -w '%{http_code} %{content_type}' "http://127.0.0.1:$PUERTO$1")
  printf '  GET %-28s → %s | %s\n' "$1" "$r" "$(head -c 110 "$T/cuerpo" | tr '\n' ' ')"
}
config() { # descripción, URL, UPSTREAM
  echo; echo "### $1"; echo "SIGAT_VITE_API_URL=$2  SIGAT_API_UPSTREAM=$3"
  preparar
  SIGAT_VITE_API_URL="$2" SIGAT_API_UPSTREAM="$3" sh "$WEB/docker/40-sigat-config.sh" 2>&1 | sed 's/^/  /'
  return "${PIPESTATUS[0]}"
}

if config "A1. Mismo dominio, backend activo" /api/v1 "http://127.0.0.1:$BACK"; then
  arrancar
  for r in /api/v1/salud /api/v1/ruta-inexistente /api/v1 /api /api/otra /api/v2/salud /admin/inicio /; do pedir "$r"; done
  echo "  POST /api/v1/auth/login (credenciales ficticias) → $(curl -s -o /dev/null -w '%{http_code} %{content_type}' -H 'Content-Type: application/json' -d '{"usuario":"no.existe","contrasena":"x","cliente":"web","recordar":false}' http://127.0.0.1:$PUERTO/api/v1/auth/login)"
  echo "  CSP en /admin/inicio: $(curl -sI http://127.0.0.1:$PUERTO/admin/inicio | grep -i '^content-security-policy' | grep -o "connect-src[^;]*")"
  parar
fi
if config "A2. Mismo dominio, backend caído" /api/v1 "http://127.0.0.1:1"; then
  arrancar; pedir /api/v1/salud; pedir /admin/inicio; parar
fi
config "A3. Mismo dominio sin SIGAT_API_UPSTREAM (debe fallar)" /api/v1 "" ; echo "  salida=$?"
config "A4. Upstream con ruta (debe fallar)" /api/v1 "http://backend:8000/api" ; echo "  salida=$?"
config "A5. Upstream con inyección (debe fallar)" /api/v1 'http://backend:8000; return 200' ; echo "  salida=$?"
if config "B1. API en otro dominio" https://api.ejemplo.org/api/v1 ""; then
  SIGAT_VITE_API_URL=https://api.ejemplo.org/api/v1 SIGAT_API_UPSTREAM= sh "$WEB/docker/40-sigat-config.sh" >/dev/null 2>&1 # segundo arranque: no duplica
  arrancar
  for r in /api/v1/salud /api /admin/inicio; do pedir "$r"; done
  echo "  CSP: $(curl -sI http://127.0.0.1:$PUERTO/ | grep -i '^content-security-policy' | grep -o "connect-src[^;]*")"
  parar
fi
config "B2. Otro dominio con upstream definido (debe fallar)" https://api.ejemplo.org/api/v1 "http://127.0.0.1:$BACK"; echo "  salida=$?"
config "C1. URL protocol-relative (debe fallar)" //servidor-externo.com/api/v1 ""; echo "  salida=$?"
config "C2. HTTP en otro host (debe fallar)" http://192.168.1.50:8000/api/v1 ""; echo "  salida=$?"
config "C3. Ruta fuera de /api (debe fallar)" /backend/v1 "http://127.0.0.1:$BACK"; echo "  salida=$?"
preparar; rm -rf "$T"
