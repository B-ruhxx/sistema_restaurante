# AGENTS

## Repo Shape
- This repo is split cleanly into `backend/` (Spring Boot 3.1, Java 17, MariaDB, Redis, Flyway) and `frontend/` (Vite, React 19, TypeScript, React Query).
- Ignore `frontend/README.md` for project behavior; it is still the default Vite template.
- Frontend routing is centralized in `frontend/src/app/routes.tsx`; every protected page is wrapped with `ProtectedRoute`, `ERPProvider`, and `Layout` there.

## Run Commands
- Full stack in containers: `docker compose up --build`. Required env before this works: `DB_ROOT_PASSWORD` and `JWT_SECRET`.
- Local backend: `mvn spring-boot:run` from `backend/`. There is no Maven wrapper in the repo.
- Local frontend: `npm run dev` from `frontend/`.
- Frontend API base comes from `frontend/.env` as `VITE_API_URL=http://localhost:8080/api/v1`.

## Verification
- Frontend lint/build: `npm run lint` and `npm run build` from `frontend/`.
- `npm run test:smoke` is not a runtime test suite; it is a repo-specific static regression checklist that reads frontend and backend source files and fails on missing expected patterns.
- `npm run visual:validate` uses Playwright to screenshot all major routes. By default it runs in mock mode (`VISUAL_AUTH_MODE=mock`) and writes artifacts to `frontend/artifacts/playwright-visual/`.
- Backend tests: `mvn test` from `backend/`. Focus a single class with `mvn -Dtest=SmokeApiIntegrationTest test`.
- `SmokeApiIntegrationTest` is opt-in only: it runs only when `RUN_MARIADB_INTEGRATION=true` and expects MariaDB/Redis reachable via `TEST_DB_*`, `TEST_REDIS_*`, and `TEST_JWT_SECRET` env vars.

## Contracts And Schema
- Backend OpenAPI is served from `/v3/api-docs` and is intentionally public in `SecurityConfig`.
- If you change backend DTOs/controllers/OpenAPI output, refresh `frontend/src/api/generated/openapi-types.ts` with `npm run contracts:generate` from `frontend/`. `npm run contracts:check` fails when that generated file is stale.
- JPA uses `spring.jpa.hibernate.ddl-auto=validate`; schema changes must go through Flyway migrations under `backend/src/main/resources/db/migration/`.
- Current Flyway source of truth is the destructive baseline `V1__baseline_schema_final.sql` plus `V2__seed_minimo_seguridad.sql`.

## Repo-Specific Gotchas
- Docker Compose starts MariaDB, Redis, backend, and nginx-served frontend; ports are `3306`, `6379`, `8080`, and `80`.
- Backend uploads are stored in repo-local `./uploads` and mounted into the backend container.
- The frontend mostly derives backend origin from `VITE_API_URL`, but `frontend/src/app/pages/Employees.tsx` still hardcodes `http://localhost:8080` for avatar URLs; watch for this before changing host assumptions.
