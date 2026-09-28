# BHUMITRA

Land acquisition management and monitoring for the RFCTLARR Act, 2013.

BHUMITRA follows a proposal from intake through Social Impact Assessment, Section 11/19 notifications and awards, to compensation disbursement and R&R completion. Officers work through role-scoped dashboards and case registers, and every statutory action is signed into a tamper-evident audit ledger.

Built for Smart India Hackathon 2026. The repo ships with a deterministic synthetic dataset, no real land records or personal data.

## Modules

- **Proposal pipeline.** Seven statutory stages (INTAKE, SIA, SIA_APPRAISAL, SEC_11, SEC_19, AWARD, RR_COMPLETE) with SLA clocks, breach alerts and a per-case audit trail.
- **Role dashboards.** Five officer roles, each with its own dashboard and a National / State-wise view.
- **Compensation.** Section 26-30 award calculation per parcel, persisted with a mock PFMS/DBT receipt.
- **Finance Officer clearance.** Register of LAO-approved projects, automatic per-beneficiary compensation calculation from state land-rate rules and parcel data, and a financial assessment that is persisted and forwarded to the District Officer.
- **Affected landowners and parcels.** ULPIN, survey number, extent, classification, provenance and restriction flags, with cadastral geometry.
- **GIS.** Leaflet maps for parcel inspection, state/district/block boundaries, and a Bhuvan LULC overlay check.
- **Documents.** Statutory filings per stage with SHA-256 integrity verification.
- **Grievances.** 15-day title/record correction tickets, including tickets auto-created when parcel verification fails.
- **Risk scoring.** Litigation and delay risk from a small ML service, with a rule-based fallback when it is offline.
- **Audit vault.** Append-only SHA-256 hash chain over the audit log, verifiable end to end.
- **Public portal.** Read-only, non-PII views for proposal search, landowner records and objections.
- **State adapters.** Registry for pluggable per-state land-records integrations (Banglarbhumi is the reference implementation).
- **Languages.** UI translated into English plus the 22 other Eighth Schedule languages.

## Stack

- Web: TanStack Start (React 19, TanStack Router), Vite, Tailwind CSS v4, Radix/shadcn-ui, Recharts, Leaflet, TanStack Query, Zod
- API (`server/`): Express, Prisma, PostgreSQL with PostGIS, Supabase Auth, Zod
- Risk service (`ml_service/`): FastAPI, scikit-learn, XGBoost
- Field app (`field-pwa/`): React, Vite, Dexie (offline-first)
- Local infra: docker-compose for PostGIS and the risk service
- Deployment: Vercel for the web app, Render for the API (`render.yaml`)

## Layout

```
src/          web app: routes, components, hooks, domain libs
server/       Express API, Prisma schema, migrations and seed
field-pwa/    offline-first field verification app
ml_service/   FastAPI risk-scoring service
```

## Getting started

You need Node 20+ and Docker. Bun is used for the web app, npm works as a fallback.

### 1. Database

```sh
docker compose up -d db
```

### 2. API

```sh
cd server
npm install
cp .env.example .env        # defaults match docker-compose
npx prisma migrate dev
npm run seed                # 45 proposals across 5 states, plus documents, grievances and audit chain
npm run dev                 # http://localhost:4000
```

### 3. Web app

```sh
bun install
cp .env.example .env        # VITE_SUPABASE_* can stay as placeholders for demo sign-in
bun run dev                 # http://localhost:8080
```

### 4. Sign in

The API supports two auth paths:

- **Demo bypass.** With `ALLOW_DEMO_AUTH=true` (the default in `server/.env.example`), the sign-in page accepts a master password and one of the role emails. No Supabase project needed. `BYPASS_PASSWORD` defaults to `admin123`. `/judge-access` is a short path for walkthroughs.
- **Supabase accounts.** Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, then run `npm run seed:supabase-users` from `server/` to create the five accounts with the master password `admin123`.

| Role | Demo email |
| --- | --- |
| DoLR Secretary | dolr.secretary@nlams.demo |
| District Collector | district.collector@nlams.demo |
| Land Acquisition Officer | lao@nlams.demo |
| State Revenue Dept | state.revenue@nlams.demo |
| Finance Officer | finance.officer@nlams.demo |

All roles have nationwide scope. The dashboard has a National / State-wise switch, and the selected state scopes the state view and the header region filter.

## Statutory clocks

Defined in `src/lib/slaRules.ts`:

| Transition | Limit | If missed |
| --- | --- | --- |
| SIA start to SIA report | 180 days (Sec 4(2)) | SIA study lapses |
| SIA appraisal to Sec 11 | 365 days (Sec 14) | SIA lapses, fresh assessment required |
| Sec 11 to Sec 19 | 365 days (Sec 19(7)) | preliminary notification lapses |
| Sec 19 to award | 365 days (Sec 25) | proceedings lapse |

Anything with under 60 days remaining is flagged `AT_RISK`.

## API

Mounted in `server/src/index.ts`. Highlights:

- `/api/proposals` and `/api/proposals/:id/*`: register, detail, stage advance, consent, risk, audit log, documents
- `/api/documents/:id/verify` and `/download`: SHA-256 integrity check and file retrieval
- `/api/parcels`: parcel register, and `POST /api/parcels/verify` for the Bhuvan overlay plus auto-grievances
- `/api/parcels/:parcelId/compensation`: Section 26-30 award
- `/api/finance`: approved projects, assessment preview, parcel geometry, financial clearance approval
- `/api/grievances`, `/api/alerts`, `/api/audit/verify`
- `/api/admin/adapters`: state adapter registry (DoLR Secretary only)
- `/api/public/*`: unauthenticated transparency endpoints

## Optional services

```sh
docker compose up -d ml_service              # risk scoring on :8000
cd field-pwa && npm install && npm run dev   # field PWA on :5173
```

The API falls back to a local risk estimate when `ml_service` is not running.

## Notes

- Seed data is deterministic. `src/data/mockData.ts` generates the dataset and `server/prisma/seed.ts` writes it with real document bytes and an intact audit chain.
- Several modules were ported from a collaborator's Bhumitra backend prototype and adapted to this schema, Supabase auth and audit vault.
- Demo bypass sessions live in API memory, so a redeploy or restart invalidates them. Sign in again for a fresh token, or use the Supabase accounts for sessions that survive restarts.
