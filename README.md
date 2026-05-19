# web-app-systemregister

Monorepo för Sundsvalls kommuns systemregister. Innehåller en BFF (Backend-for-Frontend) i Node/Express och en Next.js-frontend.

```
web-app-systemregister/
├── backend/             # Express BFF — JWT-auth, proxar till api-service
├── frontend/            # Next.js 16 + MUI — UI
└── docker-compose.yml   # api-service + MariaDB (dev-infra)
```

Den faktiska data-API:n (`api-service-systemregister`, Java/Spring Boot + MariaDB) ligger i ett **separat** repo och körs i Docker via `docker-compose.yml`. BFF + frontend körs lokalt med `yarn dev` för snabb hot reload.

## Arkitektur

```
   ┌─────────────────────────┐
   │  api-service-           │   <── separat repo, körs i Docker
   │  systemregister         │       Java + Spring Boot
   │  + MariaDB              │       Flyway-migrations
   └────────────▲────────────┘
                │ HTTP (REST)
                │
   ┌────────────┴────────────┐
   │  backend (BFF)          │   Express + TypeScript
   │  - JWT login/refresh    │   yarn dev — host:3001
   │  - rate-limit, helmet   │   axios → api-service
   │  - proxy + berikning    │   prefix /{municipalityId}
   └────────────▲────────────┘
                │ HTTP (REST)
                │
   ┌────────────┴────────────┐
   │  frontend               │   Next.js 16 + MUI
   │                         │   yarn dev — host:3000
   └─────────────────────────┘
```

## Krav

- Node ≥ 20 LTS
- Yarn (rekommenderas) eller npm
- Docker Desktop (för api-service + MariaDB)
- Sibling-repo `../api-service-systemregister` (Docker bygger den från det path:et)

## Snabbstart

```sh
# 1. Env-filer (en gång)
cp .env.example .env
cp backend/.env.example.local backend/.env.development.local
cp frontend/.env-example frontend/.env.local

# 2. Dependencies (en gång)
cd backend && yarn install && cd ..
cd frontend && yarn install && cd ..

# 3. Starta api-service + MariaDB i bakgrunden
docker compose up -d --build

# 4. Starta BFF och frontend i två separata terminaler
cd backend && yarn dev      # http://localhost:3001
cd frontend && yarn dev     # http://localhost:3000
```

Surfa in på <http://localhost:3000> och logga in (se [Auth](#auth) nedan).

Stoppa Docker-stacken:

```sh
docker compose down       # stoppa
docker compose down -v    # stoppa + wipe DB (seedar om vid nästa start)
```

> Vid första `up --build` tar Maven 5–10 min att hämta dept44-trädet. Påföljande starter är snabba.

## Konfiguration

`.env` (root, för Docker Compose):

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

`backend/.env.development.local` (för `yarn dev` på host):

- `API_BASE_URL=http://localhost:8080` (api-service exponeras på host-port)
- `MUNICIPALITY_ID=2281`
- `JWT_SECRET=…` (slumpa en lång sträng)
- `ORIGIN=http://localhost:3000`

`frontend/.env.local`:

- `NEXT_PUBLIC_API_URL=http://localhost:3001/api` (pekar på BFF)

## Auth

BFF använder JWT med username/password. Tre hårdkodade seed-användare:

| Username | Lösenord     | Roll    |
| -------- | ------------ | ------- |
| `admin`  | `Admin123!`  | admin   |
| `editor` | `Editor123!` | editor  |
| `viewer` | `Viewer123!` | viewer  |

Endpoints:

- `POST /api/auth/login` → `{ accessToken, refreshToken, role, expiresIn }`
- `POST /api/auth/refresh` → ny accessToken
- `POST /api/auth/logout`

Roll-policy i proxy: `viewer` läser, `editor` läser+skriver, `admin` får även DELETE.

> Seed-användarna ligger i `backend/src/services/auth.service.ts`. Byt till en `users`-tabell i api-service eller flytta in SAML från `web-app-new-personal-files` när det blir aktuellt.

## Seed-data

`api-service-systemregister/src/main/resources/db/migration/V1_1__seed_data.sql` fyller MariaDB med testdata vid första start. Flyway kör automatiskt vid uppstart.

| Tabell                                    | Rader |
| ----------------------------------------- | ----- |
| `organizations`                           | 4     |
| `suppliers`                               | 3     |
| `criticality_levels`                      | 4     |
| `persons`                                 | 4     |
| `systems` (SYS-001…004)                   | 4     |
| `services` (SVC-001…003)                  | 3     |
| `personuppgiftsbehandlingar` (PPB-001…2)  | 2     |
| `personuppgiftsbehandling_system_links`   | 2     |
| `ai_applications` (AI-001…002)            | 2     |

Vill du seeda om: `docker compose down -v` rensar volymen, sen `up` igen.

## Integration mot api-service

BFF proxar alla data-routes till api-service prefixerade med `/{municipalityId}`:

```
GET  /api/systems       →  GET  {API_BASE_URL}/{municipalityId}/systems
POST /api/systems       →  POST {API_BASE_URL}/{municipalityId}/systems
GET  /api/systems/:id   →  GET  {API_BASE_URL}/{municipalityId}/systems/:id
```

`municipalityId` läses från `MUNICIPALITY_ID` (default `2281`). Lista över proxade resurser finns i `backend/src/app.ts`.

### Berikning + alias

- **`GET /api/systems`** har en dedikerad controller (`systems.controller.ts`) som laddar suppliers, persons, organizations och criticality-levels parallellt och berikar varje system med embedded objekt (`Supplier`, `ownerOrg`, `systemOwner`, `technicalContact`, `CriticalityLevel`). Frontend förväntar dessa.
- **`/api/gdpr`** är alias för `/api/personuppgiftsbehandlingar` (matchar gamla frontend-paths).
- **`/api/ai`** är alias för `/api/ai-applications`.
- Generic proxy (`proxy.controller.ts`) normaliserar paginerad shape `{ _meta, <resource>: [] }` från api-service till `{ data, total, page, pages }` så frontend kan läsa `res.data` enhetligt.

## Ansluta TablePlus / DBeaver mot MariaDB

| Fält     | Värde                       |
| -------- | --------------------------- |
| Host     | `127.0.0.1`                 |
| Port     | `3306` (`MARIADB_PORT`)     |
| Database | `systemregister`            |
| User     | `systemreg`                 |
| Password | `change-me-systemreg`       |

## Köra BFF + frontend i Docker (valfritt)

Båda har egna Dockerfiles i `backend/Dockerfile` och `frontend/Dockerfile` om du vill bygga prod-images. Men för dev rekommenderas inte detta — varje kodändring kräver `docker compose ... up -d --build <service>` (30–60s) i stället för Next/nodemon's omedelbara reload.

För prod-build manuellt:

```sh
docker build -t systemregister-backend ./backend
docker build -t systemregister-frontend ./frontend
```

## Gotchas

### CRLF i api-service vid första Docker-bygget

api-service har en Spotless-formatter som kraschar om Java-filer har CRLF (Windows-default). Innan första `docker compose up --build`:

```sh
cd ../api-service-systemregister
git config core.autocrlf input
git rm --cached -r . && git reset --hard
```

Behöver bara göras en gång per checkout.

### Hibernate `validate` vs `@Lob`

api-service har `@Lob` på flera entitetsfält där Flyway-migrationen skapar `TEXT`-kolumner. Hibernate 6 mappar `@Lob` på `String` till `TINYTEXT` → schema-validering kraschar.

`docker-compose.yml` sätter `SPRING_JPA_HIBERNATE_DDL_AUTO=none` så Flyway sköter schemat. Riktig fix måste göras i api-service-repot.

### Enums är UPPERCASE i DB

api-service `@Enumerated(EnumType.STRING)` lagrar Java-enumets *namn*. Alla enum-värden i SQL-seedar måste vara UPPERCASE:

- ✅ `'PRODUCTION'`, `'CLOUD'`, `'API'`, `'LIMITED_RISK'`, `'RATTSLIG_FORPLIKTELSE'`
- ❌ `'production'`, `'cloud'`, …

`high_risk_area` och `registration_status` på `ai_applications` är plain `String` — fritext.

### Port 3306 / 8080 redan upptagen

Om ett annat projekt håller portarna (t.ex. en annan Spring-stack), antingen:

- Stoppa det: `docker stop <name>`
- Eller ändra `MARIADB_PORT` / `API_SERVICE_PORT` i `.env` till en annan port.

### Docker Desktop inte igång

`error during connect: ... open //./pipe/dockerDesktopLinuxEngine` betyder att Docker Desktop inte kör. Starta appen och vänta tills whale-ikonen är "Engine running".

## Migration från gamla repon

| Gammalt repo                  | Mappar i monorepo                              |
| ----------------------------- | ---------------------------------------------- |
| `systemregister-backend`      | _(ersatt av nya BFF i `backend/`)_             |
| `systemregister-frontend`     | `frontend/` (MUI-koden migrerad rakt av)       |
| `api-service-systemregister`  | _(eget repo, kommunicerar via HTTP)_           |
