import { Router, type RequestHandler } from "express";
import multer from "multer";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { prisma } from "../db.js";
import { addAuditEntry } from "../lib/auditVault.js";
import {
  BYPASS_PASSWORD,
  BYPASS_PERSONAS,
  issueBypassToken,
  resolveBypassToken,
} from "../lib/bypassAuth.js";

/**
 * Public case-transparency portal — no auth, no PII. Ported from Bhumitra's
 * public module (Module 7): aggregate, non-identifying metrics only, per
 * Sec. 4 & Sec. 11 RFCTLARR Act 2013 and the DPDP Act 2023.
 */
export const publicRouter = Router();

const bypassLoginBody = z.object({
  password: z.string(),
  role: z.enum(["DOLR_SECRETARY", "DISTRICT_COLLECTOR", "LAO", "STATE_REVENUE", "FINANCE_OFFICER"]),
});

/**
 * POST /api/public/auth/bypass — demo sign-in that doesn't need Supabase.
 * See server/src/lib/bypassAuth.ts for why this exists and its limits.
 */
publicRouter.post("/auth/bypass", (req, res) => {
  const parsed = bypassLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  if (parsed.data.password !== BYPASS_PASSWORD) {
    res.status(401).json({ error: "Incorrect bypass password" });
    return;
  }
  const principal = BYPASS_PERSONAS[parsed.data.role as Role];
  const token = issueBypassToken(principal);
  res.json({
    token,
    role: principal.role,
    name: principal.name,
    email: principal.email,
    states: principal.states,
  });
});

/**
 * POST /api/public/auth/switch-persona — re-issues a demo session as another
 * persona, but only for a caller that already holds a valid bypass token. Keeps
 * the bypass password out of the browser bundle entirely (the old persona
 * switcher reused it client-side).
 */
publicRouter.post("/auth/switch-persona", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const principal = token ? resolveBypassToken(token) : null;
  if (!principal) {
    res.status(401).json({ error: "A valid demo session is required to switch personas" });
    return;
  }

  const parsed = bypassLoginBody.pick({ role: true }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const next = BYPASS_PERSONAS[parsed.data.role as Role];
  const nextToken = issueBypassToken(next);
  res.json({
    token: nextToken,
    role: next.role,
    name: next.name,
    email: next.email,
    states: next.states,
  });
});

publicRouter.get("/proposals/search", async (req, res) => {
  const { state, district, name, ulpin } = req.query;

  const where: Record<string, unknown> = {};
  if (state) where["state"] = String(state);
  if (district) where["district"] = String(district);
  if (name) where["projectName"] = { contains: String(name), mode: "insensitive" };
  if (ulpin)
    where["parcels"] = { some: { ulpin: { contains: String(ulpin), mode: "insensitive" } } };

  const proposals = await prisma.proposal.findMany({
    where,
    select: {
      id: true,
      projectName: true,
      state: true,
      district: true,
      currentStage: true,
      initiatedAt: true,
    },
    take: 50,
  });

  res.json({ count: proposals.length, proposals });
});

/* ---------------------------------------------------------------- *
 * Landowner portal — land information & R&R tracking
 *
 * Demo deployment over synthetic seeded records: a citizen enters their
 * survey/ULPIN and receives the land record, the RFCTLARR compensation
 * breakdown and the R&R lifecycle for that holding. No auth, no writes.
 * ---------------------------------------------------------------- */

const ACRES_PER_HECTARE = 2.47105;

/** Deterministic [0,1) value derived from a string — keeps the derived
 * compensation/R&R figures stable across requests without storing them. */
function hashToUnit(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 10_000) / 10_000;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Share of the cadastral parcel actually acquired — the reference portal
 * distinguishes "land acquired inside parcel" from the total plot extent. */
function acquiredShare(ulpin: string): number {
  return 0.62 + hashToUnit(`${ulpin}#acquired`) * 0.33;
}

interface RrStage {
  key: string;
  label: string;
  status: "COMPLETE" | "IN_PROGRESS" | "PENDING";
}

const RR_STAGE_LABELS = [
  "Eligibility",
  "LAO Review",
  "Financial Settlement",
  "District Approval",
  "Implementation",
] as const;

/** Proposal workflow stage → index into the 5-step R&R lifecycle. */
function rrStageIndex(currentStage: string): number {
  switch (currentStage) {
    case "INTAKE":
    case "SIA":
      return 0;
    case "SIA_APPRAISAL":
    case "SEC_11":
      return 1;
    case "SEC_19":
      return 2;
    case "AWARD":
      return 3;
    case "RR_COMPLETE":
      return 5;
    default:
      return 0;
  }
}

function buildRrStages(currentStage: string): { stages: RrStage[]; currentIndex: number } {
  const currentIndex = rrStageIndex(currentStage);
  const stages: RrStage[] = RR_STAGE_LABELS.map((label, i) => ({
    key: label.toUpperCase().replace(/[^A-Z]+/g, "_"),
    label,
    status: i < currentIndex ? "COMPLETE" : i === currentIndex ? "IN_PROGRESS" : "PENDING",
  }));
  return { stages, currentIndex };
}

interface Entitlement {
  category: string;
  basis: string;
  applicable: boolean;
  amount: number;
}

/** Second Schedule, RFCTLARR Act 2013 — indicative entitlement assessment. */
function buildEntitlements(ulpin: string, eligible: boolean): Entitlement[] {
  const hasHouse = hashToUnit(`${ulpin}#housing`) > 0.35;
  const needsTraining = hashToUnit(`${ulpin}#training`) > 0.3;
  return [
    {
      category: "Housing Construction Assistance",
      basis: "Schedule II (1) — house building assistance",
      applicable: eligible && hasHouse,
      amount: eligible && hasHouse ? 120_000 : 0,
    },
    {
      category: "Transportation / Shifting Allowance",
      basis: "Schedule II (4) — one-time shifting allowance",
      applicable: eligible,
      amount: eligible ? 25_000 : 0,
    },
    {
      category: "Subsistence Allowance",
      basis: "Schedule II (5) — ₹3,000/month for 12 months",
      applicable: eligible,
      amount: eligible ? 36_000 : 0,
    },
    {
      category: "Livelihood Training",
      basis: "Schedule II (6) — skill development grant",
      applicable: eligible && needsTraining,
      amount: eligible && needsTraining ? 40_000 : 0,
    },
  ];
}

/** Sec. 26-30 land compensation split used when no award record exists yet. */
function buildLandBreakdown(assessed: number, ulpin: string) {
  const baseLandValue = Math.round(assessed / 2);
  const solatium = baseLandValue; // Sec. 30(1) — 100% of market value
  const interestRate = hashToUnit(`${ulpin}#interest`) > 0.5 ? 0.09 : 0.06; // Sec. 30(3)
  const interestAmount = Math.round(baseLandValue * interestRate);
  return {
    baseLandValue,
    solatium,
    interestAmount,
    interestRatePercent: Math.round(interestRate * 100),
    totalLandCompensation: baseLandValue + solatium + interestAmount,
  };
}

function rrCaseId(ulpin: string, initiatedAt: Date): string {
  const code = ulpin.slice(0, 2);
  const tail = ulpin.slice(-4);
  return `RR-${initiatedAt.getFullYear()}-${code}-${tail}`;
}

type ParcelWithProposal = {
  ulpin: string;
  khasraNo: string;
  ownerName: string;
  coOwners: number;
  areaHa: number;
  classification: string;
  compensationAssessed: number;
  compensationDisbursed: number;
  vernacularTerm: unknown;
  proposal: {
    id: string;
    projectName: string;
    requiringBody: string;
    state: string;
    district: string;
    currentStage: string;
    initiatedAt: Date;
  };
};

function serializeLandownerRecord(p: ParcelWithProposal) {
  const acquiredHa = p.areaHa * acquiredShare(p.ulpin);
  const totalParcelAreaAcres = round2(p.areaHa * ACRES_PER_HECTARE);
  const acquiredAreaAcres = round2(acquiredHa * ACRES_PER_HECTARE);
  const eligible = rrStageIndex(p.proposal.currentStage) >= 1;

  const compensationRecords = buildLandBreakdown(p.compensationAssessed, p.ulpin);
  const entitlements = buildEntitlements(p.ulpin, eligible);
  const rrAllowance = entitlements.reduce((sum, e) => sum + (e.applicable ? e.amount : 0), 0);
  const { stages, currentIndex } = buildRrStages(p.proposal.currentStage);

  return {
    ulpin: p.ulpin,
    ownerName: p.ownerName,
    coOwners: p.coOwners,
    khasraNo: p.khasraNo,
    classification: p.classification,
    vernacularTerm: p.vernacularTerm,
    projectId: p.proposal.id,
    projectName: p.proposal.projectName,
    requiringBody: p.proposal.requiringBody,
    state: p.proposal.state,
    district: p.proposal.district,
    totalParcelAreaAcres,
    acquiredAreaAcres,
    acquiredAreaHa: round2(acquiredHa),
    compensationStatus: p.compensationDisbursed > 0 ? "APPROVED" : "IN_PROGRESS",
    disbursed: Math.round(
      (compensationRecords.totalLandCompensation * p.compensationDisbursed) /
        Math.max(p.compensationAssessed, 1),
    ),
    compensation: {
      baseLandValue: compensationRecords.baseLandValue,
      solatium: compensationRecords.solatium,
      interestAmount: compensationRecords.interestAmount,
      interestRatePercent: compensationRecords.interestRatePercent,
      rrAllowance,
      totalLandCompensation: compensationRecords.totalLandCompensation,
      totalAllocated: compensationRecords.totalLandCompensation + rrAllowance,
    },
    rr: {
      caseId: rrCaseId(p.ulpin, p.proposal.initiatedAt),
      overallStatus:
        currentIndex >= 5 ? "COMPLETE" : currentIndex >= 1 ? "UNDER_REVIEW" : "ELIGIBILITY",
      eligibility: eligible ? "Eligible — RFCTLARR 2nd Schedule" : "Under Review",
      currentStep: currentIndex + 1,
      stages,
      entitlements,
    },
    notice:
      "Demo deployment over synthetic records. Personal data is processed only for the seeded demo dataset under the Digital Personal Data Protection Act, 2023.",
  };
}

const landownerInclude = {
  proposal: {
    select: {
      id: true,
      projectName: true,
      requiringBody: true,
      state: true,
      district: true,
      currentStage: true,
      initiatedAt: true,
    },
  },
} as const;

/** GET /api/public/landowners/search?q=<ulpin|survey no|name> — directory. */
publicRouter.get("/landowners/search", async (req, res) => {
  const q = String(req.query["q"] ?? "").trim();
  const where =
    q.length >= 2
      ? {
          OR: [
            { ulpin: { contains: q, mode: "insensitive" as const } },
            { khasraNo: { contains: q, mode: "insensitive" as const } },
            { ownerName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};
  const parcels = await prisma.parcel.findMany({
    where,
    include: landownerInclude,
    orderBy: { ulpin: "asc" },
    take: 24,
  });
  res.json({
    count: parcels.length,
    query: q,
    notice:
      "Demo deployment over synthetic records. Search by ULPIN, survey number or landowner name.",
    landowners: parcels.map(serializeLandownerRecord),
  });
});

/** GET /api/public/landowners/:ulpin — one landowner/parcel record + R&R. */
publicRouter.get("/landowners/:ulpin", async (req, res) => {
  const ulpin = req.params.ulpin.toUpperCase();
  const parcel = await prisma.parcel.findUnique({ where: { ulpin }, include: landownerInclude });
  if (!parcel) {
    res.status(404).json({ error: "Land record not found for this ULPIN" });
    return;
  }

  const geometryRows = await prisma.$queryRaw<{ geometry: string | null }[]>`
    SELECT ST_AsGeoJSON(geom) AS geometry FROM parcels WHERE ulpin = ${ulpin}
  `;
  const geometryText = geometryRows[0]?.geometry ?? null;

  res.json({
    ...serializeLandownerRecord(parcel as ParcelWithProposal),
    geometry: geometryText ? JSON.parse(geometryText) : null,
  });
});

/* ---------------------------------------------------------------- *
 * Public objection filing — dispute redressal
 *
 * A landowner (or any citizen) can raise a formal objection against a
 * property's valuation, boundary, disbursement or R&R eligibility straight
 * from the public portal. Tickets land in the same GrievanceTicket register
 * the LAO monitors, with the standard 15-day statutory SLA.
 * ---------------------------------------------------------------- */

const objectionUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const OBJECTION_TYPES = [
  "LAND_VALUATION",
  "BOUNDARY_DISPLACEMENT",
  "RR_ELIGIBILITY",
  "COMPENSATION_DISBURSEMENT",
  "OTHER",
] as const;

const OBJECTION_TYPE_LABEL: Record<(typeof OBJECTION_TYPES)[number], string> = {
  LAND_VALUATION: "Land valuation / market rate dispute",
  BOUNDARY_DISPLACEMENT: "Boundary displacement (EGPS pegging)",
  RR_ELIGIBILITY: "R&R eligibility or entitlement",
  COMPENSATION_DISBURSEMENT: "Compensation disbursement",
  OTHER: "Other grievance",
};

const OBJECTION_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  FIELD_VERIFICATION: "Field Verification",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

const GRIEVANCE_SLA_DAYS = 15;

type PublicObjection = {
  id: string;
  proposalId: string;
  parcelId: string | null;
  issueCategory: string;
  description: string;
  status: string;
  createdAt: Date;
  slaDeadline: Date;
  resolvedAt: Date | null;
  evidenceUrl: string | null;
  evidenceName: string | null;
  proposal?: { projectName: string } | null;
};

function serializePublicObjection(t: PublicObjection) {
  return {
    id: t.id,
    proposalId: t.proposalId,
    parcelId: t.parcelId,
    objectionType: t.issueCategory,
    objectionTypeLabel:
      OBJECTION_TYPE_LABEL[t.issueCategory as (typeof OBJECTION_TYPES)[number]] ?? t.issueCategory,
    description: t.description,
    status: t.status,
    statusLabel: OBJECTION_STATUS_LABEL[t.status] ?? t.status,
    createdAt: t.createdAt.toISOString(),
    slaDeadline: t.slaDeadline.toISOString(),
    resolvedAt: t.resolvedAt?.toISOString() ?? null,
    hasEvidence: t.evidenceName != null,
    evidenceName: t.evidenceName,
    evidenceUrl: t.evidenceUrl,
    projectName: t.proposal?.projectName ?? null,
  };
}

/** GET /api/public/objections?ulpin= — objections filed against one parcel. */
publicRouter.get("/objections", async (req, res) => {
  const ulpin = String(req.query["ulpin"] ?? "")
    .trim()
    .toUpperCase();
  if (!ulpin) {
    res.status(400).json({ error: "ulpin query parameter is required" });
    return;
  }
  const parcel = await prisma.parcel.findUnique({
    where: { ulpin },
    select: { id: true, khasraNo: true, ownerName: true, proposalId: true },
  });
  if (!parcel) {
    res.status(404).json({ error: "Land record not found for this ULPIN" });
    return;
  }
  const tickets = await prisma.grievanceTicket.findMany({
    where: { parcelId: parcel.id },
    include: { proposal: { select: { projectName: true } } },
    omit: { evidenceData: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({
    count: tickets.length,
    ulpin,
    khasraNo: parcel.khasraNo,
    ownerName: parcel.ownerName,
    proposalId: parcel.proposalId,
    objections: tickets.map((t) => serializePublicObjection(t)),
  });
});

/** POST /api/public/objections — multipart objection filing with optional evidence file. */
publicRouter.post(
  "/objections",
  objectionUpload.single("evidence") as unknown as RequestHandler,
  async (req, res) => {
    const parsed = z
      .object({
        ulpin: z.string().min(3),
        objectionType: z.enum(OBJECTION_TYPES),
        description: z.string().min(10),
        evidenceUrl: z.string().optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid objection input", details: parsed.error.flatten() });
      return;
    }

    const ulpin = parsed.data.ulpin.trim().toUpperCase();
    const parcel = await prisma.parcel.findUnique({ where: { ulpin } });
    if (!parcel) {
      res.status(404).json({ error: "Land record not found for this ULPIN" });
      return;
    }

    // Submissions from the public portal are attributed to a system account so
    // the officer-facing register can tell portal filings from officer entries.
    const submitter = await prisma.user.upsert({
      where: { email: "public.portal@nlams.internal" },
      update: {},
      create: {
        id: "seed-public-portal",
        email: "public.portal@nlams.internal",
        name: "Public Landowner Portal",
        role: "LAO",
        states: [],
      },
    });

    const evidenceUrl = parsed.data.evidenceUrl?.trim() || null;
    const slaDeadline = new Date(Date.now() + GRIEVANCE_SLA_DAYS * 24 * 60 * 60 * 1000);

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.grievanceTicket.create({
        data: {
          proposalId: parcel.proposalId,
          parcelId: parcel.id,
          submittedByUserId: submitter.id,
          issueCategory: parsed.data.objectionType,
          description: parsed.data.description.trim(),
          evidenceUrl,
          evidenceName: req.file?.originalname ?? null,
          evidenceType: req.file?.mimetype ?? null,
          evidenceData: req.file ? Uint8Array.from(req.file.buffer) : null,
          status: "SUBMITTED",
          slaDeadline,
        },
      });
      await addAuditEntry(tx, {
        proposalId: parcel.proposalId,
        userId: submitter.id,
        action: "GRIEVANCE_SUBMITTED",
        fileBuffer: req.file?.buffer ?? null,
        eventPayload: {
          grievanceId: created.id,
          issueCategory: created.issueCategory,
          source: "PUBLIC_PORTAL",
          hasEvidence: req.file != null,
        },
      });
      return created;
    });

    res.status(201).json(serializePublicObjection(ticket));
  },
);

/** GET /api/public/objections/:id/evidence — streams the attached evidence file. */
publicRouter.get("/objections/:id/evidence", async (req, res) => {
  const ticket = await prisma.grievanceTicket.findUnique({
    where: { id: req.params.id },
    select: { evidenceData: true, evidenceName: true, evidenceType: true },
  });
  if (!ticket?.evidenceData) {
    res.status(404).json({ error: "No evidence attached to this objection" });
    return;
  }
  res.setHeader("Content-Type", ticket.evidenceType ?? "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${(ticket.evidenceName ?? "evidence").replaceAll('"', "")}"`,
  );
  res.send(Buffer.from(ticket.evidenceData));
});

publicRouter.get("/proposals/:id", async (req, res) => {
  const proposal = await prisma.proposal.findUnique({
    where: { id: req.params.id },
    include: { parcels: true, compensationRecords: true },
  });
  if (!proposal) {
    res.status(404).json({ error: "Public record not found" });
    return;
  }

  const totalCompensationDisbursed = proposal.compensationRecords.reduce(
    (sum, r) => sum + r.totalCompensation,
    0,
  );
  const totalAreaHa = proposal.parcels.reduce((sum, p) => sum + p.areaHa, 0);

  res.json({
    projectId: proposal.id,
    projectName: proposal.projectName,
    state: proposal.state,
    district: proposal.district,
    currentStage: proposal.currentStage,
    aggregateMetrics: {
      totalParcelsNotified: proposal.parcels.length,
      aggregateAreaNotifiedHectares: Number(totalAreaHa.toFixed(2)),
      aggregateCompensationDisbursedCrores: Number(
        (totalCompensationDisbursed / 10_000_000).toFixed(2),
      ),
      affectedFamilies: proposal.affectedFamilies,
    },
    transparencyNotice:
      "Public disclosure under Section 4 & Section 11 RFCTLARR Act 2013. Personal identifiable information (PII) excluded per the Digital Personal Data Protection Act 2023.",
  });
});
