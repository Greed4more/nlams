import { Router } from "express";
import { requireNlamsUser } from "../middleware/auth.js";
import { verifyChainIntegrity } from "../lib/auditVault.js";

export const auditRouter = Router();

auditRouter.use(requireNlamsUser);

/** GET /api/audit/verify — walks the entire audit_logs hash chain and checks integrity. */
auditRouter.get("/verify", async (_req, res) => {
  const result = await verifyChainIntegrity();
  res.json(result);
});
