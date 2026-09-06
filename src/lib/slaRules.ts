import type { Proposal, RfctlarrStage } from "@/data/mockData";

export type SlaStatus = "OK" | "AT_RISK" | "BREACHED";

export interface SlaRule {
  limitDays: number;
  statuteRef: string;
  consequence: string;
  description: string;
}

/** Statutory deadlines under the RFCTLARR Act, 2013. */
export const SLA_RULES: Partial<Record<RfctlarrStage, SlaRule>> = {
  SIA: {
    limitDays: 180,
    statuteRef: "Sec. 4(2)",
    consequence: "SIA study must be completed and made public within 6 months.",
    description: "SIA commencement → SIA report",
  },
  SIA_APPRAISAL: {
    limitDays: 365,
    statuteRef: "Sec. 14",
    consequence: "SIA lapses; fresh Social Impact Assessment required.",
    description: "SIA appraisal → Sec. 11 preliminary notification",
  },
  SEC_11: {
    limitDays: 365,
    statuteRef: "Sec. 19(7)",
    consequence: "Preliminary notification lapses; acquisition must restart.",
    description: "Sec. 11 notification → Sec. 19 declaration",
  },
  SEC_19: {
    limitDays: 365,
    statuteRef: "Sec. 25",
    consequence: "Proceedings lapse; entire acquisition stands abated.",
    description: "Sec. 19 declaration → Award",
  },
};

export const AT_RISK_THRESHOLD_DAYS = 60;

export interface SlaResult {
  daysElapsed: number;
  daysRemaining: number;
  status: SlaStatus;
  statuteRef: string;
  consequence: string;
  limitDays: number | null;
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
      consequence: "No statutory clock applies at this stage.",
      limitDays: null,
      description: "Not time-bound",
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

export const SLA_STATUS_LABEL: Record<SlaStatus, string> = {
  OK: "On track",
  AT_RISK: "Approaching breach",
  BREACHED: "Statutory breach",
};
