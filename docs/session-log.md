# Session-log — uppsättning av web-app-systemregister

Loggen från Claude-sessionen som scaffold:ade monorepo'n den 2026-05-19. Sparad så framtida arbete har koll på *varför* det ser ut som det gör.

---

## Utgångsläge

Tre repos under `C:\repos\`:

- `systemregister-backend` — Node/Express + Sequelize/Postgres, JWT-auth, hade `seed.ts` som fyllde DB
- `systemregister-frontend` — Next.js 16 + MUI + emotion
- `api-service-systemregister` — Java/Spring Boot + MariaDB + Flyway (dept44-stack)

Plus en referensmonorepo `web-app-new-personal-files` som visade *arkitekturen* vi ville matcha (Express BFF + Next.js + docker-compose).

**Målet:** Slå ihop systemregister-backend + frontend till en monorepo, lämna api-service som separat repo, integrera dem.

---

## Val som gjordes upfront

| Fråga | Val | Motivering |
| --- | --- | --- |
| Frontend-stack | Behåll MUI (inte migrera till @sk-web-gui) | MUI-koden funkar, byte är ett separat projekt |
| Auth | JWT + login/password (inte SAML) | Behåller samma flow som gamla systemregister-backend |
| Backend-roll | Ren BFF / proxy till api-service | api-service äger MariaDB; BFF gör auth + proxar |
| Migration | Scaffold + migrera frontend, bygg BFF nytt | Frontend-koden är värdefull, BFF:en behöver bygges om från grunden |

---

## Vad som byggdes

### `backend/` — ny BFF

- Express + TypeScript, `App`-klass-mönster lånat från referensmonorepo'n
- `services/api.service.ts` — tunn axios-klient som prefixar varje request med `/{municipalityId}/`
- `services/auth.service.ts` — JWT + bcryptjs, tre hårdkodade seed-users (`admin`/`editor`/`viewer`)
- `controllers/proxy.controller.ts` — generisk CRUD-router byggd via `buildProxyRouter(resource)`
- `controllers/auth.controller.ts` — `/auth/login`, `/auth/refresh`, `/auth/logout` med rate-limit
- `app.ts` registrerar BFF för 26 resurser från api-service (systems, services, organizations, ..., ai-applications, klassa-*, event-logs, vulnerability-*)
- Roller: `viewer` läser, `editor` läser/skriver, `admin` får även DELETE

### `frontend/` — kopierad

- `src/`, `public/`, `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `CLAUDE.md`, `AGENTS.md` rakt över från systemregister-frontend
- Enda ändringen: `src/lib/api.ts` default API_BASE byttes till `http://localhost:3001/api` (BFF, inte gammal backend)
- Egen Dockerfile + `.env-example` tillagda

### Docker

- `docker-compose.yml` + `docker-compose.override.yml` — backend + frontend (network_mode: bridge, matchar referensmonorepo)
- `docker-compose.api-service.yml` — overlay som lägger till api-service + MariaDB. Separat `sysreg`-nätverk så de pratar med varandra; api-service exponerar 8080 mot host så BFF kan nå den via `host.docker.internal:8080`

### Övrigt

- `.env.example` med alla variabler, `.gitignore`, README
- Git init + initial commit `0bd1d53`
- Repo döpt om från `systemregister-monorepo` till `web-app-systemregister` mitt i sessionen

---

## Seed-datat (api-service-systemregister)

Lade till `api-service-systemregister/src/main/resources/db/migration/V1_1__seed_data.sql` som speglar gamla `seed.ts`:

- 4 organisationer (Sundsvalls Kommun + 3 underavdelningar)
- 3 leverantörer (TechSys, CloudNordic, Inera)
- 4 kritikalitetsnivåer (P1–P4)
- 4 personer (IT-chef, sysansvarig, DPO, handläggare)
- 4 system (SYS-001…004), 3 tjänster (SVC-001…003)
- 2 PPB (PPB-001, PPB-002) + system-länkar
- 2 AI-applikationer

Filen är skapad i api-service-repot (eget git) — inte committad, lämnat åt användaren.

---

## Buggar och fällor som hittades under uppsättningen

### 1. TypeScript-error på `hpp()` och `compression()`

`@types/hpp` och `@types/compression` bundlar egna `RequestHandler`-typer som inte matchar `@types/express`. Express compileade i en TS2769 No overload matches.

**Fix:** Casta i `app.ts`:
```ts
this.app.use(hpp() as unknown as RequestHandler);
this.app.use(compression() as unknown as RequestHandler);
```

### 2. `docker compose` saknade `.env`

`error while interpolating services.backend.environment.ORIGIN: required variable ORIGIN is missing`

**Fix:** `cp .env.example .env`. Och `version: '3'` togs bort från alla tre compose-filer (deprekerat, gav warning).

### 3. Docker Desktop-pipe inte hittad

`error during connect: ... open //./pipe/dockerDesktopLinuxEngine`

**Orsak:** Docker Desktop kör inte.

### 4. Portkonflikt 3000

Användaren hade `yarn dev` igång lokalt → Docker kunde inte binda port. Landade på dev-flödet "api-service + DB i Docker, BFF+frontend på host" som faktiskt är mest produktivt (hot reload + tunga services containeriserade).

### 5. Spotless-formatter kraschar på CRLF (api-service)

Maven-bygget i api-service-Dockerfilen krasahde på 324 Java-filer med CRLF (Windows git autocrlf=true).

**Fix:**
```sh
cd ../api-service-systemregister
git config core.autocrlf input
git rm --cached -r . && git reset --hard
```

Återställde V1_1-seedfilen från backup först eftersom den var untracked.

### 6. Hibernate `validate` vs `@Lob`

api-service har 23 `@Lob`-annoteringar på `String`-fält där `V1_0__create_initial_schema.sql` skapar `TEXT`-kolumner. Hibernate 6 förväntar sig `TINYTEXT` för `@Lob` på `String` → schema-validering kraschar med:

```
wrong column type encountered in column [classification_justification] in table [ai_applications];
found [text (Types#LONGVARCHAR)], but expecting [tinytext (Types#CLOB)]
```

**Workaround:** Satte `SPRING_JPA_HIBERNATE_DDL_AUTO=none` i `docker-compose.api-service.yml`. Flyway äger schemat, Hibernate hoppar över validering. **Riktig fix måste göras i api-service-repot.**

### 7. Enum-värden måste vara UPPERCASE

`@Enumerated(EnumType.STRING)` lagrar Java-enumets *namn*. data-model.md ljög om att värdena var lowercase. Allt seed-data fick uppercase:

- `'production'` → `'PRODUCTION'`
- `'cloud'`/`'internal'` → `'CLOUD'`/`'INTERNAL'`
- `'api'` → `'API'`
- `'active'`/`'draft'` → `'ACTIVE'`/`'DRAFT'`
- `'limited_risk'`/`'high_risk'` → `'LIMITED_RISK'`/`'HIGH_RISK'`
- `'rattslig_forpliktelse'` → `'RATTSLIG_FORPLIKTELSE'`

`high_risk_area` och `registration_status` på `ai_applications` är plain `String` (inte enum) → kvar som lowercase.

### 8. Docker image-cache vs ändringar i source

Efter att ha fixat enum-värdena i V1_1 kvarstod gamla värdena i DB:n. Två saker måste göras:
1. `docker compose ... down -v` (wipe volym)
2. `docker compose ... up -d --build` (med `--build`, annars används cached image med gamla V1_1)

---

## Slutligt verifierat tillstånd

```
=== /2281/systems ===
{ "_meta": { "count": 4, ... }, "systems": [
  { "systemId": "SYS-002", "status": "PRODUCTION", "hostingType": "CLOUD", ... }
]}
=== /2281/ai-applications ===
[ { "aiApplicationId": "AI-001", "status": "ACTIVE", "riskCategory": "LIMITED_RISK", ... } ]
=== /2281/suppliers ===
[ { "name": "CloudNordic Solutions", ... } ]
```

Stacken körs:
- mariadb container — healthy
- api-service container — Spring Boot 20s startup, Flyway V1_0 + V1_1 applicerade
- BFF + frontend — `yarn dev` på host (3001/3000)

---

## Filer som rörts (utanför vårt egna repo)

- `C:\repos\api-service-systemregister\src\main\resources\db\migration\V1_1__seed_data.sql` — ny fil (untracked)
- `C:\repos\api-service-systemregister\.git\config` — `core.autocrlf=input` satt lokalt
- Alla tracked filer i api-service har återställts med LF-radslut (efter `git reset --hard`)
