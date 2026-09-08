import { Prisma, type RiskTier } from "@prisma/client";
import { prisma } from "../db.js";

const ML_SERVICE_URL = process.env["ML_SERVICE_URL"] ?? "http://localhost:8000";

interface RiskFactor {
  feature: string;
  importance: number;
}

interface RiskPrediction {
  riskScore: number;
  riskTier: RiskTier;
  topContributingFactors: RiskFactor[];
}

function hasFlag(restrictionFlags: unknown, flag: string): boolean {
  return Array.isArray(restrictionFlags) && restrictionFlags.includes(flag);
}

/**
 * Litigation & delay risk scoring (Module 5) — ported from Bhumitra's
 * risk_bridge.service.js. Calls the Python FastAPI ml_service; on any
 * failure (service down, unreachable) falls back to the same rule-based
 * heuristic Bhumitra uses, so the feature degrades gracefully rather than
 * blocking the officer workflow.
 */
export async function triggerRiskEvaluation(proposalId: string) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { parcels: true, slaAlerts: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!proposal) return null;

  const multiCropIrrigatedFlag = proposal.parcels.some((p) =>
    hasFlag(p.restrictionFlags, "multi_crop_irrigated"),
  )
    ? 1
    : 0;
  const isLandbankParcel = proposal.parcels.some((p) => hasFlag(p.restrictionFlags, "landbank_parcel"))
    ? 1
    : 0;
  const consentPercentageCollected = proposal.consentPercentage ?? 50.0;
  const slaOverrunFlag = proposal.slaAlerts[0] ? 1 : 0;
  // No live valuation feed wired up yet — same fixed estimate Bhumitra uses.
  const valuationGapPct = 18.5;

  const payload = {
    project_id: proposal.id,
    multi_crop_irrigated_flag: multiCropIrrigatedFlag,
    consent_percentage_collected: consentPercentageCollected,
    valuation_gap_pct: valuationGapPct,
    is_landbank_parcel: isLandbankParcel,
    sla_overrun_flag: slaOverrunFlag,
    district_code: proposal.district,
  };

  let prediction: RiskPrediction;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${ML_SERVICE_URL}/predict-risk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`ml_service responded ${response.status}`);
    const data = (await response.json()) as {
      risk_score: number;
      risk_tier: string;
      top_contributing_factors: RiskFactor[];
    };
    prediction = {
      riskScore: data.risk_score,
      riskTier: data.risk_tier.toUpperCase() as RiskTier,
      topContributingFactors: data.top_contributing_factors,
    };
  } catch (error) {
    console.warn("[risk-bridge] ml_service unreachable, using local fallback:", (error as Error).message);
    let score = 25.0;
    if (multiCropIrrigatedFlag === 1) score += 30.0;
    if (consentPercentageCollected < 70) score += 25.0;
    if (slaOverrunFlag === 1) score += 20.0;
    score = Math.min(99.0, Math.max(5.0, score));
    prediction = {
      riskScore: score,
      riskTier: score > 65 ? "HIGH" : score > 35 ? "MEDIUM" : "LOW",
      topContributingFactors: [
        { feature: "multi_crop_irrigated_flag", importance: multiCropIrrigatedFlag === 1 ? 0.45 : 0.05 },
        { feature: "consent_percentage_collected", importance: consentPercentageCollected < 70 ? 0.35 : 0.1 },
      ],
    };
  }

  return prisma.riskScore.create({
    data: {
      proposalId,
      riskScore: prediction.riskScore,
      riskTier: prediction.riskTier,
      topContributingFactors: prediction.topContributingFactors as unknown as Prisma.InputJsonValue,
    },
  });
}
