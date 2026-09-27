import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { buildProposals } from "../../src/data/mockData.js";
import { DISTRICT_COORDS } from "./districtCoords.js";

const prisma = new PrismaClient();

function sha256Hex(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/** Deterministic [0,1) pseudo-random value derived from a string. */
function hashToUnit(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 10_000) / 10_000;
}

/**
 * A parcel doesn't have a real cadastral survey position, so we place it a
 * short, deterministic jitter away from its district's HQ town — plausible
 * enough for a real Leaflet/PostGIS map, honest about not being surveyed data.
 */
function jitteredCenter(base: [number, number], seed: string): [number, number] {
  const jitterDeg = 0.03; // ~3km spread
  const dLat = (hashToUnit(seed) - 0.5) * 2 * jitterDeg;
  const dLng = (hashToUnit(seed + "#lng") - 0.5) * 2 * jitterDeg;
  return [base[0] + dLat, base[1] + dLng];
}

/** A small rectangle sized to roughly match the parcel's real area. */
function parcelPolygonWkt(center: [number, number], areaHa: number): string {
  const [lat, lng] = center;
  const sideMeters = Math.sqrt(Math.max(areaHa, 0.05) * 10_000);
  const halfLat = sideMeters / 2 / 111_000;
  const halfLng = sideMeters / 2 / (111_000 * Math.cos((lat * Math.PI) / 180));
  const corners: [number, number][] = [
    [lng - halfLng, lat - halfLat],
    [lng + halfLng, lat - halfLat],
    [lng + halfLng, lat + halfLat],
    [lng - halfLng, lat + halfLat],
    [lng - halfLng, lat - halfLat],
  ];
  return `POLYGON((${corners.map(([x, y]) => `${x} ${y}`).join(", ")}))`;
}

/** Synthesizes real, verifiable file bytes for a seeded document. */
function synthesizeFile(proposalId: string, docName: string, docType: string): Buffer {
  return Buffer.from(
    [
      "NLAMS — National Land Acquisition & Management System",
      "This is a seed-generated placeholder for a statutory filing.",
      `Proposal: ${proposalId}`,
      `Document: ${docName}`,
      `Type: ${docType}`,
      "Replace with the real scanned filing via the Document Repository upload action.",
    ].join("\n"),
    "utf8",
  );
}

import { addAuditEntry, verifyChainIntegrity } from "../src/lib/auditVault.js";
import type { AuditAction, GrievanceStatus, RfctlarrStage } from "@prisma/client";

interface PendingAuditEvent {
  proposalId: string;
  action: AuditAction;
  fromStage?: RfctlarrStage | null;
  toStage?: RfctlarrStage | null;
  fileBuffer?: Buffer | null;
  eventPayload: Record<string, unknown>;
  createdAt: Date;
}

interface SeedGrievance {
  proposalId: string;
  parcelIndex: number | null;
  issueCategory: string;
  description: string;
  status: GrievanceStatus;
  createdDaysAgo: number;
  /** Days between submission and closure — only for RESOLVED/REJECTED. */
  resolvedAfterDays?: number;
  escalated?: boolean;
}

/**
 * Ten realistic title/record correction tickets spread across the five live
 * states and all five workflow statuses — enough that the Grievances register
 * reads as a working redressal queue rather than an afterthought tab. Dates
 * are relative so some clocks are healthy, some near breach, some overdue.
 */
function buildSeedGrievances(proposals: { id: string; state: string }[]): SeedGrievance[] {
  const byState = (state: string, n: number) =>
    proposals.filter((p) => p.state === state)[n]!.id;

  return [
    {
      proposalId: byState("Maharashtra", 0),
      parcelIndex: 1,
      issueCategory: "Wrong owner name in record of rights",
      description:
        "Sat-Bara 7/12 shows the previous owner. Sale deed registered in 2019 not reflected in the mutation entry.",
      status: "UNDER_REVIEW",
      createdDaysAgo: 4,
    },
    {
      proposalId: byState("Maharashtra", 2),
      parcelIndex: 0,
      issueCategory: "Khasra boundary and extent mismatch",
      description:
        "Ground measurement is 0.42 Ha short of the Khasra entry; adjoining survey sub-division appears merged.",
      status: "FIELD_VERIFICATION",
      createdDaysAgo: 17,
      escalated: true,
    },
    {
      proposalId: byState("Tamil Nadu", 1),
      parcelIndex: 2,
      issueCategory: "Patta subdivision not updated",
      description:
        "Patta still records the undivided survey number; family partition deed of 2021 has not been mutated.",
      status: "RESOLVED",
      createdDaysAgo: 40,
      resolvedAfterDays: 9,
    },
    {
      proposalId: byState("Tamil Nadu", 2),
      parcelIndex: 0,
      issueCategory: "Co-owner omitted from patta",
      description:
        "Legal heir of the recorded pattadar is missing from the patta; consent for acquisition cannot be completed.",
      status: "SUBMITTED",
      createdDaysAgo: 1,
    },
    {
      proposalId: byState("Assam", 1),
      parcelIndex: 1,
      issueCategory: "Dag number transliteration error",
      description:
        "Dharitree entry shows Dag No. 118/2 instead of 181/2 — Bengali numeral transposition in the digitised record.",
      status: "UNDER_REVIEW",
      createdDaysAgo: 9,
    },
    {
      proposalId: byState("Assam", 3),
      parcelIndex: 0,
      issueCategory: "Duplicate Dag entry for same plot",
      description:
        "The same plot is recorded under two Dag numbers across two Patta folios. One entry is a duplicate of the other.",
      status: "REJECTED",
      createdDaysAgo: 22,
      resolvedAfterDays: 6,
    },
    {
      proposalId: byState("Goa", 0),
      parcelIndex: 1,
      issueCategory: "Survey number mismatch with Form I & XIV",
      description:
        "Chalta entry quotes Survey No. 78/12 while Form I & XIV records 78/1-B for the same holding.",
      status: "FIELD_VERIFICATION",
      createdDaysAgo: 13,
    },
    {
      proposalId: byState("Goa", 2),
      parcelIndex: 0,
      issueCategory: "Extent discrepancy in land record",
      description:
        "Recorded extent is 1,850 sq m against 2,140 sq m as per the 2016 resurvey — affects compensation assessment.",
      status: "SUBMITTED",
      createdDaysAgo: 2,
    },
    {
      proposalId: byState("Punjab", 0),
      parcelIndex: 2,
      issueCategory: "Mutation not reflected in Jamabandi",
      description:
        "Intiqal sanctioned in 2023 has not been entered in the current Jamabandi; Khewat still stands in the seller's name.",
      status: "RESOLVED",
      createdDaysAgo: 55,
      resolvedAfterDays: 13,
    },
    {
      proposalId: byState("Punjab", 3),
      parcelIndex: 1,
      issueCategory: "Name spelling mismatch in Khatauni",
      description:
        "Owner's name is spelt inconsistently across Khatauni and Aadhaar-linked DBT records; disbursal is stuck at PFMS.",
      status: "UNDER_REVIEW",
      createdDaysAgo: 20,
      escalated: true,
    },
  ];
}

async function main() {
  console.log("Wiping existing proposal data…");
  await prisma.grievanceTicket.deleteMany();
  await prisma.compensationRecord.deleteMany();
  await prisma.riskScore.deleteMany();
  await prisma.slaAlert.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.proposal.deleteMany(); // cascades to parcels + documents

  // Placeholder submitter for seeded grievance tickets — kept on a distinct
  // internal domain so it can never collide with a real Supabase demo user.
  const seedOfficer = await prisma.user.upsert({
    where: { email: "grievance.cell@nlams.internal" },
    update: {},
    create: {
      id: "seed-grievance-cell",
      email: "grievance.cell@nlams.internal",
      name: "District Grievance Cell",
      role: "LAO",
      states: [],
    },
  });

  const proposals = buildProposals();
  console.log(`Seeding ${proposals.length} proposals…`);

  const pendingAuditEvents: PendingAuditEvent[] = [];

  for (const p of proposals) {
    const docBuffers: { doc: (typeof p.documents)[0]; buffer: Buffer }[] = [];

    await prisma.proposal.create({
      data: {
        id: p.id,
        projectName: p.projectName,
        requiringBody: p.requiringBody,
        state: p.state,
        district: p.district,
        currentStage: p.currentStage,
        stageEnteredAt: new Date(p.stageEnteredAt),
        initiatedAt: new Date(p.initiatedAt),
        affectedFamilies: p.affectedFamilies,
        parcels: {
          create: p.parcels.map((parcel) => ({
            ulpin: parcel.ulpin,
            khasraNo: parcel.khasraNo,
            vernacularTerm: parcel.vernacularTerm,
            areaHa: parcel.areaHa,
            classification: parcel.classification,
            ownerName: parcel.ownerName,
            coOwners: parcel.coOwners,
            compensationAssessed: parcel.compensationAssessed,
            compensationDisbursed: parcel.compensationDisbursed,
          })),
        },
        documents: {
          create: p.documents.map((doc) => {
            const buffer = synthesizeFile(p.id, doc.name, doc.type);
            docBuffers.push({ doc, buffer });
            return {
              name: doc.name,
              type: doc.type,
              uploadedAt: new Date(doc.uploadedAt),
              sizeKb: Math.max(1, Math.round(buffer.byteLength / 1024)),
              sha256: sha256Hex(buffer),
              fileData: Uint8Array.from(buffer),
              contentType: "text/plain",
              lastVerifiedAt: doc.verified ? new Date(doc.uploadedAt) : null,
            };
          }),
        },
      },
    });

    // Queue document upload blocks for the audit chain
    for (const { doc, buffer } of docBuffers) {
      pendingAuditEvents.push({
        proposalId: p.id,
        action: "DOCUMENT_UPLOAD",
        fileBuffer: buffer,
        eventPayload: {
          documentName: doc.name,
          documentType: doc.type,
          sha256: sha256Hex(buffer),
          sizeKb: Math.max(1, Math.round(buffer.byteLength / 1024)),
          projectName: p.projectName,
        },
        createdAt: new Date(doc.uploadedAt),
      });
    }

    // Queue stage transition block if advanced past INTAKE
    if (p.currentStage !== "INTAKE") {
      pendingAuditEvents.push({
        proposalId: p.id,
        action: "STAGE_ADVANCE",
        fromStage: "INTAKE",
        toStage: p.currentStage,
        eventPayload: {
          fromStage: "INTAKE",
          toStage: p.currentStage,
          projectName: p.projectName,
          stageEnteredAt: p.stageEnteredAt,
        },
        createdAt: new Date(p.stageEnteredAt),
      });
    }

    const base = DISTRICT_COORDS[p.district];
    if (base) {
      for (const parcel of p.parcels) {
        const center = jitteredCenter(base, parcel.ulpin);
        const wkt = parcelPolygonWkt(center, parcel.areaHa);
        await prisma.$executeRaw`
          UPDATE parcels SET geom = ST_SetSRID(ST_GeomFromText(${wkt}), 4326)
          WHERE ulpin = ${parcel.ulpin}
        `;
      }
    }
  }

  console.log("Seeding grievance tickets…");
  for (const g of buildSeedGrievances(proposals)) {
    const createdAt = new Date(Date.now() - g.createdDaysAgo * 86400000);
    const slaDeadline = new Date(createdAt.getTime() + 15 * 86400000);
    const resolvedAt =
      g.resolvedAfterDays != null
        ? new Date(createdAt.getTime() + g.resolvedAfterDays * 86400000)
        : null;

    let parcelId: string | null = null;
    if (g.parcelIndex != null) {
      const parcel = await prisma.parcel.findFirst({
        where: { proposalId: g.proposalId },
        orderBy: { ulpin: "asc" },
        skip: g.parcelIndex,
      });
      parcelId = parcel?.id ?? null;
    }

    const ticket = await prisma.grievanceTicket.create({
      data: {
        proposalId: g.proposalId,
        parcelId,
        submittedByUserId: seedOfficer.id,
        issueCategory: g.issueCategory,
        description: g.description,
        status: g.status,
        slaDeadline,
        escalated: g.escalated ?? false,
        createdAt,
        resolvedAt,
      },
    });

    pendingAuditEvents.push({
      proposalId: g.proposalId,
      action: "GRIEVANCE_SUBMITTED",
      eventPayload: {
        grievanceId: ticket.id,
        issueCategory: ticket.issueCategory,
        status: g.status,
      },
      createdAt,
    });
    if (resolvedAt) {
      pendingAuditEvents.push({
        proposalId: g.proposalId,
        action: "GRIEVANCE_RESOLVED",
        eventPayload: { grievanceId: ticket.id, status: g.status },
        createdAt: resolvedAt,
      });
    }
  }

  // Sort all events chronologically so the hash chain is built monotonically
  pendingAuditEvents.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  console.log(`Chaining ${pendingAuditEvents.length} cryptographic audit blocks…`);

  for (const event of pendingAuditEvents) {
    await addAuditEntry(prisma, {
      proposalId: event.proposalId,
      action: event.action,
      fromStage: event.fromStage,
      toStage: event.toStage,
      fileBuffer: event.fileBuffer,
      eventPayload: event.eventPayload,
      createdAt: event.createdAt,
    });
  }

  const integrity = await verifyChainIntegrity();
  console.log(
    `Cryptographic chain integrity verified: intact=${integrity.chainIntact}, ${integrity.verifiedBlocks} blocks verified (head: ${integrity.headHash?.slice(0, 16)}...).`,
  );
  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
