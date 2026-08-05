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
- A SAML IdP for login — locally [`web-app-fake-sso-idp`](https://github.com/Sundsvallskommun/web-app-fake-sso-idp) on port 7000 (see [Auth](#auth))

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

# 4. Start the fake IdP (separate repo, own terminal)
cd ../web-app-fake-sso-idp && yarn start   # http://localhost:7000

# 5. Start BFF and frontend in two separate terminals
cd backend && yarn dev      # http://localhost:3001
cd frontend && yarn dev     # http://localhost:3000
```

Navigate to <http://localhost:3000> and log in with SSO (see [Auth](#auth) below).

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
- `SECRET_KEY=…` (signs the session cookie — generate a long random string)
- `ORIGIN=http://localhost:3000` — CORS allowlist, also the allowlist for post-login redirect targets
- `SAML_*` — IdP endpoint, certificate and redirect URLs (see [Auth](#auth) below)
- `ADMIN_GROUP` / `EDITOR_GROUP` / `VIEWER_GROUP` — the AD groups that grant each access level

`frontend/.env.local`:

- `NEXT_PUBLIC_API_URL=http://localhost:3001/api` (points at the BFF)

## Auth

Login goes through SAML/SSO against the municipality's IdP — there are no local user accounts or passwords. The BFF is the Service Provider: it keeps the session in a cookie (`connect.sid`, `express-session`) and the frontend calls the BFF with `credentials: "include"`.

```
frontend  ──"Logga in med SSO"──▶  BFF /api/saml/login  ──▶  IdP
                                                              │
frontend  ◀──redirect + session──  BFF /api/saml/login/callback ◀┘
```

### Access levels come from AD groups

The SAML assertion carries the user's groups (claim `http://schemas.xmlsoap.org/claims/Group`, or a comma-separated `groups` attribute). Group names are lowercased before matching.

| Access level | Group (default)          | Env var        | Permissions                    |
| ------------ | ------------------------ | -------------- | ------------------------------ |
| admin        | `systemregister_admin`   | `ADMIN_GROUP`  | read + write + DELETE          |
| editor       | `systemregister_editor`  | `EDITOR_GROUP` | read + write                   |
| viewer       | `systemregister_viewer`  | `VIEWER_GROUP` | read                           |

The env vars take a comma-separated list if several groups should grant the same level. A user in several groups gets the highest level. **A user without any of these groups is refused login** and is sent back to the login page with `?failMessage=MISSING_PERMISSIONS` — no session is created.

The group mapping lives in `backend/src/services/authorization.service.ts`. Access is administered in the directory service (AD), not in this application.

### Endpoints

- `GET /api/saml/login` → redirects to the IdP (`?successRedirect=` decides where to land afterwards; only origins in `ORIGIN` are accepted)
- `POST /api/saml/login/callback` → the IdP posts the assertion here, session is created
- `GET /api/saml/logout` → logs out; performs Single Logout when `SAML_LOGOUT_URL` is set, otherwise local logout only
- `GET /api/saml/logout/callback` → the IdP's SLO response lands here
- `GET /api/saml/metadata` → SP metadata to register with the IdP
- `GET /api/me` → the logged-in user (`username`, `name`, `email`, `groups`, `role`)

### Local development with fake-sso-idp

`backend/.env.development.local` points at [`web-app-fake-sso-idp`](https://github.com/Sundsvallskommun/web-app-fake-sso-idp) on <http://localhost:7000> and already contains that IdP's public certificate. Give your test users in the fake IdP a `groups` attribute:

```json
"groups": {
  "format": "urn:oasis:names:tc:SAML:2.0:attrname-format:basic",
  "value": "systemregister_admin",
  "type": "xs:string"
}
```

Several groups go in one attribute, comma-separated. The users also need `givenName`, `surname` and a username (`urn:oid:0.9.2342.19200300.100.1.1`).

> The fake IdP has no Single Logout endpoint, so `SAML_LOGOUT_URL` is empty in dev and logging out only clears the app session. To switch test user, clear the IdP session at <http://localhost:7000/logout>.

For production, point `SAML_ENTRY_SSO` and `SAML_IDP_PUBLIC_CERT` at the real IdP and fill in `SAML_PRIVATE_KEY` / `SAML_PUBLIC_KEY`.

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
