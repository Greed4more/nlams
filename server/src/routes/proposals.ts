import { Router } from "express";
import { prisma } from "../db.js";
import { requireNlamsUser } from "../middleware/auth.js";
import { serializeProposal } from "../lib/serialize.js";
import { canAct, nextStage } from "../lib/stages.js";
import { proposalScopeWhere } from "../lib/scope.js";
import { addAuditEntry } from "../lib/auditVault.js";
import { triggerRiskEvaluation } from "../services/riskBridge.js";
import { z } from "zod";

export const proposalsRouter = Router();

const include = { parcels: true, documents: true } as const;

proposalsRouter.use(requireNlamsUser);

proposalsRouter.get("/", async (req, res) => {
  const proposals = await prisma.proposal.findMany({
    where: proposalScopeWhere(req.nlamsUser!),
    include,
    orderBy: { id: "asc" },
  });
  res.json(proposals.map(serializeProposal));
});

proposalsRouter.get("/:id", async (req, res) => {
  const proposal = await prisma.proposal.findFirst({
    where: { id: req.params.id, ...proposalScopeWhere(req.nlamsUser!) },
    include,
  });
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }
  res.json(serializeProposal(proposal));
});

proposalsRouter.get("/:id/audit-log", async (req, res) => {
  const proposal = await prisma.proposal.findFirst({
    where: { id: req.params.id, ...proposalScopeWhere(req.nlamsUser!) },
    select: { id: true },
  });
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  const allLogIds = await prisma.auditLog.findMany({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  const heightMap = new Map<string, number>();
  allLogIds.forEach((item, index) => {
    heightMap.set(item.id, index + 1);
  });

  const entries = await prisma.auditLog.findMany({
    where: { proposalId: proposal.id },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(
    entries.map((e) => ({
      id: e.id,
      action: e.action,
      fromStage: e.fromStage,
      toStage: e.toStage,
      metadata: e.metadata,
      createdAt: e.createdAt.toISOString(),
      actor: e.user ? { name: e.user.name, role: e.user.role } : null,
      chainHash: e.chainHash,
      previousHash: e.previousHash,
      eventPayloadHash: e.eventPayloadHash,
      fileHash: e.fileHash,
      blockHeight: heightMap.get(e.id) ?? 1,
    })),
  );
});

proposalsRouter.patch("/:id/advance-stage", async (req, res) => {
  const user = req.nlamsUser!;
  if (!canAct(user.role)) {
    res.status(403).json({ error: "This role cannot execute statutory actions" });
    return;
  }

  const proposal = await prisma.proposal.findFirst({
    where: { id: req.params.id, ...proposalScopeWhere(user) },
  });
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  const to = nextStage(proposal.currentStage);
  if (!to) {
    res.status(409).json({ error: "Proposal is already at its final stage" });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const proposalUpdate = await tx.proposal.update({
      where: { id: proposal.id },
      data: { currentStage: to, stageEnteredAt: new Date() },
      include,
    });
    await addAuditEntry(tx, {
      proposalId: proposal.id,
      userId: user.id,
      action: "STAGE_ADVANCE",
      fromStage: proposal.currentStage,
      toStage: to,
      eventPayload: {
        fromStage: proposal.currentStage,
        toStage: to,
        projectName: proposal.projectName,
        advancedAt: new Date().toISOString(),
      },
    });
    return proposalUpdate;
  });

  res.json(serializeProposal(updated));
});

/** GET /api/proposals/:id/risk — latest litigation & delay risk score (Module 5); computes on demand if missing. */
proposalsRouter.get("/:id/risk", async (req, res) => {
  const proposal = await prisma.proposal.findFirst({
    where: { id: req.params.id, ...proposalScopeWhere(req.nlamsUser!) },
    select: { id: true },
  });
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  const latest = await prisma.riskScore.findFirst({
    where: { proposalId: proposal.id },
    orderBy: { computedAt: "desc" },
  });
  if (latest) {
    res.json(latest);
    return;
  }

  const computed = await triggerRiskEvaluation(proposal.id);
  if (!computed) {
    res.status(500).json({ error: "Unable to compute a risk score for this proposal" });
    return;
  }
  res.json(computed);
});

const consentBody = z.object({ consentPercentage: z.number().min(0).max(100) });

/** PATCH /api/proposals/:id/consent — records SIA public-consent %, then re-evaluates risk. */
proposalsRouter.patch("/:id/consent", async (req, res) => {
  const user = req.nlamsUser!;
  const proposal = await prisma.proposal.findFirst({
    where: { id: req.params.id, ...proposalScopeWhere(user) },
  });
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  const parsed = consentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid consent input", details: parsed.error.flatten() });
    return;
  }

  await prisma.proposal.update({
    where: { id: proposal.id },
    data: { consentPercentage: parsed.data.consentPercentage },
  });

  const riskScore = await triggerRiskEvaluation(proposal.id);
  if (riskScore) {
    await addAuditEntry(prisma, {
      proposalId: proposal.id,
      userId: user.id,
      action: "RISK_SCORED",
      eventPayload: { consentPercentage: parsed.data.consentPercentage, riskScore: riskScore.riskScore },
    });
  }

  res.json({ consentPercentage: parsed.data.consentPercentage, riskScore });
});
