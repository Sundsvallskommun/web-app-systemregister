# web-app-systemregister

Backend-for-Frontend in Node/Express and a Next.js frontend.

```
web-app-systemregister/
├── backend/             # Express BFF — JWT auth, proxies to api-service
├── frontend/            # Next.js 16 — UI
└── docker-compose.yml   # api-service + MariaDB (dev infra)
```

The actual data API (`api-service-systemregister`, Java/Spring Boot + MariaDB) lives in a **separate** repo and runs in Docker via `docker-compose.yml`. BFF + frontend run locally with `yarn dev`.

## Architecture

```
   ┌─────────────────────────┐
   │  api-service-           │   <── separate repo, runs in Docker
   │  systemregister         │       Java + Spring Boot
   │  + MariaDB              │       Flyway migrations
   └────────────▲────────────┘
                │ HTTP (REST)
                │
   ┌────────────┴────────────┐
   │  backend (BFF)          │   Express + TypeScript
   │  - JWT login/refresh    │   yarn dev — host:3001
   │  - rate-limit, helmet   │   axios → api-service
   │  - proxy + enrichment   │   prefix /{municipalityId}
   └────────────▲────────────┘
                │ HTTP (REST)
                │
   ┌────────────┴────────────┐
   │  frontend               │   Next.js 16
   │                         │   yarn dev — host:3000
   └─────────────────────────┘
```

## Requirements

- Node ≥ 20 LTS
- Yarn (recommended) or npm
- Docker Desktop (for api-service + MariaDB)
- Sibling repo `../api-service-systemregister` (Docker builds it from that path)

## Quick start

```sh
# 1. Env files (one-time)
cp .env.example .env
cp backend/.env.example.local backend/.env.development.local
cp frontend/.env-example frontend/.env.local

# 2. Dependencies (one-time)
cd backend && yarn install && cd ..
cd frontend && yarn install && cd ..

# 3. Start api-service + MariaDB in the background
docker compose up -d --build

# 4. Start BFF and frontend in two separate terminals
cd backend && yarn dev      # http://localhost:3001
cd frontend && yarn dev     # http://localhost:3000
```

Navigate to <http://localhost:3000> and log in (see [Auth](#auth) below).

Stop the Docker stack:

```sh
docker compose down       # stop
docker compose down -v    # stop + wipe DB (re-seeds on next start)
```

## Configuration

`.env` (root, for Docker Compose):

```env
COMPOSE_PROJECT_NAME=systemregister
NODE_ENV=development

API_SERVICE_PORT=8080
MARIADB_PORT=3306
MARIADB_DATABASE=systemregister
MARIADB_USER=systemreg
MARIADB_PASSWORD=change-me-systemreg
MARIADB_ROOT_PASSWORD=change-me-root
```

`backend/.env.development.local` (for `yarn dev` on host):

- `API_BASE_URL=http://localhost:8080` (api-service is exposed on the host port)
- `MUNICIPALITY_ID=xxxx`
- `JWT_SECRET=…` (generate a long random string)
- `ORIGIN=http://localhost:3000`
- `SEED_ADMIN_PASSWORD`, `SEED_EDITOR_PASSWORD`, `SEED_VIEWER_PASSWORD` — login passwords for the three seed users (see [Auth](#auth) below)

`frontend/.env.local`:

- `NEXT_PUBLIC_API_URL=http://localhost:3001/api` (points at the BFF)

## Auth

The BFF uses JWT with username/password. Three seed users are defined; their passwords are read from env vars at startup:

| Username | Env var                | Default in dev    | Role   |
| -------- | ---------------------- | ----------------- | ------ |
| `admin`  | `SEED_ADMIN_PASSWORD`  | `dev-admin-only`  | admin  |
| `editor` | `SEED_EDITOR_PASSWORD` | `dev-editor-only` | editor |
| `viewer` | `SEED_VIEWER_PASSWORD` | `dev-viewer-only` | viewer |

> When `NODE_ENV=production` the BFF refuses to start unless all three `SEED_*_PASSWORD` env vars are set explicitly. The dev defaults are intentionally obvious placeholders — change them locally if you want.

Endpoints:

- `POST /api/auth/login` → `{ accessToken, refreshToken, role, expiresIn }`
- `POST /api/auth/refresh` → new accessToken
- `POST /api/auth/logout`

Role policy in the proxy: `viewer` can read, `editor` can read + write, `admin` can also DELETE.

> The seed users live in `backend/src/services/auth.service.ts`. Switch to a `users` table in api-service, or port the SAML setup from `web-app-new-personal-files` when the time comes.

## Seed data

`api-service-systemregister/src/main/resources/db/migration/V1_1__seed_data.sql` populates MariaDB with test data on first startup. Flyway runs automatically at boot.

To re-seed: `docker compose down -v` wipes the volume, then `up` again.

## Integration with api-service

The BFF proxies all data routes to api-service prefixed with `/{municipalityId}`:

```
GET  /api/systems       →  GET  {API_BASE_URL}/{municipalityId}/systems
POST /api/systems       →  POST {API_BASE_URL}/{municipalityId}/systems
GET  /api/systems/:id   →  GET  {API_BASE_URL}/{municipalityId}/systems/:id
```

`municipalityId` is read from `MUNICIPALITY_ID` (default `2281`). The list of proxied resources lives in `backend/src/app.ts`.

## Gotchas

### CRLF in api-service on the first Docker build

api-service has a Spotless formatter that crashes if Java files have CRLF line endings (the Windows default). Before the first `docker compose up --build`:

```sh
cd ../api-service-systemregister
git config core.autocrlf input
git rm --cached -r . && git reset --hard
```

Only needs to be done once per checkout.

### Hibernate `validate` vs `@Lob`

api-service has `@Lob` on several entity fields where the Flyway migration creates `TEXT` columns. Hibernate 6 maps `@Lob` on `String` to `TINYTEXT` → schema validation crashes.

`docker-compose.yml` sets `SPRING_JPA_HIBERNATE_DDL_AUTO=none` so Flyway handles the schema. The real fix has to be made in the api-service repo.
