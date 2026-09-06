import type { RfctlarrStage } from "@prisma/client";

/**
 * Statutory deadlines under the RFCTLARR Act, 2013 — mirrors
 * src/lib/slaRules.ts on the frontend. Kept as a small, deliberate
 * duplication (different runtime, different Stage type source) rather than
 * a cross-package import.
 */
export const SLA_LIMIT_DAYS: Partial<Record<RfctlarrStage, number>> = {
  SIA: 180,
  SIA_APPRAISAL: 365,
  SEC_11: 365,
  SEC_19: 365,
};

export const AT_RISK_THRESHOLD_DAYS = 60;

export type SlaStatus = "OK" | "AT_RISK" | "BREACHED";

export function getSlaStatus(
  stage: RfctlarrStage,
  stageEnteredAt: Date,
  now: Date = new Date(),
): { status: SlaStatus; daysElapsed: number; daysRemaining: number } {
  const daysElapsed = Math.max(
    0,
    Math.floor((now.getTime() - stageEnteredAt.getTime()) / 86400000),
  );
  const limitDays = SLA_LIMIT_DAYS[stage];
  if (limitDays == null) return { status: "OK", daysElapsed, daysRemaining: Infinity };

  const daysRemaining = limitDays - daysElapsed;
  const status: SlaStatus =
    daysRemaining < 0 ? "BREACHED" : daysRemaining < AT_RISK_THRESHOLD_DAYS ? "AT_RISK" : "OK";
  return { status, daysElapsed, daysRemaining };
}
