# Intifix Admin — Frontend (React + Vite)

SPA del panel administrativo de Intifix. Consume la REST API de `admin-django`
(Django + DRF), con autenticación JWT y RBAC en el cliente.

## Stack

- **React 18 + Vite + TypeScript**
- **Tailwind CSS** + componentes estilo **shadcn/ui** (Radix primitives)
- **TanStack Query** (data fetching/caché) · **Axios** (cliente HTTP con refresh)
- **React Router** (rutas protegidas) · **Recharts** (gráficos) · **lucide-react** (iconos)

## Arquitectura

```
src/
├─ app/                 → bootstrap (main.tsx) + router (App.tsx)
├─ lib/
│  ├─ api.ts            → cliente axios + refresh de token (single-flight) en 401
│  ├─ auth.tsx          → AuthProvider, login/logout, decode JWT → principal
│  ├─ rbac.ts           → espejo del RBAC del backend (Permission/Role → permisos)
│  ├─ tokens.ts         → almacenamiento de access/refresh
│  ├─ theme.tsx         → tema claro/oscuro
│  └─ utils.ts          → helpers (cn, formato fecha/dinero)
├─ components/
│  ├─ ui/               → primitivas (button, card, badge, table, input, feedback)
│  ├─ layout/           → AppLayout, Sidebar, Topbar (responsive, drawer móvil)
│  ├─ guards.tsx        → ProtectedRoute, RequirePermission, <Can>
│  ├─ common.tsx        → PageHeader, StatCard, Pagination
│  └─ nav.ts            → definición del menú (gated por permiso)
└─ features/            → una carpeta por módulo
   ├─ auth/             → login
   ├─ dashboard/        → KPIs + gráficos (/api/dashboard/*)
   ├─ usuarios/         → listar/buscar/filtrar + suspender/activar/banear
   ├─ tecnicos/         → moderación + visor de documentos KYC
   ├─ pagos/            → transacciones
   ├─ reportes/         → moderación (revisar/resolver, historial, comentarios)
   ├─ auditoria/        → trail de auditoría con filtros
   └─ configuracion/    → cuenta + permisos efectivos + tema
```

### Seguridad / RBAC

El menú y las acciones se ocultan/deshabilitan según los permisos del principal
(derivados del claim `roles` del JWT). **El backend re-valida cada request**: el
RBAC del cliente es solo experiencia de usuario (mínimo privilegio), no la
frontera de seguridad.

## Puesta en marcha

```bash
cp .env.example .env       # opcional: ajustar VITE_API_PROXY_TARGET
npm install
npm run dev                # http://localhost:5173 (proxy /api → Django :8000)
```

En dev, Vite hace proxy de `/api` al backend (sin CORS). En producción, define
`VITE_API_URL` con el origen de la API y sirve `npm run build` (carpeta `dist/`)
detrás de un CDN/Nginx.

## Endpoints que consume

| Módulo | Endpoint |
|---|---|
| Auth | `POST /api/v1/auth/{login,refresh,logout}/` |
| Dashboard | `GET /api/dashboard/{summary,charts,kpis}/` |
| Usuarios | `GET /api/admin/users/`, `PATCH .../{suspend,activate,ban}/` |
| Técnicos | `GET /api/admin/technicians/`, `.../documents/`, `PATCH .../{approve,reject,suspend}/` |
| Pagos | `GET /api/v1/payments/` |
| Reportes | `GET /api/admin/moderation/reports/`, `.../{history,comments}/`, `PATCH .../{review,resolve}/` |
| Auditoría | `GET /api/admin/audit/` |
