import { STAGE_ORDER, STAGE_LABELS, type RfctlarrStage } from "@/data/mockData";
import type { SlaResult, SlaStatus } from "@/lib/slaRules";
import { useI18n } from "@/context/I18nContext";
import { cn } from "@/lib/utils";

/** Values are i18n keys (see src/lib/i18n/common.ts `stageShort.*`) — wrap with `t()`. */
export const SHORT_STAGE: Record<RfctlarrStage, string> = {
  INTAKE: "stageShort.INTAKE",
  SIA: "stageShort.SIA",
  SIA_APPRAISAL: "stageShort.SIA_APPRAISAL",
  SEC_11: "stageShort.SEC_11",
  SEC_19: "stageShort.SEC_19",
  AWARD: "stageShort.AWARD",
  RR_COMPLETE: "stageShort.RR_COMPLETE",
};

export function StagePill({ stage }: { stage: RfctlarrStage }) {
  const { t } = useI18n();
  return (
    <span
      className="inline-block whitespace-nowrap rounded-[4px] border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground/80"
      title={t(STAGE_LABELS[stage]!)}
    >
      {t(SHORT_STAGE[stage]!)}
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
  const { t } = useI18n();
  const text =
    sla.limitDays == null
      ? t("common.noClock")
      : sla.status === "BREACHED"
        ? `${Math.abs(sla.daysRemaining)}${t("common.dOverdue")}`
        : `${sla.daysRemaining}${t("common.dLeft")}`;
  return (
    <span
      className={cn(
        "num inline-flex items-center whitespace-nowrap rounded-[4px] border font-semibold",
        SLA_TONE[sla.status],
        size === "lg" ? "px-3 py-1.5 text-[13px]" : "px-1.5 py-0.5 text-[11px]",
      )}
      title={t(sla.consequence)}
    >
      {text}
    </span>
  );
}
