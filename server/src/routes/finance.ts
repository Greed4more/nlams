import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { requireNlamsUser } from "../middleware/auth.js";
import { proposalScopeWhere } from "../lib/scope.js";
import { addAuditEntry } from "../lib/auditVault.js";
import { nextStage } from "../lib/stages.js";
import { serializeProposal } from "../lib/serialize.js";
import {
  ACRES_PER_HECTARE,
  LAO_APPROVED_STAGES,
  computeFinanceAssessment,
  financialReferenceNumber,
  isLaoApprovedStage,
  type FinanceAssessmentResult,
} from "../lib/financeEngine.js";

/**
 * Finance Officer module — approved projects register, the automatic
 * compensation engine preview, and financial clearance approval which forwards
 * the proposal to the District Officer for execution.
 */
export const financeRouter = Router();

financeRouter.use(requireNlamsUser);

const include = { parcels: true, documents: true, financialAssessment: true } as const;

/** Same as `include`, plus the assessment's approver — used where the approval
 * attribution is displayed. */
const includeWithApprover = {
  parcels: true,
  documents: true,
  financialAssessment: {
    include: { approvedBy: { select: { name: true, role: true } } },
  },
} as const;

function isFinanceOfficer(user: { role: string } | undefined): boolean {
  return user?.role === "FINANCE_OFFICER";
}

/**
 * GET /api/finance/approved-projects — every proposal cleared by the Land
 * Acquisition Authority (Sec. 19 declaration or later), with its financial
 * clearance state.
 */
financeRouter.get("/approved-projects", async (req, res) => {
  const proposals = await prisma.proposal.findMany({
    where: {
      ...proposalScopeWhere(req.nlamsUser!),
      currentStage: { in: [...LAO_APPROVED_STAGES] },
    },
    include,
    orderBy: { initiatedAt: "desc" },
  });

  res.json(
    proposals.map((p) => {
      const areaHa = p.parcels.reduce((s, x) => s + x.areaHa, 0);
      return {
        id: p.id,
        projectName: p.projectName,
        requiringBody: p.requiringBody,
        state: p.state,
        district: p.district,
        currentStage: p.currentStage,
        initiatedAt: p.initiatedAt.toISOString(),
        stageEnteredAt: p.stageEnteredAt.toISOString(),
        requiredLandHa: Number(areaHa.toFixed(2)),
        requiredLandAcres: Number((areaHa * ACRES_PER_HECTARE).toFixed(2)),
        affectedLandowners: p.parcels.length,
        affectedFamilies: p.affectedFamilies,
        surveyNumbers: p.parcels.map((x) => x.khasraNo),
        ulpins: p.parcels.map((x) => x.ulpin),
        laoStatus: "APPROVED" as const,
        financialStatus: p.financialStatus,
        financialAssessment: p.financialAssessment
          ? {
              referenceNumber: p.financialAssessment.referenceNumber,
              approvedAt: p.financialAssessment.approvedAt.toISOString(),
              totalCompensation: p.financialAssessment.totalCompensation,
              beneficiaryCount: p.financialAssessment.beneficiaryCount,
            }
          : null,
      };
    }),
  );
});

async function findScopedProposal(id: string, user: { states: string[] }) {
  return prisma.proposal.findFirst({
    where: { id, ...proposalScopeWhere(user) },
    include: includeWithApprover,
  });
}

type AssessmentResponse = FinanceAssessmentResult & {
  referenceNumber: string;
  persisted: boolean;
  approvedAt: string | null;
  approvedBy: { name: string; role: string } | null;
};

function persistedAssessment(
  record: {
    referenceNumber: string;
    landRulesVersion: string;
    beneficiaries: Prisma.JsonValue;
    beneficiaryCount: number;
    totalLandValue: number;
    totalAssetValue: number;
    totalSolatium: number;
    totalInterest: number;
    totalCompensation: number;
    approvedAt: Date;
    approvedBy?: { name: string; role: string } | null;
  },
  proposalId: string,
  notificationDate: string,
  awardDate: string,
): AssessmentResponse {
  const beneficiaries =
    (record.beneficiaries as unknown as FinanceAssessmentResult["beneficiaries"]) ?? [];
  return {
    proposalId,
    landRulesVersion: record.landRulesVersion,
    notificationDate,
    awardDate,
    beneficiaryCount: record.beneficiaryCount,
    totalAreaHa: Number(beneficiaries.reduce((s, b) => s + (b.areaHa ?? 0), 0).toFixed(2)),
    totals: {
      landValue: record.totalLandValue,
      assetValue: record.totalAssetValue,
      solatium: record.totalSolatium,
      interest: record.totalInterest,
      totalCompensation: record.totalCompensation,
    },
    beneficiaries,
    referenceNumber: record.referenceNumber,
    persisted: true,
    approvedAt: record.approvedAt.toISOString(),
    approvedBy: record.approvedBy ?? null,
  };
}

/**
 * GET /api/finance/proposals/:id/assessment — the reviewed assessment. Returns
 * the persisted clearance when one exists, otherwise a live engine preview.
 */
financeRouter.get("/proposals/:id/assessment", async (req, res) => {
  const proposal = await findScopedProposal(req.params.id, req.nlamsUser!);
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }
  if (!isLaoApprovedStage(proposal.currentStage)) {
    res
      .status(409)
      .json({ error: "Proposal has not been approved by the Land Acquisition Authority" });
    return;
  }

  if (proposal.financialAssessment) {
    res.json(
      persistedAssessment(
        proposal.financialAssessment,
        proposal.id,
        proposal.initiatedAt.toISOString(),
        proposal.financialAssessment.approvedAt.toISOString(),
      ),
    );
    return;
  }
  const awardDate = new Date();

  const engine = computeFinanceAssessment(
    {
      id: proposal.id,
      state: proposal.state,
      district: proposal.district,
      initiatedAt: proposal.initiatedAt,
      parcels: proposal.parcels,
    },
    awardDate,
  );

  const response: AssessmentResponse = {
    ...engine,
    referenceNumber: financialReferenceNumber(proposal),
    persisted: false,
    approvedAt: null,
    approvedBy: null,
  };
  res.json(response);
});

/**
 * GET /api/finance/proposals/:id/geometry — parcel polygons for the workspace
 * map overlay (PostGIS ST_AsGeoJSON). Parcels without a sourced geometry come
 * back with `geometry: null` rather than failing the whole map.
 */
financeRouter.get("/proposals/:id/geometry", async (req, res) => {
  const proposal = await findScopedProposal(req.params.id, req.nlamsUser!);
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  const rows = await prisma.$queryRaw<{ ulpin: string; geometry: string | null }[]>`
    SELECT "ulpin", ST_AsGeoJSON("geom") AS geometry
    FROM "parcels"
    WHERE "proposalId" = ${proposal.id}
  `;
  const geometryByUlpin = new Map(rows.map((r) => [r.ulpin, r.geometry]));

  res.json({
    proposalId: proposal.id,
    parcels: proposal.parcels.map((p) => ({
      ulpin: p.ulpin,
      surveyNo: p.khasraNo,
      ownerName: p.ownerName,
      areaHa: p.areaHa,
      areaAcres: Number((p.areaHa * ACRES_PER_HECTARE).toFixed(2)),
      classification: p.classification,
      geometry: (() => {
        const json = geometryByUlpin.get(p.ulpin);
        return json ? JSON.parse(json) : null;
      })(),
    })),
  });
});

/**
 * POST /api/finance/proposals/:id/approve — Finance Officer confirms the
 * financial assessment: persists the clearance, marks the proposal financially
 * approved, and (from Sec. 19) advances it to Award for District Officer
 * execution. Both writes are audit-chained in the same transaction.
 */
financeRouter.post("/proposals/:id/approve", async (req, res) => {
  const user = req.nlamsUser!;
  if (!isFinanceOfficer(user)) {
    res.status(403).json({ error: "Only the Finance Officer may approve a financial assessment" });
    return;
  }

  const proposal = await findScopedProposal(req.params.id, user);
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }
  if (!isLaoApprovedStage(proposal.currentStage)) {
    res
      .status(409)
      .json({ error: "Proposal has not been approved by the Land Acquisition Authority" });
    return;
  }
  if (proposal.financialStatus === "APPROVED" || proposal.financialAssessment) {
    res.status(409).json({ error: "Financial clearance already approved for this proposal" });
    return;
  }

  const awardDate = new Date();
  const engine = computeFinanceAssessment(
    {
      id: proposal.id,
      state: proposal.state,
      district: proposal.district,
      initiatedAt: proposal.initiatedAt,
      parcels: proposal.parcels,
    },
    awardDate,
  );
  const referenceNumber = financialReferenceNumber(proposal);
  const fromStage = proposal.currentStage;
  const toStage = fromStage === "SEC_19" ? nextStage(fromStage) : null;

  const { record, updated } = await prisma.$transaction(async (tx) => {
    const created = await tx.financialAssessment.create({
      data: {
        proposalId: proposal.id,
        referenceNumber,
        totalLandValue: engine.totals.landValue,
        totalAssetValue: engine.totals.assetValue,
        totalSolatium: engine.totals.solatium,
        totalInterest: engine.totals.interest,
        totalCompensation: engine.totals.totalCompensation,
        beneficiaryCount: engine.beneficiaryCount,
        beneficiaries: engine.beneficiaries as unknown as Prisma.InputJsonValue,
        landRulesVersion: engine.landRulesVersion,
        approvedByUserId: user.id,
        approvedAt: awardDate,
      },
    });

    const next = await tx.proposal.update({
      where: { id: proposal.id },
      data: {
        financialStatus: "APPROVED",
        ...(toStage ? { currentStage: toStage, stageEnteredAt: awardDate } : {}),
      },
      include,
    });

    await addAuditEntry(tx, {
      proposalId: proposal.id,
      userId: user.id,
      action: "FINANCIAL_ASSESSMENT_APPROVED",
      fromStage,
      toStage: toStage ?? fromStage,
      eventPayload: {
        referenceNumber,
        beneficiaryCount: engine.beneficiaryCount,
        totals: engine.totals,
        landRulesVersion: engine.landRulesVersion,
        approvedBy: user.name,
        approvedAt: awardDate.toISOString(),
        forwardedTo: "DISTRICT_COLLECTOR",
        forwardedFor: "Final award execution & disbursement",
      },
    });

    if (toStage) {
      await addAuditEntry(tx, {
        proposalId: proposal.id,
        userId: user.id,
        action: "STAGE_ADVANCE",
        fromStage,
        toStage,
        eventPayload: {
          fromStage,
          toStage,
          projectName: proposal.projectName,
          advancedBy: "FINANCE_OFFICER",
          reason: `Financial clearance ${referenceNumber} approved — forwarded to District Officer`,
          advancedAt: awardDate.toISOString(),
        },
      });
    }

    return { record: created, updated: next };
  });

  res.status(201).json({
    assessment: persistedAssessment(
      { ...record, approvedBy: { name: user.name, role: user.role } },
      proposal.id,
      proposal.initiatedAt.toISOString(),
      awardDate.toISOString(),
    ),
    proposal: serializeProposal(updated),
    forwardedTo: "DISTRICT_COLLECTOR",
    toStage,
  });
});
