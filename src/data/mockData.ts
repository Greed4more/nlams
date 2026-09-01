export type RfctlarrStage =
  | "INTAKE"
  | "SIA"
  | "SIA_APPRAISAL"
  | "SEC_11"
  | "SEC_19"
  | "AWARD"
  | "RR_COMPLETE";

export interface Parcel {
  ulpin: string;
  khasraNo: string;
  vernacularTerm: { local: string; script: string; standard: string };
  areaHa: number;
  classification: "RURAL" | "URBAN";
  ownerName: string;
  coOwners: number;
  compensationAssessed: number;
  compensationDisbursed: number;
}

export interface DocumentRef {
  id: string;
  name: string;
  type:
    | "SIA_REPORT"
    | "SEC_11_NOTIFICATION"
    | "SEC_19_DECLARATION"
    | "AWARD_ORDER"
    | "RR_SCHEME";
  uploadedAt: string;
  sizeKb: number;
  sha256: string;
  blockHeight: number;
  verified: boolean;
}

export interface Proposal {
  id: string;
  projectName: string;
  requiringBody: string;
  state: string;
  district: string;
  currentStage: RfctlarrStage;
  stageEnteredAt: string;
  initiatedAt: string;
  totalAreaHa: number;
  affectedFamilies: number;
  parcels: Parcel[];
  documents: DocumentRef[];
  compensation: { assessed: number; disbursed: number; pending: number };
}

export const STAGE_LABELS: Record<RfctlarrStage, string> = {
  INTAKE: "Intake",
  SIA: "Social Impact Assessment",
  SIA_APPRAISAL: "SIA Appraisal (Expert Group)",
  SEC_11: "Sec. 11 Preliminary Notification",
  SEC_19: "Sec. 19 Declaration",
  AWARD: "Sec. 23 Award",
  RR_COMPLETE: "R&R Complete",
};

export const STAGE_ORDER: RfctlarrStage[] = [
  "INTAKE",
  "SIA",
  "SIA_APPRAISAL",
  "SEC_11",
  "SEC_19",
  "AWARD",
  "RR_COMPLETE",
];

/* ---------------------------------------------------------------- *
 * Glossary of Revenue Terms — vernacular normalisation layer
 * ---------------------------------------------------------------- */

export interface VernacularTerm {
  local: string;
  script: string;
  standard: string;
}

export const GLOSSARY: Record<string, VernacularTerm[]> = {
  Maharashtra: [
    { local: "Khasra", script: "खसरा", standard: "Plot Number" },
    { local: "Sat-Bara", script: "सातबारा", standard: "Record of Rights (7/12 Extract)" },
    { local: "Gat", script: "गट", standard: "Consolidated Survey Group" },
  ],
  Assam: [
    { local: "Dag", script: "দাগ", standard: "Plot Number" },
    { local: "Patta", script: "পট্টা", standard: "Title Deed" },
  ],
  "Tamil Nadu": [
    { local: "Survey Number", script: "சர்வே எண்", standard: "Survey Number" },
    { local: "Patta", script: "பட்டா", standard: "Title Deed" },
  ],
  Punjab: [
    { local: "Khasra", script: "ਖਸਰਾ", standard: "Plot Number" },
    { local: "Khatauni", script: "ਖਤੌਨੀ", standard: "Holding Register Entry" },
  ],
  Goa: [
    { local: "Survey No.", script: "Survey No.", standard: "Survey Number" },
    { local: "Chalta", script: "Chalta", standard: "City Survey Sub-division" },
  ],
};

/* ---------------------------------------------------------------- *
 * Deterministic PRNG so the dataset is stable across renders/SSR
 * ---------------------------------------------------------------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20130926); // RFCTLARR assent date as seed

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const between = (min: number, max: number) => min + rand() * (max - min);
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1));

const HEX = "0123456789abcdef";
const ALNUM = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

const hex = (n: number) =>
  Array.from({ length: n }, () => HEX[Math.floor(rand() * 16)]).join("");

const STATE_CODE: Record<string, string> = {
  Maharashtra: "MH",
  "Tamil Nadu": "TN",
  Assam: "AS",
  Goa: "GA",
  Punjab: "PB",
};

const DISTRICTS: Record<string, string[]> = {
  Maharashtra: ["Palghar", "Thane", "Raigad", "Nashik", "Pune", "Nagpur"],
  "Tamil Nadu": ["Kancheepuram", "Coimbatore", "Tiruvallur", "Madurai", "Salem"],
  Assam: ["Kamrup", "Dibrugarh", "Nagaon", "Sonitpur", "Barpeta"],
  Goa: ["South Goa", "North Goa"],
  Punjab: ["Ludhiana", "Patiala", "Bathinda", "Jalandhar", "Amritsar"],
};

const OWNER_NAMES: Record<string, string[]> = {
  Maharashtra: [
    "Sakharam B. Patil",
    "Vandana R. Deshmukh",
    "Ganpat K. More",
    "Sunita M. Jadhav",
    "Ramesh V. Bhosale",
    "Kisan D. Shinde",
  ],
  "Tamil Nadu": [
    "M. Selvaraj",
    "R. Kanagavalli",
    "S. Arumugam",
    "P. Meenakshi Sundaram",
    "K. Rajalakshmi",
    "V. Thangavel",
  ],
  Assam: [
    "Bhupen Kalita",
    "Nayanmoni Baruah",
    "Jitu Hazarika",
    "Pranita Saikia",
    "Dhiren Bordoloi",
    "Runjun Das",
  ],
  Goa: [
    "Anthony D'Souza",
    "Shailesh Naik",
    "Maria Fernandes",
    "Prakash Kerkar",
    "Sanjana Dessai",
    "Rohan Shirodkar",
  ],
  Punjab: [
    "Gurpreet Singh Sandhu",
    "Harjeet Kaur Gill",
    "Balwinder Singh Brar",
    "Manpreet Singh Dhillon",
    "Simranjeet Kaur",
    "Jaswant Singh Sidhu",
  ],
};

const REQUIRING_BODIES = [
  "NHAI",
  "Ministry of Railways",
  "State PWD",
  "NTPC",
  "Airports Authority of India",
  "State Industrial Development Corp",
] as const;

const PROJECT_NAMES = [
  "Mumbai–Ahmedabad HSR Corridor – Package 4",
  "NH-66 Six-Laning Kundapura–Surathkal",
  "Chennai Metro Phase II Reach 3",
  "Bharatmala Pariyojana NH-548E Link Road",
  "Guwahati Ring Road – Package 2",
  "NTPC Talcher Super Thermal Expansion – Ash Dyke",
  "Mopa Greenfield Airport – Perimeter Access Corridor",
  "Ludhiana–Bathinda Economic Corridor Package 3",
  "Dedicated Freight Corridor – Eastern Arm Feeder",
  "Salem–Coimbatore Expressway Package 1",
  "Nagpur Metro Phase II Reach 4",
  "Palghar Industrial Township – Phase I",
  "NH-37 Widening Nagaon–Dibrugarh Section",
  "Amritsar Bypass Realignment – Package 2",
  "Madurai Outer Ring Road – Package 5",
  "Thane Creek Bridge Approach Works",
  "NTPC Solar Park – Bathinda Block A",
  "Coimbatore Airport Runway Extension",
  "Raigad Port Connectivity Rail Link",
  "Sonitpur Flood Protection Embankment Corridor",
  "Patiala Bulk Water Transmission Main",
  "South Goa Coastal Highway Realignment",
  "Nashik–Pune Semi High Speed Rail – Package 6",
  "Tiruvallur Industrial Water Pipeline Corridor",
  "Kamrup Multimodal Logistics Park",
] as const;

const DOC_TYPES: DocumentRef["type"][] = [
  "SIA_REPORT",
  "SEC_11_NOTIFICATION",
  "SEC_19_DECLARATION",
  "AWARD_ORDER",
  "RR_SCHEME",
];

const DOC_TYPE_LABEL: Record<DocumentRef["type"], string> = {
  SIA_REPORT: "Social Impact Assessment Report",
  SEC_11_NOTIFICATION: "Section 11 Preliminary Notification",
  SEC_19_DECLARATION: "Section 19 Declaration",
  AWARD_ORDER: "Section 23 Award Order",
  RR_SCHEME: "Rehabilitation & Resettlement Scheme",
};

const DOCS_BY_STAGE: Record<RfctlarrStage, DocumentRef["type"][]> = {
  INTAKE: [],
  SIA: [],
  SIA_APPRAISAL: ["SIA_REPORT"],
  SEC_11: ["SIA_REPORT", "SEC_11_NOTIFICATION"],
  SEC_19: ["SIA_REPORT", "SEC_11_NOTIFICATION", "SEC_19_DECLARATION"],
  AWARD: ["SIA_REPORT", "SEC_11_NOTIFICATION", "SEC_19_DECLARATION", "AWARD_ORDER"],
  RR_COMPLETE: DOC_TYPES,
};

/** Reference "today" — fixed so SLA buckets stay deterministic. */
export const REFERENCE_DATE = new Date("2026-08-31T00:00:00.000Z");

const daysAgoIso = (days: number) =>
  new Date(REFERENCE_DATE.getTime() - days * 86400000).toISOString();

const ulpin = (state: string) => {
  const code = STATE_CODE[state] ?? "IN";
  const body = Array.from(
    { length: 12 - 2 },
    () => ALNUM[Math.floor(rand() * ALNUM.length)],
  ).join("");
  return (code + String(intBetween(1, 24)).padStart(2, "0") + body).slice(0, 14);
};

/**
 * Stage-elapsed buckets: 6 breached, 8 at-risk, rest healthy.
 * Index-driven so the distribution is exact.
 */
const BREACHED_COUNT = 6;
const AT_RISK_COUNT = 8;

const SLA_STAGES: RfctlarrStage[] = ["SIA", "SIA_APPRAISAL", "SEC_11", "SEC_19"];
const STAGE_LIMIT_DAYS: Partial<Record<RfctlarrStage, number>> = {
  SIA: 180,
  SIA_APPRAISAL: 365,
  SEC_11: 365,
  SEC_19: 365,
};

function buildParcels(state: string, count: number, totalCompensation: number): Parcel[] {
  const glossary = GLOSSARY[state] ?? GLOSSARY["Goa"]!;
  const owners = OWNER_NAMES[state] ?? OWNER_NAMES["Goa"]!;
  const weights = Array.from({ length: count }, () => between(0.5, 1.5));
  const weightSum = weights.reduce((a, b) => a + b, 0);

  return Array.from({ length: count }, (_, i) => {
    const assessed = Math.round((totalCompensation * weights[i]!) / weightSum);
    const disbursedRatio = pick([0, 0, 0.25, 0.5, 0.75, 1, 1]);
    return {
      ulpin: ulpin(state),
      khasraNo: `${intBetween(11, 899)}/${intBetween(1, 24)}`,
      vernacularTerm: pick(glossary),
      areaHa: Number(between(0.2, 14).toFixed(2)),
      classification: rand() > 0.72 ? "URBAN" : "RURAL",
      ownerName: pick(owners),
      coOwners: intBetween(0, 7),
      compensationAssessed: assessed,
      compensationDisbursed: Math.round(assessed * disbursedRatio),
    } satisfies Parcel;
  });
}

function buildDocuments(stage: RfctlarrStage, proposalId: string): DocumentRef[] {
  return DOCS_BY_STAGE[stage].map((type, i) => ({
    id: `${proposalId}-DOC-${String(i + 1).padStart(2, "0")}`,
    name: `${DOC_TYPE_LABEL[type]} — ${proposalId}.pdf`,
    type,
    uploadedAt: daysAgoIso(intBetween(30, 900)),
    sizeKb: intBetween(180, 9800),
    sha256: hex(64),
    blockHeight: intBetween(1_840_000, 1_920_000),
    verified: rand() > 0.08,
  }));
}

function buildProposals(): Proposal[] {
  const states = Object.keys(STATE_CODE);

  return Array.from({ length: 45 }, (_, i) => {
    const id = `PROP-${String(101 + i).padStart(4, "0")}`;
    const state = states[i % states.length]!;
    const district = pick(DISTRICTS[state]!);
    const projectName = PROJECT_NAMES[i % PROJECT_NAMES.length]!;

    // Every proposal that carries an SLA sits on one of the four timed stages.
    const stage: RfctlarrStage =
      i < BREACHED_COUNT + AT_RISK_COUNT
        ? SLA_STAGES[i % SLA_STAGES.length]!
        : pick(STAGE_ORDER);

    const limit = STAGE_LIMIT_DAYS[stage];
    let elapsed: number;
    if (limit == null) {
      elapsed = intBetween(20, 240);
    } else if (i < BREACHED_COUNT) {
      elapsed = limit + intBetween(12, 190);
    } else if (i < BREACHED_COUNT + AT_RISK_COUNT) {
      elapsed = limit - intBetween(5, 58);
    } else {
      elapsed = intBetween(15, Math.max(20, limit - 90));
    }

    const stageEnteredAt = daysAgoIso(elapsed);
    const initiatedAt = daysAgoIso(elapsed + intBetween(40, 700));

    const assessed = Math.round(between(40_00_000, 90_00_00_000));
    const parcelCount = intBetween(3, 12);
    const parcels = buildParcels(state, parcelCount, assessed);
    const parcelAssessed = parcels.reduce((s, p) => s + p.compensationAssessed, 0);
    const disbursed = parcels.reduce((s, p) => s + p.compensationDisbursed, 0);

    return {
      id,
      projectName,
      requiringBody: pick(REQUIRING_BODIES),
      state,
      district,
      currentStage: stage,
      stageEnteredAt,
      initiatedAt,
      totalAreaHa: Number(parcels.reduce((s, p) => s + p.areaHa, 0).toFixed(2)),
      affectedFamilies: intBetween(4, 320),
      parcels,
      documents: buildDocuments(stage, id),
      compensation: {
        assessed: parcelAssessed,
        disbursed,
        pending: parcelAssessed - disbursed,
      },
    } satisfies Proposal;
  });
}

export const proposals: Proposal[] = buildProposals();

export const STATES = Object.keys(STATE_CODE);
export const REQUIRING_BODY_LIST = [...REQUIRING_BODIES];

export function formatINR(value: number): string {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)} L`;
  return `₹${value.toLocaleString("en-IN")}`;
}

/** Full Indian-grouped currency, e.g. ₹1,28,45,000 */
export function formatINRFull(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

/** Compact crore figure, e.g. ₹1,284 Cr */
export function formatCrore(value: number, digits = 0): string {
  return `₹${(value / 1_00_00_000).toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} Cr`;
}
