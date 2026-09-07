import "dotenv/config";
import express from "express";
import cors from "cors";
import { proposalsRouter } from "./routes/proposals.js";
import { documentsRouter } from "./routes/documents.js";
import { parcelsRouter } from "./routes/parcels.js";
import { alertsRouter } from "./routes/alerts.js";
import { scanForSlaAlerts, startSlaAlertScheduler } from "./jobs/slaAlertScanner.js";

const app = express();

app.use(cors({ origin: process.env["CORS_ORIGIN"] ?? "http://localhost:8080", credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/proposals", proposalsRouter);
app.use("/api", documentsRouter);
app.use("/api/parcels", parcelsRouter);
app.use("/api/alerts", alertsRouter);

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
