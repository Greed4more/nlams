import type { Proposal, RfctlarrStage } from "@/data/mockData";

export type SlaStatus = "OK" | "AT_RISK" | "BREACHED";

export interface SlaRule {
  limitDays: number;
  statuteRef: string;
  /** i18n key (src/lib/i18n/common.ts `sla.consequence.*`) — wrap with `t()`. */
  consequence: string;
  /** i18n key (src/lib/i18n/common.ts `sla.description.*`) — wrap with `t()`. */
  description: string;
}

/** Statutory deadlines under the RFCTLARR Act, 2013. */
export const SLA_RULES: Partial<Record<RfctlarrStage, SlaRule>> = {
  SIA: {
    limitDays: 180,
    statuteRef: "Sec. 4(2)",
    consequence: "sla.consequence.SIA",
    description: "sla.description.SIA",
  },
  SIA_APPRAISAL: {
    limitDays: 365,
    statuteRef: "Sec. 14",
    consequence: "sla.consequence.SIA_APPRAISAL",
    description: "sla.description.SIA_APPRAISAL",
  },
  SEC_11: {
    limitDays: 365,
    statuteRef: "Sec. 19(7)",
    consequence: "sla.consequence.SEC_11",
    description: "sla.description.SEC_11",
  },
  SEC_19: {
    limitDays: 365,
    statuteRef: "Sec. 25",
    consequence: "sla.consequence.SEC_19",
    description: "sla.description.SEC_19",
  },
};

export const AT_RISK_THRESHOLD_DAYS = 60;

export interface SlaResult {
  daysElapsed: number;
  daysRemaining: number;
  status: SlaStatus;
  statuteRef: string;
  /** i18n key — wrap with `t()`. */
  consequence: string;
  limitDays: number | null;
  /** i18n key — wrap with `t()`. */
  description: string;
}

export function getSlaStatus(proposal: Proposal, now: Date = new Date()): SlaResult {
  const entered = new Date(proposal.stageEnteredAt).getTime();
  const daysElapsed = Math.max(0, Math.floor((now.getTime() - entered) / 86400000));
  const rule = SLA_RULES[proposal.currentStage];

  if (!rule) {
    return {
      daysElapsed,
      daysRemaining: Infinity,
      status: "OK",
      statuteRef: "—",
      consequence: "sla.consequence.default",
      limitDays: null,
      description: "sla.description.default",
    };
  }

  const daysRemaining = rule.limitDays - daysElapsed;
  const status: SlaStatus =
    daysRemaining < 0 ? "BREACHED" : daysRemaining < AT_RISK_THRESHOLD_DAYS ? "AT_RISK" : "OK";

  return {
    daysElapsed,
    daysRemaining,
    status,
    statuteRef: rule.statuteRef,
    consequence: rule.consequence,
    limitDays: rule.limitDays,
    description: rule.description,
  };
}

/** Values are i18n keys (src/lib/i18n/common.ts `slaStatus.*`) — wrap with `t()`. */
export const SLA_STATUS_LABEL: Record<SlaStatus, string> = {
  OK: "slaStatus.OK",
  AT_RISK: "slaStatus.AT_RISK",
  BREACHED: "slaStatus.BREACHED",
};
