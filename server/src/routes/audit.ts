import { Router } from "express";
import { requireNlamsUser } from "../middleware/auth.js";
import { verifyChainIntegrity } from "../lib/auditVault.js";

import { prisma } from "../db.js";

export const auditRouter = Router();

auditRouter.use(requireNlamsUser);

/** GET /api/audit/verify — walks the entire audit_logs hash chain and checks integrity. */
auditRouter.get("/verify", async (_req, res) => {
  const result = await verifyChainIntegrity();
  res.json(result);
});

/** GET /api/audit/chain — returns the full chronological blockchain blocks with height and parent linkage. */
auditRouter.get("/chain", async (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query["limit"]) || 100));

  // Ordered by `id` (insertion order), not `createdAt` — see auditVault.ts.
  const allLogs = await prisma.auditLog.findMany({
    select: { id: true },
    orderBy: { id: "asc" },
  });
  const heightMap = new Map<string, number>();
  allLogs.forEach((item, index) => {
    heightMap.set(item.id, index + 1);
  });

  const logs = await prisma.auditLog.findMany({
    include: {
      proposal: { select: { id: true, projectName: true, state: true, district: true } },
      user: { select: { name: true, role: true } },
    },
    orderBy: { id: "desc" },
    take: limit,
  });

  const verification = await verifyChainIntegrity();

  res.json({
    verification,
    totalBlocks: allLogs.length,
    blocks: logs.map((log) => ({
      id: log.id,
      blockHeight: heightMap.get(log.id) ?? 1,
      proposalId: log.proposalId,
      projectName: log.proposal.projectName,
      state: log.proposal.state,
      district: log.proposal.district,
      action: log.action,
      fromStage: log.fromStage,
      toStage: log.toStage,
      actor: log.user ? { name: log.user.name, role: log.user.role } : null,
      chainHash: log.chainHash,
      previousHash: log.previousHash,
      eventPayloadHash: log.eventPayloadHash,
      fileHash: log.fileHash,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
    })),
  });
});
