# frontend-sigat

Backoffice web del sistema de monitoreo fitosanitario del durazno (ICA).
React 19 + TypeScript + Vite + Tailwind, servido por Nginx en un contenedor
Alpine.

## Estructura

```text
src/
├── app/            composición, router, providers y layouts
├── pages/          pantallas finas; solo componen features
├── features/       un módulo de negocio por carpeta
│   └── <feature>/  api, components, hooks, schemas, types, index.ts
├── components/     UI compartida, tablas, gráficos y mapas
├── lib/            API, auth, permisos, validación, formato y utilidades
├── styles/         Tailwind
└── contracts/      openapi.json fijado y tipos generados
```

Regla de dependencia:

```text
pages → features (por su index.ts)
features → lib, components/ui
components/ui → nada de features
lib → nada de features
```

## Comandos

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc -b + vite build
npm test             # Vitest
npm run test:e2e     # Playwright (requiere navegadores instalados)
npm run lint         # oxlint
```

## Variables

| Variable | Cuándo | Ejemplo |
|---|---|---|
| `VITE_API_URL` | build | `https://api.tudominio.com` |

Se hornea en el bundle: cambiarla exige reconstruir la imagen.

## Docker

```bash
docker build --build-arg VITE_API_URL=http://localhost:8000 -t sigat-web .
docker run --rm -p 8080:8080 sigat-web
curl -i http://localhost:8080/healthz
```

La imagen escucha en `0.0.0.0:8080`; ese es el valor de *Exposed ports* en
Coolify.

## Despliegue en Coolify

1. Recurso de tipo Git con `Build Pack = Dockerfile`.
2. *Exposed ports*: `8080`.
3. `VITE_API_URL` como variable de **build**.
4. *Healthcheck*: `GET /healthz`, puerto `8080`.
5. Dominio `https` con certificado.

El backoffice no calcula MTD ni decide aptitud: esas reglas viven en la API.
