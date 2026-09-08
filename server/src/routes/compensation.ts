import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireNlamsUser } from "../middleware/auth.js";
import { proposalScopeWhere } from "../lib/scope.js";
import { canAct } from "../lib/stages.js";
import { addAuditEntry } from "../lib/auditVault.js";
import { computeStatutoryCompensation } from "../lib/compensationCalc.js";
import { processPfmsPayment } from "../services/pfmsPayment.js";

export const compensationRouter = Router();

compensationRouter.use(requireNlamsUser);

const calculateBody = z.object({
  circleRate: z.number().optional(),
  avgTopHalfSaleDeeds: z.number().optional(),
  comparableAreaAvg: z.number().optional(),
  distanceFromUrbanKm: z.number().optional(),
  ruralMultiplierOverride: z.number().nullable().optional(),
  assetItems: z
    .object({
      structures: z.number().optional(),
      trees: z.number().optional(),
      wells: z.number().optional(),
      crops: z.number().optional(),
    })
    .optional(),
  notificationDate: z.string(),
  awardDate: z.string(),
});

async function findScopedParcel(parcelId: string, user: { states: string[] }) {
  return prisma.parcel.findFirst({
    where: { id: parcelId, proposal: proposalScopeWhere(user) },
    include: { proposal: true },
  });
}

/** POST /api/parcels/:parcelId/compensation — computes, persists, and audit-hashes the statutory award. */
compensationRouter.post("/:parcelId/compensation", async (req, res) => {
  const user = req.nlamsUser!;
  if (!canAct(user.role)) {
    res.status(403).json({ error: "This role cannot execute statutory actions" });
    return;
  }

  const parcel = await findScopedParcel(req.params.parcelId, user);
  if (!parcel) {
    res.status(404).json({ error: "Parcel not found" });
    return;
  }

  const parsed = calculateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid compensation input", details: parsed.error.flatten() });
    return;
  }

  let calc: ReturnType<typeof computeStatutoryCompensation>;
  try {
    calc = computeStatutoryCompensation(parsed.data);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
    return;
  }

  const pfmsReceipt = await processPfmsPayment({
    proposalId: parcel.proposalId,
    parcelId: parcel.id,
    amount: calc.totalCompensation,
  });

  const record = await prisma.$transaction(async (tx) => {
    const created = await tx.compensationRecord.create({
      data: {
        proposalId: parcel.proposalId,
        parcelId: parcel.id,
        marketValue: calc.marketValue,
        ruralMultiplier: calc.ruralMultiplier,
        assetValue: calc.assetValue,
        solatium: calc.solatium,
        interestAmount: calc.interestAmount,
        totalCompensation: calc.totalCompensation,
        breakdown: calc.breakdown as Prisma.InputJsonValue,
        pfmsReceipt: pfmsReceipt as unknown as Prisma.InputJsonValue,
        calculatedByUserId: user.id,
      },
    });
    await addAuditEntry(tx, {
      proposalId: parcel.proposalId,
      userId: user.id,
      action: "COMPENSATION_CALCULATED",
      eventPayload: { compensationRecordId: created.id, parcelId: parcel.id, totalCompensation: calc.totalCompensation },
    });
    return created;
  });

  res.status(201).json({ ...record, breakdown: calc.breakdown, pfmsReceipt });
});

/** GET /api/parcels/:parcelId/compensation — compensation history for a parcel. */
compensationRouter.get("/:parcelId/compensation", async (req, res) => {
  const parcel = await findScopedParcel(req.params.parcelId, req.nlamsUser!);
  if (!parcel) {
    res.status(404).json({ error: "Parcel not found" });
    return;
  }
  const records = await prisma.compensationRecord.findMany({
    where: { parcelId: parcel.id },
    orderBy: { calculatedAt: "desc" },
  });
  res.json(records);
});
