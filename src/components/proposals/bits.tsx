import { STAGE_ORDER, STAGE_LABELS, type RfctlarrStage } from "@/data/mockData";
import type { SlaResult, SlaStatus } from "@/lib/slaRules";
import { cn } from "@/lib/utils";

export const SHORT_STAGE: Record<RfctlarrStage, string> = {
  INTAKE: "Intake",
  SIA: "SIA Study",
  SIA_APPRAISAL: "SIA Appraisal",
  SEC_11: "Sec. 11 Notification",
  SEC_19: "Sec. 19 Declaration",
  AWARD: "Sec. 26 Award",
  RR_COMPLETE: "R&R Completion",
};

export function StagePill({ stage }: { stage: RfctlarrStage }) {
  return (
    <span
      className="inline-block whitespace-nowrap rounded-[4px] border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground/80"
      title={STAGE_LABELS[stage]}
    >
      {SHORT_STAGE[stage]}
    </span>
  );
}

export function StageMiniBar({ stage }: { stage: RfctlarrStage }) {
  const idx = STAGE_ORDER.indexOf(stage);
  return (
    <div className="flex items-center gap-[2px]" title={`Step ${idx + 1} of 7`}>
      {STAGE_ORDER.map((s, i) => (
        <span
          key={s}
          className={cn(
            "h-[6px] w-[9px] rounded-[1px]",
            i <= idx ? "bg-navy" : "bg-border",
          )}
        />
      ))}
    </div>
  );
}

const SLA_TONE: Record<SlaStatus, string> = {
  OK: "border-status-ok/30 bg-status-ok/10 text-status-ok",
  AT_RISK: "border-status-warn/30 bg-status-warn/10 text-status-warn",
  BREACHED: "border-status-critical/30 bg-status-critical/10 text-status-critical",
};

export function SlaBadge({ sla, size = "sm" }: { sla: SlaResult; size?: "sm" | "lg" }) {
  const text =
    sla.limitDays == null
      ? "No clock"
      : sla.status === "BREACHED"
        ? `${Math.abs(sla.daysRemaining)}d overdue`
        : `${sla.daysRemaining}d left`;
  return (
    <span
      className={cn(
        "num inline-flex items-center whitespace-nowrap rounded-[4px] border font-semibold",
        SLA_TONE[sla.status],
        size === "lg" ? "px-3 py-1.5 text-[13px]" : "px-1.5 py-0.5 text-[11px]",
      )}
      title={sla.consequence}
    >
      {text}
    </span>
  );
}
