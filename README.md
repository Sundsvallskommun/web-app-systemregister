# web-app-systemregister

Monorepo för Sundsvalls kommuns systemregister. Innehåller en BFF (Backend-for-Frontend) i Node/Express och en Next.js-frontend.

```
web-app-systemregister/
├── backend/           # Express BFF — JWT-auth, proxar till api-service-systemregister
├── frontend/          # Next.js + MUI — UI för systemregistret
├── docker-compose.yml
└── docker-compose.override.yml
```

Den faktiska data-API:n (`api-service-systemregister`, Java/Spring Boot + MariaDB) ligger i ett **separat** repo och körs som egen container/tjänst. Monorepo'n integrerar mot den över HTTP.

## Arkitektur

```
   ┌─────────────────────────┐
   │  api-service-           │   <── separat repo
   │  systemregister         │       Java + Spring Boot
   │  (MariaDB)              │       Flyway-migrations
   └────────────▲────────────┘
                │ HTTP (REST)
                │
   ┌────────────┴────────────┐
   │  backend (BFF)          │   Express + TypeScript
   │  - JWT login/refresh    │   axios → api-service
   │  - rate-limit, helmet   │
   │  - proxy controllers    │
   └────────────▲────────────┘
                │ HTTP (REST)
                │
   ┌────────────┴────────────┐
   │  frontend               │   Next.js 16 + MUI
   │  (Server Components)    │
   └─────────────────────────┘
```

## Krav

- Node ≥ 20 LTS
- Yarn (rekommenderas) eller npm
- Docker + Docker Compose (för att köra hela stacken)
- Java api-service körs separat (eller via en extra compose-override)

## Komma igång

### 1. Klona och installera

```sh
git clone <repo-url> web-app-systemregister
cd web-app-systemregister

cd backend && yarn install && cd ..
cd frontend && yarn install && cd ..
```

### 2. Skapa env-filer

```sh
cp backend/.env.example.local backend/.env.development.local
cp frontend/.env-example frontend/.env.local
```

Justera framför allt:

- `API_BASE_URL` i `backend/.env.development.local` → URL till `api-service-systemregister`
- `MUNICIPALITY_ID` → 2281 för Sundsvall
- `JWT_SECRET` → slumpgenererad sträng
- `NEXT_PUBLIC_API_URL` i `frontend/.env.local` → URL till BFF (default `http://localhost:3001/api`)

### 3. Starta api-service-systemregister (separat)

I sitt eget repo:

```sh
cd ../api-service-systemregister
mvn spring-boot:run   # eller docker build && docker run
```

Default-port är 8080. Konfigurera MariaDB enligt det repots README.

### 4. Starta backend och frontend

```sh
cd backend && yarn dev    # http://localhost:3001
cd frontend && yarn dev   # http://localhost:3000
```

## Köra via Docker Compose

```sh
cp .env.example .env
```

### Alternativ A — bara monorepo (api-service körs separat)

```sh
docker compose up --build
```

Standardvärden:
- Frontend: `http://localhost:3000`
- Backend (BFF): `http://localhost:3001`

BFF förväntar sig att `api-service-systemregister` är nåbar på den URL som `API_BASE_URL` pekar på (default `http://host.docker.internal:8080`).

### Alternativ B — hela stacken inkl. api-service + MariaDB

Sibling-repo `api-service-systemregister` förutsätts finnas på `../api-service-systemregister` (Docker bygger den från det path:et).

```sh
docker compose \
  -f docker-compose.yml \
  -f docker-compose.override.yml \
  -f docker-compose.api-service.yml \
  up --build
```

Detta startar fyra services:

| Service     | Port (host) | Beskrivning                              |
| ----------- | ----------- | ---------------------------------------- |
| frontend    | 3000        | Next.js                                  |
| backend     | 3001        | BFF (Express)                            |
| api-service | 8080        | Java/Spring Boot, Flyway-migrerad        |
| mariadb     | (intern)    | MariaDB 11, internt på `sysreg`-nätverk  |

MariaDB exponeras **inte** mot host som default — avkommentera `ports:` i `docker-compose.api-service.yml` om du vill ansluta med DBeaver/CLI utifrån.

Variabler från `.env` som styr alternativ B:

```
MARIADB_DATABASE=systemregister
MARIADB_USER=systemreg
MARIADB_PASSWORD=change-me-systemreg
MARIADB_ROOT_PASSWORD=change-me-root
API_SERVICE_PORT=8080
SPRING_PROFILES_ACTIVE=
```

> Första uppstarten tar ett par minuter — Maven hämtar hela dependency-trädet och Flyway kör `V1_0__create_initial_schema.sql`.

## Auth

BFF-backend använder JWT med username/password (samma flow som det gamla `systemregister-backend`). API:t exponerar:

- `POST /api/auth/login` → `{ accessToken, refreshToken, role, expiresIn }`
- `POST /api/auth/refresh` → ny accessToken
- `POST /api/auth/logout`

Roller: `admin` > `editor` > `viewer`.

> När SAML-stödet är önskat senare flyttar man hit SAML-strategi/passport-setup från `web-app-new-personal-files`.

## Integration mot api-service

Alla data-routes i BFF (`/api/systems`, `/api/organizations`, `/api/persons`, ...) proxar till motsvarande endpoint på api-service, prefixerade med `/{municipalityId}`:

```
GET  /api/systems         →  GET  {API_BASE_URL}/{municipalityId}/systems
POST /api/systems         →  POST {API_BASE_URL}/{municipalityId}/systems
GET  /api/systems/:id     →  GET  {API_BASE_URL}/{municipalityId}/systems/:id
```

`municipalityId` läses från env (`MUNICIPALITY_ID`, default `2281`).

## Migration från gamla repon

| Gamla repo | Mappar i monorepo |
| ----------------------- | ----------------- |
| `systemregister-backend` | _(ersätts av nya BFF, se backend/)_ |
| `systemregister-frontend` | `frontend/` |
| `api-service-systemregister` | _(eget repo, ej i monorepo)_ |
