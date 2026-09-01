# LandTrack India

Build a government-grade web application called NLAMS (National Land Acquisition & Management System) for India's Department of Land Resources. This is a real-time dashboard for tracking land acquisition under the RFCTLARR Act 2013.

STACK: React + React Router + Tailwind + shadcn/ui + Recharts + lucide-react.

DESIGN DIRECTION — read carefully, do NOT use your default styling:

- This must look like serious government infrastructure software, not a SaaS landing page.

- NO purple/violet gradients, no glassmorphism, no hero sections, no rounded-3xl cards.

- Palette: deep navy (#0F2942) sidebar/header, off-white (#F7F8FA) page background, white cards with 1px #E2E5EA borders, radius 6px, subtle shadows only.

- Status colors: green #0F7B4F, amber #B45309, red #B91C1C, blue #1D4ED8.

- Typography: Inter. Dense, data-first. Small labels (11px uppercase, letter-spacing, grey), larger tabular numbers. Use tabular-nums for all figures.

- Compact spacing. Information density over whitespace.

LAYOUT:

- Fixed left sidebar (240px, navy) with the NLAMS wordmark, a small "Ministry of Rural Development" subtitle, and nav items: Dashboard, Proposals, Compensation Calculator, GIS Map View.

- Top bar (white, 56px) with a breadcrumb on the left, and on the right: a role selector dropdown (District Collector – South Goa / Land Acquisition Officer / DoLR Secretary / State Revenue Dept), a bell icon with a red badge showing 4, and an avatar.

- The role selector should be stored in React context — it will later filter data.

MOCK DATA — create src/data/mockData.ts with these TypeScript types and 45 seeded proposals:

type RfctlarrStage = 'INTAKE' | 'SIA' | 'SIA_APPRAISAL' | 'SEC_11' | 'SEC_19' | 'AWARD' | 'RR_COMPLETE';

interface Parcel {

  ulpin: string;            // 14-char alphanumeric, e.g. "GA03B2K9X7M401"

  khasraNo: string;

  vernacularTerm: { local: string; script: string; standard: string };

  areaHa: number;

  classification: 'RURAL' | 'URBAN';

  ownerName: string;

  coOwners: number;

  compensationAssessed: number;

  compensationDisbursed: number;

}

interface DocumentRef {

  id: string;

  name: string;

  type: 'SIA_REPORT' | 'SEC_11_NOTIFICATION' | 'SEC_19_DECLARATION' | 'AWARD_ORDER' | 'RR_SCHEME';

  uploadedAt: string;

  sizeKb: number;

  sha256: string;           // 64-char hex

  blockHeight: number;

  verified: boolean;

}

interface Proposal {

  id: string;               // "PROP-0142"

  projectName: string;

  requiringBody: string;

  state: string;

  district: string;

  currentStage: RfctlarrStage;

  stageEnteredAt: string;   // ISO date

  initiatedAt: string;

  totalAreaHa: number;

  affectedFamilies: number;

  parcels: Parcel[];

  documents: DocumentRef[];

  compensation: { assessed: number; disbursed: number; pending: number };

}

Seed realistically across Maharashtra, Tamil Nadu, Assam, Goa, Punjab. Requiring bodies: NHAI, Ministry of Railways, State PWD, NTPC, Airports Authority of India, State Industrial Development Corp. Project names like "Mumbai–Ahmedabad HSR Corridor – Package 4", "NH-66 Six-Laning Kundapura–Surathkal", "Chennai Metro Phase II Reach 3".

Vernacular terms must be genuine regional revenue vocabulary with correct native script:

- Maharashtra: Khasra (खसरा), Sat-Bara (सातबारा), Gat (गट)

- Assam: Dag (দাগ), Patta (পট্টা)

- Tamil Nadu: Survey Number (சர்வே எண்), Patta (பட்டா)

- Punjab: Khasra (ਖਸਰਾ), Khatauni (ਖਤੌਨੀ)

- Goa: Survey No. / Chalta

Each maps to a `standard` English term. This is the "Glossary of Revenue Terms" normalisation layer.

Spread stageEnteredAt so that roughly 6 proposals are in statutory breach, 8 are approaching breach, and the rest are healthy. Give proposals 3–12 parcels each, areas 0.2–14 hectares, compensation values in the ₹40 lakh to ₹90 crore range.

Also create src/lib/slaRules.ts implementing RFCTLARR statutory deadlines:

- SIA → SIA report: 180 days (Sec 4(2))

- SIA_APPRAISAL → SEC_11: 365 days (Sec 14) — else SIA lapses

- SEC_11 → SEC_19: 365 days (Sec 19(7)) — else notification lapses

- SEC_19 → AWARD: 365 days (Sec 25) — else proceedings lapse

Export getSlaStatus(proposal) returning { daysElapsed, daysRemaining, status: 'OK'|'AT_RISK'|'BREACHED', statuteRef, consequence }. AT_RISK = fewer than 60 days remaining.

For now just build the shell, the data layer, and empty routed pages with placeholder headings. Make sure routing and the sidebar work.

## Development

Requires Node.js. This project uses [Bun](https://bun.sh) as its package manager.

```sh
git clone <this-repository-url>
cd <repository-name>
bun install
bun run dev
```

npm works as a fallback if Bun isn't available:

```sh
npm install
npm run dev
```

Other scripts: `build` (production build), `preview` (serve the production build), `lint`, `format`.
