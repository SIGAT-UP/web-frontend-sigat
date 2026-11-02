# 🍑 SIGAT Web — Vigilancia del durazno

Frontend web del **Sistema de Información para la Gestión y Análisis de la Vigilancia Fitosanitaria (SIGAT)**, orientado al seguimiento del cultivo de durazno y la vigilancia de la mosca del Mediterráneo (*Ceratitis capitata*).

Desarrollado con **React, Vite y TypeScript**.

## ✨ Funcionalidades

La plataforma permite gestionar las actividades de vigilancia fitosanitaria según el rol del usuario:

- **Agrónomo:** consulta registros de campo, trampas, inspecciones, lotes y reportes.
- **Administrador:** gestiona usuarios, cartografía y auditoría.
- **Productor:** consulta información de su cultivo y reporta aplicaciones y cosechas.
- **Técnico:** realiza sus actividades desde la aplicación móvil.

La aplicación consume los servicios del backend de SIGAT. La información se obtiene mediante la API, sin utilizar datos operativos inventados.

## 🛠️ Tecnologías

- React 19
- Vite
- TypeScript
- React Router
- TanStack Query
- Tailwind CSS 4
- Lucide React
- Vitest
- Docker y Nginx

## 📁 Estructura del proyecto

```text
sigat-web-front/
├── public/
├── src/
│   ├── app/          # Aplicación, rutas y autenticación
│   ├── assets/       # Recursos gráficos
│   ├── core/         # Componentes y utilidades comunes
│   ├── data/         # Comunicación con el backend
│   └── features/     # Módulos de cada rol
├── docker/
├── .env.example
├── Dockerfile
├── nginx.conf
├── package.json
└── README.md
```

## 🚀 Instalación y ejecución

### Requisitos

- Node.js 20.19 o superior.
- npm.
- Backend SIGAT disponible y configurado.

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd sigat-web-front
```

### 2. Instalar dependencias

```bash
npm ci
```

### 3. Configurar variables de entorno

Crear el archivo `.env` a partir del ejemplo:

```bash
cp .env.example .env
```

Variables principales:

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend |
| `VITE_DEV_API_PROXY` | Dirección del backend en desarrollo |
| `VITE_API_TIMEOUT_MS` | Tiempo máximo de petición |

**Importante:** Las variables `VITE_*` quedan expuestas en el código compilado. No almacenar contraseñas, tokens ni secretos en ellas.

### 4. Iniciar el proyecto

```bash
npm run dev
```

Abrir en el navegador:

`http://localhost:5173`

## 📜 Comandos disponibles

| Comando | Función |
|---|---|
| `npm run dev` | Iniciar entorno de desarrollo |
| `npm run build` | Generar versión de producción |
| `npm run preview` | Previsualizar producción |
| `npm run lint` | Revisar código |
| `npm run typecheck` | Verificar tipos |
| `npm run test` | Ejecutar pruebas |
| `npm run check` | Ejecutar verificaciones completas |

## 🔐 Seguridad


No publicar archivos `.env`, credenciales ni claves privadas.

## 📦 Despliegue

El proyecto utiliza Vite para generar los archivos de producción en `dist/`.

Puede desplegarse mediante:

- Docker y Nginx.
- Servidores de alojamiento estático compatibles con aplicaciones SPA.



**SIGAT — Sistema de Información para la Gestión y Análisis de la Vigilancia Fitosanitaria.**