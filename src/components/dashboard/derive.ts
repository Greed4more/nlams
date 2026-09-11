import { useMemo } from "react";
import type { Proposal, RfctlarrStage } from "@/data/mockData";
import { getSlaStatus, SLA_RULES, type SlaStatus } from "@/lib/slaRules";
import { STAGE_ORDER, STAGE_LABELS } from "@/data/mockData";
import { useRole } from "@/context/RoleContext";
import { useI18n } from "@/context/I18nContext";

export const CHART_COLORS = {
  ok: "var(--status-ok)",
  warn: "var(--status-warn)",
  critical: "var(--status-critical)",
  info: "var(--status-info)",
  navy: "var(--navy)",
} as const;

export interface Enriched {
  proposal: Proposal;
  sla: ReturnType<typeof getSlaStatus>;
}

/** Values are i18n keys (src/lib/i18n/common.ts `stageChart.*`) — already translated below. */
const SHORT_LABEL: Record<RfctlarrStage, string> = {
  INTAKE: "stageChart.INTAKE",
  SIA: "stageChart.SIA",
  SIA_APPRAISAL: "stageChart.SIA_APPRAISAL",
  SEC_11: "stageChart.SEC_11",
  SEC_19: "stageChart.SEC_19",
  AWARD: "stageChart.AWARD",
  RR_COMPLETE: "stageChart.RR_COMPLETE",
};

export interface StageRow {
  stage: RfctlarrStage;
  label: string;
  short: string;
  OK: number;
  AT_RISK: number;
  BREACHED: number;
  total: number;
  statuteRef: string;
}

export interface FlowPoint {
  month: string;
  assessed: number;
  disbursed: number;
}

export interface ActivityEvent {
  id: string;
  action: string;
  proposalId: string;
  at: Date;
  ago: string;
  docType: string;
}

/** Values are i18n keys (src/lib/i18n/common.ts `activity.*`). */
const ACTION_LABEL: Record<string, string> = {
  SIA_REPORT: "activity.SIA_REPORT",
  SEC_11_NOTIFICATION: "activity.SEC_11_NOTIFICATION",
  SEC_19_DECLARATION: "activity.SEC_19_DECLARATION",
  AWARD_ORDER: "activity.AWARD_ORDER",
  RR_SCHEME: "activity.RR_SCHEME",
};

function agoLabel(at: Date, now: Date, t: (key: string) => string): string {
  const mins = Math.max(1, Math.round((now.getTime() - at.getTime()) / 60000));
  if (mins < 60) return `${mins}${t("common.minAgo")}`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}${t("common.hourAgo")}`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}${t("common.dayAgo")}`;
  return `${Math.round(days / 30)}${t("common.monthAgo")}`;
}

export function buildDerived(list: Proposal[], t: (key: string) => string) {
  const now = new Date();
  const enriched: Enriched[] = list.map((proposal) => ({
    proposal,
    sla: getSlaStatus(proposal),
  }));

  const totals = {
    count: list.length,
    areaHa: list.reduce((s, p) => s + p.totalAreaHa, 0),
    states: new Set(list.map((p) => p.state)).size,
    assessed: list.reduce((s, p) => s + p.compensation.assessed, 0),
    disbursed: list.reduce((s, p) => s + p.compensation.disbursed, 0),
    families: list.reduce((s, p) => s + p.affectedFamilies, 0),
    breached: enriched.filter((e) => e.sla.status === "BREACHED").length,
    atRisk: enriched.filter((e) => e.sla.status === "AT_RISK").length,
    newThisQuarter: list.filter(
      (p) => now.getTime() - new Date(p.initiatedAt).getTime() <= 180 * 86400000,
    ).length,
  };

  const disbursalPct = totals.assessed ? Math.round((totals.disbursed / totals.assessed) * 100) : 0;

  const stageBreakdown: StageRow[] = STAGE_ORDER.map((stage) => {
    const rows = enriched.filter((e) => e.proposal.currentStage === stage);
    const by = (s: SlaStatus) => rows.filter((e) => e.sla.status === s).length;
    return {
      stage,
      label: t(STAGE_LABELS[stage]!),
      short: t(SHORT_LABEL[stage]!),
      OK: by("OK"),
      AT_RISK: by("AT_RISK"),
      BREACHED: by("BREACHED"),
      total: rows.length,
      statuteRef: SLA_RULES[stage]?.statuteRef ?? t("common.noStatutoryClock"),
    };
  });

  const breachedQueue = enriched
    .filter((e) => e.sla.status === "BREACHED")
    .sort((a, b) => b.sla.daysElapsed - b.sla.limitDays! - (a.sla.daysElapsed - a.sla.limitDays!));

  const stateDistribution = Object.values(
    list.reduce<Record<string, { state: string; count: number; areaHa: number }>>((acc, p) => {
      const row = (acc[p.state] ??= { state: p.state, count: 0, areaHa: 0 });
      row.count += 1;
      row.areaHa += p.totalAreaHa;
      return acc;
    }, {}),
  ).sort((a, b) => b.count - a.count);

  const compensationFlow: FlowPoint[] = (() => {
    const months: FlowPoint[] = [];
    const keys: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      keys.push(`${d.getUTCFullYear()}-${d.getUTCMonth()}`);
      months.push({
        month: d.toLocaleString("en-IN", { month: "short", timeZone: "UTC" }),
        assessed: 0,
        disbursed: 0,
      });
    }
    list.forEach((p, i) => {
      const entered = new Date(p.stageEnteredAt);
      let idx = keys.indexOf(`${entered.getUTCFullYear()}-${entered.getUTCMonth()}`);
      if (idx === -1) idx = i % 12;
      const m = months[idx]!;
      m.assessed += p.compensation.assessed / 1_00_00_000;
      m.disbursed += p.compensation.disbursed / 1_00_00_000;
    });
    return months.map((m) => ({
      month: m.month,
      assessed: Number(m.assessed.toFixed(1)),
      disbursed: Number(m.disbursed.toFixed(1)),
    }));
  })();

  const rrProgress = (() => {
    let compensated = 0;
    let partial = 0;
    let pending = 0;
    for (const p of list) {
      const n = p.parcels.length || 1;
      const share = p.affectedFamilies / n;
      for (const parcel of p.parcels) {
        const ratio = parcel.compensationAssessed
          ? parcel.compensationDisbursed / parcel.compensationAssessed
          : 0;
        if (ratio >= 0.99) compensated += share;
        else if (ratio > 0) partial += share;
        else pending += share;
      }
    }
    compensated = Math.round(compensated);
    partial = Math.round(partial);
    pending = Math.round(pending);
    return {
      total: compensated + partial + pending,
      data: [
        { name: t("common.compensated"), value: compensated, color: CHART_COLORS.ok },
        { name: t("common.partiallyCompensated"), value: partial, color: CHART_COLORS.warn },
        { name: t("common.pending"), value: pending, color: CHART_COLORS.critical },
      ],
    };
  })();

  const recentActivity: ActivityEvent[] = list
    .flatMap((p) =>
      p.documents.map((d) => ({
        id: d.id,
        action: ACTION_LABEL[d.type] ? t(ACTION_LABEL[d.type]!) : d.type,
        proposalId: p.id,
        at: new Date(d.uploadedAt),
        ago: agoLabel(new Date(d.uploadedAt), now, t),
        docType: d.type,
      })),
    )
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 6);

  return {
    enriched,
    totals,
    disbursalPct,
    stageBreakdown,
    breachedQueue,
    stateDistribution,
    compensationFlow,
    rrProgress,
    recentActivity,
  };
}

export type Derived = ReturnType<typeof buildDerived>;

/** Role-scoped derived dataset for every dashboard widget. */
export function useDerived(): Derived {
  const { scopedProposals } = useRole();
  const { t } = useI18n();
  return useMemo(() => buildDerived(scopedProposals, t), [scopedProposals, t]);
}
