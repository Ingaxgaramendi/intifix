# Intifix Admin

Panel administrativo interno de **Intifix**. No es el backend principal: es un
panel de gestión que **orquesta los microservicios** (Auth, Users, Technicians,
Services, Payments, Geo, Chat) a través de APIs REST.

## Arquitectura

Clean Architecture + DDD por *bounded context*. Como el panel no posee lógica
de negocio propia, los **repositorios** del dominio se implementan como
**Gateways HTTP** hacia los microservicios (patrón Anti-Corruption Layer).

```
intifix-admin/
├── intifix_admin/              # Proyecto Django
│   ├── settings/               # base · development · production · logging
│   ├── urls.py                 # Enrutado /api/v1/*  +  OpenAPI  +  admin
│   ├── wsgi.py / asgi.py
├── shared/                     # Kernel compartido (cross-cutting)
│   ├── domain/                 # entidades, excepciones de dominio
│   ├── application/            # UseCase base
│   ├── infrastructure/
│   │   ├── http/               # BaseGateway resiliente, AuthGateway
│   │   ├── cache/              # helpers Redis
│   │   └── mongo/              # cliente + AuditRepository (MongoDB Atlas)
│   └── interfaces/rest/        # middleware (request-id), paginación,
│                               #   exception_handler, permisos, auth_views
└── <bounded contexts>          # cada app = un slice de Clean Architecture
    usuarios/   tecnicos/   servicios/   soporte/
    analytics/  auditoria/  moderacion/  dashboard/
        ├── domain/             # entities + ports (interfaces)
        ├── application/        # use_cases
        ├── infrastructure/     # *_gateway.py  (implementa el port)
        └── interfaces/         # serializers, views (DRF), urls
```

**Flujo de una petición:** `View` (adaptador) → construye `UseCase` con el
`Gateway` concreto (composition root) → el use case orquesta el dominio vía el
*port* → el gateway llama al microservicio, propaga el JWT del usuario y mapea
la respuesta a entidades de dominio.

`usuarios/` es la implementación de referencia con las 4 capas completas; el
resto sigue el mismo patrón con gateways de proxy.

## Capas de datos

| Store          | Uso                                                        |
|----------------|-----------------------------------------------------------|
| PostgreSQL     | Metadatos locales del panel (no datos de negocio).        |
| Redis          | Caché, throttling, blacklist de tokens, sesiones.         |
| MongoDB Atlas  | Audit trail y documentos de analítica (append-only).      |
| Microservicios | Fuente de verdad del negocio (vía Gateways REST).         |

## Puesta en marcha (local)

```bash
python -m venv venv && source venv/Scripts/activate   # Windows: venv\Scripts\activate
pip install -r requirements/development.txt
cp .env.example .env            # ajusta secretos y URLs de servicios
python manage.py migrate
python manage.py runserver
```

- API:        `http://localhost:8000/api/v1/`
- Swagger UI:  `http://localhost:8000/api/docs/`
- Admin:       `http://localhost:8000/admin/`
- Health:      `http://localhost:8000/health/`

## Docker

```bash
cp .env.example .env
docker compose up --build
```

Levanta `web` (Gunicorn) + `postgres` + `redis`. MongoDB es Atlas (externo):
define `MONGODB_URI` en `.env`. Apunta las `*_SERVICE_URL` a tus microservicios.

## Seguridad / Auth

El **Auth Service** emite los JWT; este panel los **verifica** localmente
(`djangorestframework-simplejwt`, RS256 en producción con la clave pública del
Auth Service). `login`/`refresh` se proxean al Auth Service en
`/api/v1/auth/`. Autorización por rol vía el claim `roles` (`HasRole`/`IsAdmin`).

## Endpoints principales

| Recurso        | Ruta base                       | Servicio        |
|----------------|---------------------------------|-----------------|
| Auth           | `/api/v1/auth/`                 | Auth Service    |
| Usuarios       | `/api/v1/users/`                | Users Service   |
| Técnicos       | `/api/v1/technicians/`          | Technicians     |
| Servicios      | `/api/v1/services/`             | Services        |
| Pagos          | `/api/v1/payments/`             | Payments        |
| Soporte/Chat   | `/api/v1/support/`              | Chat Service    |
| Geo/Analítica  | `/api/v1/analytics/`            | Geo Service     |
| Auditoría      | `/api/v1/audit/`                | MongoDB (local) |
| Dashboard      | `/api/v1/dashboard/`            | agrega varios   |
