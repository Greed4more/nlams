import { Router } from "express";
import { prisma } from "../db.js";
import { requireNlamsUser } from "../middleware/auth.js";
import { scanForSlaAlerts } from "../jobs/slaAlertScanner.js";
import { proposalScopeWhere } from "../lib/scope.js";

export const alertsRouter = Router();

alertsRouter.use(requireNlamsUser);

alertsRouter.get("/", async (req, res) => {
  const alerts = await prisma.slaAlert.findMany({
    where: { proposal: proposalScopeWhere(req.nlamsUser!) },
    include: { proposal: { select: { projectName: true, state: true, district: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(
    alerts.map((a) => ({
      id: a.id,
      proposalId: a.proposalId,
      projectName: a.proposal.projectName,
      state: a.proposal.state,
      district: a.proposal.district,
      stage: a.stage,
      status: a.status,
      daysElapsed: a.daysElapsed,
      daysRemaining: a.daysRemaining,
      createdAt: a.createdAt.toISOString(),
      deliveredAt: a.deliveredAt?.toISOString() ?? null,
    })),
  );
});

/** Manual trigger — lets a demo show the scanner firing without waiting for the cron tick. */
alertsRouter.post("/scan", async (_req, res) => {
  const result = await scanForSlaAlerts();
  res.json(result);
});
