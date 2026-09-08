import { Router } from "express";
import { prisma } from "../db.js";
import { requireNlamsUser } from "../middleware/auth.js";
import { adapterRegistry } from "../adapters/adapterRegistry.js";

/**
 * Federated state-adapter admin (Module 9) — ported from Bhumitra's
 * adapters_admin module. Bhumitra queued sync jobs on RabbitMQ; this stack
 * has no message broker, so trigger-sync updates the adapter's status
 * directly instead of publishing to a queue.
 */
export const adminAdaptersRouter = Router();

adminAdaptersRouter.use(requireNlamsUser);
adminAdaptersRouter.use((req, res, next) => {
  if (req.nlamsUser!.role !== "DOLR_SECRETARY") {
    res.status(403).json({ error: "Only the DoLR Secretary role can manage state adapters" });
    return;
  }
  next();
});

adminAdaptersRouter.get("/adapters", async (_req, res) => {
  const dbAdapters = await prisma.stateAdapter.findMany();
  res.json({
    totalStatesSupported: 36,
    activeReferenceAdapter: "WB (West Bengal Banglarbhumi)",
    dbAdapters,
    registeredPlugins: adapterRegistry.list(),
  });
});

adminAdaptersRouter.post("/adapters/trigger-sync", async (req, res) => {
  const stateCode = typeof req.body?.stateCode === "string" ? req.body.stateCode : "WB";

  const adapter = await prisma.stateAdapter.upsert({
    where: { stateCode },
    create: { stateCode, adapterName: adapterRegistry.get(stateCode)?.stateName ?? stateCode, lastSyncStatus: "syncing_in_progress" },
    update: { lastSyncStatus: "syncing_in_progress" },
  });

  res.status(202).json({ message: `Sync triggered for state '${stateCode}'.`, adapter });
});
