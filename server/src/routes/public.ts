import { Router } from "express";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { prisma } from "../db.js";
import { BYPASS_PASSWORD, BYPASS_PERSONAS, issueBypassToken } from "../lib/bypassAuth.js";

/**
 * Public case-transparency portal — no auth, no PII. Ported from Bhumitra's
 * public module (Module 7): aggregate, non-identifying metrics only, per
 * Sec. 4 & Sec. 11 RFCTLARR Act 2013 and the DPDP Act 2023.
 */
export const publicRouter = Router();

const bypassLoginBody = z.object({
  password: z.string(),
  role: z.enum(["DOLR_SECRETARY", "DISTRICT_COLLECTOR", "LAO", "STATE_REVENUE"]),
});

/**
 * POST /api/public/auth/bypass — demo sign-in that doesn't need Supabase.
 * See server/src/lib/bypassAuth.ts for why this exists and its limits.
 */
publicRouter.post("/auth/bypass", (req, res) => {
  const parsed = bypassLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  if (parsed.data.password !== BYPASS_PASSWORD) {
    res.status(401).json({ error: "Incorrect bypass password" });
    return;
  }
  const principal = BYPASS_PERSONAS[parsed.data.role as Role];
  const token = issueBypassToken(principal);
  res.json({
    token,
    role: principal.role,
    name: principal.name,
    email: principal.email,
    states: principal.states,
  });
});

publicRouter.get("/proposals/search", async (req, res) => {
  const { state, district, name } = req.query;

  const where: Record<string, unknown> = {};
  if (state) where["state"] = String(state);
  if (district) where["district"] = String(district);
  if (name) where["projectName"] = { contains: String(name), mode: "insensitive" };

  const proposals = await prisma.proposal.findMany({
    where,
    select: {
      id: true,
      projectName: true,
      state: true,
      district: true,
      currentStage: true,
      initiatedAt: true,
    },
    take: 50,
  });

  res.json({ count: proposals.length, proposals });
});

publicRouter.get("/proposals/:id", async (req, res) => {
  const proposal = await prisma.proposal.findUnique({
    where: { id: req.params.id },
    include: { parcels: true, compensationRecords: true },
  });
  if (!proposal) {
    res.status(404).json({ error: "Public record not found" });
    return;
  }

  const totalCompensationDisbursed = proposal.compensationRecords.reduce(
    (sum, r) => sum + r.totalCompensation,
    0,
  );
  const totalAreaHa = proposal.parcels.reduce((sum, p) => sum + p.areaHa, 0);

  res.json({
    projectId: proposal.id,
    projectName: proposal.projectName,
    state: proposal.state,
    district: proposal.district,
    currentStage: proposal.currentStage,
    aggregateMetrics: {
      totalParcelsNotified: proposal.parcels.length,
      aggregateAreaNotifiedHectares: Number(totalAreaHa.toFixed(2)),
      aggregateCompensationDisbursedCrores: Number(
        (totalCompensationDisbursed / 10_000_000).toFixed(2),
      ),
      affectedFamilies: proposal.affectedFamilies,
    },
    transparencyNotice:
      "Public disclosure under Section 4 & Section 11 RFCTLARR Act 2013. Personal identifiable information (PII) excluded per the Digital Personal Data Protection Act 2023.",
  });
});
