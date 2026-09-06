import { Router } from "express";
import { prisma } from "../db.js";
import { requireNlamsUser } from "../middleware/auth.js";
import { serializeProposal } from "../lib/serialize.js";
import { canAct, nextStage } from "../lib/stages.js";
import { proposalScopeWhere } from "../lib/scope.js";

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

  const [updated] = await prisma.$transaction([
    prisma.proposal.update({
      where: { id: proposal.id },
      data: { currentStage: to, stageEnteredAt: new Date() },
      include,
    }),
    prisma.auditLog.create({
      data: {
        proposalId: proposal.id,
        userId: user.id,
        action: "STAGE_ADVANCE",
        fromStage: proposal.currentStage,
        toStage: to,
      },
    }),
  ]);

  res.json(serializeProposal(updated));
});
