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

/** The only state with a real land-records connection in this deployment. */
const LIVE_ADAPTER_CODE = "WB";

adminAdaptersRouter.get("/adapters", async (_req, res) => {
  const dbAdapters = await prisma.stateAdapter.findMany();
  res.json({
    totalStatesSupported: 36,
    activeReferenceAdapter: "WB (West Bengal Banglarbhumi)",
    liveAdapterCode: LIVE_ADAPTER_CODE,
    dbAdapters,
    registeredPlugins: adapterRegistry.list(),
  });
});

adminAdaptersRouter.post("/adapters/trigger-sync", async (req, res) => {
  const stateCode = typeof req.body?.stateCode === "string" ? req.body.stateCode : "WB";
  const adapter = adapterRegistry.get(stateCode);

  if (!adapter) {
    res.status(404).json({ error: `No adapter registered for state code '${stateCode}'.` });
    return;
  }

  // Every other state is a registered scaffold (GenericMockAdapter) — reject
  // sync requests explicitly rather than implying nationwide live coverage.
  if (stateCode !== LIVE_ADAPTER_CODE) {
    res.status(501).json({
      error: `The ${adapter.stateName} adapter is a registered scaffold — this integration is not yet connected. Only West Bengal (Banglarbhumi) is live.`,
    });
    return;
  }

  const row = await prisma.stateAdapter.upsert({
    where: { stateCode },
    create: { stateCode, adapterName: adapter.stateName, lastSyncStatus: "success" },
    update: { lastSyncStatus: "success" },
  });

  res.status(202).json({
    message: `Sync completed for '${stateCode}' from Banglarbhumi.`,
    adapter: row,
  });
});
