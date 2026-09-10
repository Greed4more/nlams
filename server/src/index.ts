import "dotenv/config";
import express from "express";
import cors from "cors";
import { proposalsRouter } from "./routes/proposals.js";
import { documentsRouter } from "./routes/documents.js";
import { parcelsRouter } from "./routes/parcels.js";
import { alertsRouter } from "./routes/alerts.js";
import { compensationRouter } from "./routes/compensation.js";
import { grievancesRouter } from "./routes/grievances.js";
import { auditRouter } from "./routes/audit.js";
import { publicRouter } from "./routes/public.js";
import { adminAdaptersRouter } from "./routes/adminAdapters.js";
import { scanForSlaAlerts, startSlaAlertScheduler } from "./jobs/slaAlertScanner.js";

const app = express();

// Comma-separated so the main web app (8080) and the field-pwa (5173) can
// both reach this API in local dev without juggling separate server processes.
const corsOrigins = (process.env["CORS_ORIGIN"] ?? "http://localhost:8080,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

// publicRouter is unauthenticated and must be mounted before documentsRouter
// below — documentsRouter is mounted at the bare "/api" prefix with a
// blanket requireNlamsUser, which would otherwise 401 every /api/public/*
// request before Express ever tries to match it against publicRouter.
app.use("/api/public", publicRouter);

app.use("/api/proposals", proposalsRouter);
app.use("/api", documentsRouter);
app.use("/api/parcels", parcelsRouter);
app.use("/api/parcels", compensationRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/grievances", grievancesRouter);
app.use("/api/audit", auditRouter);
app.use("/api/admin", adminAdaptersRouter);

app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  },
);

const port = Number(process.env["PORT"] ?? 4000);
app.listen(port, () => {
  console.log(`NLAMS API listening on http://localhost:${port}`);
  startSlaAlertScheduler();
  scanForSlaAlerts()
    .then(({ scanned, created }) =>
      console.log(`[sla-scanner] startup scan: ${scanned} proposals, ${created} new alert(s)`),
    )
    .catch((error) => console.error("[sla-scanner] startup scan failed", error));
});
