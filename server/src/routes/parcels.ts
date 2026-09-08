import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireNlamsUser } from "../middleware/auth.js";
import { proposalScopeWhere } from "../lib/scope.js";
import { addAuditEntry } from "../lib/auditVault.js";
import { checkBhuvanLulcOverlay } from "../services/bhuvanWms.js";

export const parcelsRouter = Router();

parcelsRouter.use(requireNlamsUser);

interface ParcelGeoRow {
  ulpin: string;
  khasraNo: string;
  ownerName: string;
  coOwners: number;
  classification: string;
  areaHa: number;
  compensationAssessed: number;
  compensationDisbursed: number;
  proposalId: string;
  projectName: string;
  state: string;
  district: string;
  geometry: string; // GeoJSON geometry, as text
}

/** GET /api/parcels/geojson — every geo-located parcel in scope, as a GeoJSON FeatureCollection. */
parcelsRouter.get("/geojson", async (req, res) => {
  const states = req.nlamsUser!.states;
  const stateFilter = states.length > 0 ? Prisma.sql`AND pr.state = ANY(${states})` : Prisma.empty;

  const rows = await prisma.$queryRaw<ParcelGeoRow[]>(Prisma.sql`
    SELECT
      p.ulpin,
      p."khasraNo",
      p."ownerName",
      p."coOwners",
      p.classification,
      p."areaHa",
      p."compensationAssessed",
      p."compensationDisbursed",
      pr.id AS "proposalId",
      pr."projectName",
      pr.state,
      pr.district,
      ST_AsGeoJSON(p.geom) AS geometry
    FROM parcels p
    JOIN proposals pr ON pr.id = p."proposalId"
    WHERE p.geom IS NOT NULL
    ${stateFilter}
  `);

  res.json({
    type: "FeatureCollection",
    features: rows.map((r) => ({
      type: "Feature",
      geometry: JSON.parse(r.geometry),
      properties: {
        ulpin: r.ulpin,
        khasraNo: r.khasraNo,
        ownerName: r.ownerName,
        coOwners: r.coOwners,
        classification: r.classification,
        areaHa: r.areaHa,
        compensationAssessed: r.compensationAssessed,
        compensationDisbursed: r.compensationDisbursed,
        proposalId: r.proposalId,
        projectName: r.projectName,
        state: r.state,
        district: r.district,
      },
    })),
  });
});

const verifyBody = z.object({
  proposalId: z.string(),
  boundaryGeoJson: z.object({ coordinates: z.array(z.array(z.array(z.number()))) }).optional(),
});

/**
 * POST /api/parcels/verify — spatial parcel verification pipeline, ported
 * from Bhumitra's parcels.controller.js. Overlays the ISRO Bhuvan LULC check
 * onto every parcel of the proposal and auto-creates a title-correction
 * grievance ticket for any parcel whose provenance isn't yet ULPIN-verified,
 * so unverified boundaries can't silently pass into Sec. 11 notification.
 */
parcelsRouter.post("/verify", async (req, res) => {
  const user = req.nlamsUser!;
  const parsed = verifyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid verification input", details: parsed.error.flatten() });
    return;
  }

  const proposal = await prisma.proposal.findFirst({
    where: { id: parsed.data.proposalId, ...proposalScopeWhere(user) },
    include: { parcels: true },
  });
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  const bhuvanOverlay = await checkBhuvanLulcOverlay(parsed.data.boundaryGeoJson);

  const GRIEVANCE_SLA_DAYS = 15;
  const OPEN_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "FIELD_VERIFICATION"] as const;

  const processedParcels = await prisma.$transaction(async (tx) => {
    const results = [];
    for (const parcel of proposal.parcels) {
      const flags = Array.isArray(parcel.restrictionFlags) ? [...(parcel.restrictionFlags as string[])] : [];
      if (bhuvanOverlay.multiCropIrrigated && !flags.includes("multi_crop_irrigated")) {
        flags.push("multi_crop_irrigated");
      }
      const updatedParcel = await tx.parcel.update({
        where: { id: parcel.id },
        data: { restrictionFlags: flags },
      });

      let autoTicketId: string | null = null;
      let autoCreatedNow = false;
      if (parcel.provenance === "LEGACY_MIGRATED" || parcel.provenance === "SELF_DECLARED_PENDING") {
        const existing = await tx.grievanceTicket.findFirst({
          where: { parcelId: parcel.id, status: { in: [...OPEN_STATUSES] } },
        });
        if (existing) {
          autoTicketId = existing.id;
        } else {
          const created = await tx.grievanceTicket.create({
            data: {
              proposalId: proposal.id,
              parcelId: parcel.id,
              submittedByUserId: user.id,
              issueCategory: "Unverified Legacy Boundary",
              description: `Auto-generated ticket for parcel ${parcel.khasraNo} — provenance is '${parcel.provenance}'. Field verification required prior to Section 11 notification.`,
              status: "FIELD_VERIFICATION",
              slaDeadline: new Date(Date.now() + GRIEVANCE_SLA_DAYS * 24 * 60 * 60 * 1000),
            },
          });
          await addAuditEntry(tx, {
            proposalId: proposal.id,
            userId: user.id,
            action: "GRIEVANCE_SUBMITTED",
            eventPayload: { grievanceId: created.id, autoCreated: true, parcelId: parcel.id },
          });
          autoTicketId = created.id;
          autoCreatedNow = true;
        }
      }

      results.push({
        ulpin: updatedParcel.ulpin,
        provenance: updatedParcel.provenance,
        restrictionFlags: flags,
        autoGrievanceTicketId: autoTicketId,
        autoCreatedNow,
      });
    }
    return results;
  });

  res.json({
    totalParcels: processedParcels.length,
    bhuvanOverlay,
    autoCreatedGrievancesCount: processedParcels.filter((p) => p.autoCreatedNow).length,
    parcels: processedParcels,
  });
});
