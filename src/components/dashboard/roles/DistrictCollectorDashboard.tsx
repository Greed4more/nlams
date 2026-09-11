import { Link } from "@tanstack/react-router";
import {
  AlertOctagon,
  Clock,
  FileCheck2,
  Users,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Building,
  Scale,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { formatCrore, formatINRFull } from "@/data/mockData";
import { useDerived } from "../derive";
import { useRole, NO_CREDENTIALS_HINT } from "@/context/RoleContext";
import { useGrievancesQuery } from "@/hooks/useGrievances";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/context/I18nContext";
import { cn } from "@/lib/utils";

export function DistrictCollectorDashboard() {
  const { person, canAct, scopedProposals } = useRole();
  const { totals, disbursalPct, enriched, stageBreakdown } = useDerived();
  const { data: grievances = [] } = useGrievancesQuery();
  const { t } = useI18n();

  // Filter grievances in scope
  const districtProposalIds = new Set(scopedProposals.map((p) => p.id));
  const districtGrievances = grievances.filter(
    (g) => districtProposalIds.has(g.proposalId) || g.proposal?.district === "South Goa",
  );

  // Statutory lapse items (sorted by urgency: breached first, then shortest remaining time)
  const statutoryLapseItems = enriched
    .filter((e) => e.sla.limitDays !== null)
    .sort((a, b) => a.sla.daysRemaining - b.sla.daysRemaining);

  const urgentCount = statutoryLapseItems.filter(
    (item) => item.sla.status === "BREACHED" || item.sla.status === "AT_RISK",
  ).length;

  return (
    <div className="space-y-4">
      {/* Collector Command Banner */}
      <div className="rounded-[6px] border border-navy/20 bg-gradient-to-r from-navy via-[#163a5f] to-[#1c4b7a] p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-400/20 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-amber-300">
                {t("district.banner.badge")}
              </span>
              <span className="text-[12px] text-white/80">{t("district.banner.location")}</span>
            </div>
            <h2 className="mt-1.5 text-[20px] font-semibold tracking-tight">
              {t("district.banner.title")}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-white/80">
              {t("district.banner.presidedByPrefix")} {person}{" "}
              {t("district.banner.presidedBySuffix")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/proposals"
              className="inline-flex items-center gap-1.5 rounded-[4px] bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/20"
            >
              <FileCheck2 className="size-3.5" />
              {t("district.banner.caseRegister")}
            </Link>
          </div>
        </div>
      </div>

      {/* District Governance KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-navy" />
          <div className="label-xs">{t("district.kpi.activeProposals")}</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-foreground">
            {totals.count}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            {totals.areaHa.toFixed(2)} {t("district.kpi.activeProposalsSub")}
          </div>
        </div>

        <div className="panel relative overflow-hidden px-4 py-3">
          <span
            className={cn(
              "absolute inset-y-0 left-0 w-[3px]",
              urgentCount > 0 ? "bg-status-critical" : "bg-status-ok",
            )}
          />
          <div className="label-xs">{t("district.kpi.lapseClocks")}</div>
          <div className="num mt-2 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold leading-none text-status-critical">
              {totals.breached}
            </span>
            <span className="text-[14px] text-muted-foreground">
              {t("district.kpi.breachedDot")} {totals.atRisk} &lt;60d
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            {t("district.kpi.lapseRiskNote")}
          </div>
        </div>

        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-status-ok" />
          <div className="label-xs">{t("district.kpi.rrTitle")}</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-foreground">
            {totals.families.toLocaleString("en-IN")}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            {disbursalPct}% {t("district.kpi.compensatedSuffix")} (
            {formatCrore(totals.disbursed, 1)} {t("district.kpi.ofWord")}{" "}
            {formatCrore(totals.assessed, 1)})
          </div>
          <div className="mt-2 h-[3px] w-full bg-muted">
            <div className="h-full bg-status-ok" style={{ width: `${disbursalPct}%` }} />
          </div>
        </div>

        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-status-warn" />
          <div className="label-xs">{t("district.kpi.grievanceTitle")}</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-foreground">
            {districtGrievances.length > 0 ? districtGrievances.length : 3}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            {t("district.kpi.grievanceSub")}
          </div>
        </div>
      </div>

      {/* Statutory Lapse Countdown Queue & Pipeline Funnel */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {/* Left 3 cols: High Priority Statutory Lapse Alert Queue */}
        <div className="space-y-3 lg:col-span-3">
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <Scale className="size-3.5 text-status-critical" />
                <div className="label-xs">{t("district.section.lapseQueue")}</div>
              </div>
              <span className="num text-[11px] text-muted-foreground">
                {t("district.section.mandatoryClocks")}
              </span>
            </div>
            <div className="divide-y divide-border">
              {statutoryLapseItems.length === 0 ? (
                <div className="p-4 text-center text-[12.5px] text-muted-foreground">
                  {t("district.empty.noClocks")}
                </div>
              ) : (
                statutoryLapseItems.map((item) => {
                  const { proposal, sla } = item;
                  const isBreached = sla.status === "BREACHED";
                  const isAtRisk = sla.status === "AT_RISK";
                  const pct = Math.min(
                    100,
                    Math.round((sla.daysElapsed / (sla.limitDays ?? 365)) * 100),
                  );

                  return (
                    <div key={proposal.id} className="p-3.5 hover:bg-muted/30 transition-colors">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold text-navy">
                              {proposal.id}
                            </span>
                            <span className="rounded bg-navy/10 px-1.5 py-0.5 text-[10.5px] font-medium text-navy">
                              {sla.statuteRef}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {proposal.requiringBody}
                            </span>
                          </div>
                          <h4 className="mt-1 text-[13.5px] font-semibold text-foreground truncate">
                            <Link
                              to="/proposals"
                              className="hover:text-status-info hover:underline"
                            >
                              {proposal.projectName}
                            </Link>
                          </h4>
                          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                            {sla.description} · Stage:{" "}
                            <span className="font-medium text-foreground">
                              {proposal.currentStage}
                            </span>
                          </p>
                        </div>

                        {/* Status badge */}
                        <div className="text-right shrink-0">
                          {isBreached ? (
                            <span className="inline-flex items-center gap-1 rounded bg-status-critical/15 px-2 py-0.5 text-[11px] font-bold text-status-critical">
                              <AlertOctagon className="size-3" />
                              {t("district.badge.lapsedBy")} {Math.abs(sla.daysRemaining)}d
                            </span>
                          ) : isAtRisk ? (
                            <span className="inline-flex items-center gap-1 rounded bg-status-warn/20 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                              <Clock className="size-3" />
                              {sla.daysRemaining}d {t("district.badge.remaining")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-status-ok/10 px-2 py-0.5 text-[11px] font-medium text-status-ok">
                              <CheckCircle2 className="size-3" />
                              {sla.daysRemaining}d {t("district.badge.remaining")}
                            </span>
                          )}
                          <div className="num mt-1 text-[11px] text-muted-foreground">
                            {sla.daysElapsed}d / {sla.limitDays}d {t("district.elapsedSuffix")}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar & Consequence Alert */}
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            {t("district.elapsedTimeLabel")}
                          </span>
                          <span
                            className={cn(
                              "num font-medium",
                              isBreached ? "text-status-critical" : "text-foreground",
                            )}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded transition-all",
                              isBreached
                                ? "bg-status-critical"
                                : isAtRisk
                                  ? "bg-status-warn"
                                  : "bg-status-ok",
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2 rounded bg-muted/40 px-2.5 py-1.5 text-[11.5px]">
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">
                            {t("district.consequenceLabel")}
                          </strong>{" "}
                          {sla.consequence}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="shrink-0 text-[11px] font-medium text-muted-foreground cursor-not-allowed">
                              {t("district.advanceStageTooltip")}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{NO_CREDENTIALS_HINT}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* District Grievance Resolution Monitor */}
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="size-3.5 text-status-warn" />
                <div className="label-xs">{t("district.section.grievanceTitle")}</div>
              </div>
              <Link
                to="/grievances"
                className="text-[11px] font-medium text-status-info hover:underline"
              >
                {t("district.viewAllGrievances")}
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">
                      {t("district.table.ticket")}
                    </th>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">
                      {t("district.table.issueCategory")}
                    </th>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">
                      {t("common.status")}
                    </th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">
                      {t("district.table.slaClock")}
                    </th>
                    <th className="label-xs border-b border-border px-3 py-2 text-center">
                      {t("district.table.execAction")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {districtGrievances.slice(0, 4).map((g) => (
                    <tr key={g.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-[11.5px] font-semibold text-navy">
                        {g.id}
                      </td>
                      <td className="px-3 py-2 text-foreground font-medium">{g.issueCategory}</td>
                      <td className="px-3 py-2">
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10.5px] font-medium text-foreground">
                          {g.status}
                        </span>
                      </td>
                      <td className="num px-3 py-2 text-right text-[11px] text-muted-foreground">
                        {new Date(g.slaDeadline).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block cursor-not-allowed rounded bg-muted/70 px-2 py-0.5 text-[10.5px] text-muted-foreground">
                              {t("district.resolveTicketTooltip")}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{NO_CREDENTIALS_HINT}</TooltipContent>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                  {districtGrievances.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-4 text-center text-muted-foreground text-[12px]"
                      >
                        {t("district.empty.noGrievances")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right 2 cols: District Pipeline Funnel & Litigation Risk Monitor */}
        <div className="space-y-3 lg:col-span-2">
          {/* Stage Progression Funnel */}
          <section className="panel p-3.5">
            <div className="border-b border-border pb-2">
              <div className="label-xs flex items-center gap-1.5">
                <Building className="size-3.5 text-navy" />
                {t("district.section.funnelTitle")}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {t("district.section.funnelSub")}
              </div>
            </div>

            <div className="mt-3 space-y-2.5">
              {stageBreakdown.map((row) => (
                <div key={row.stage} className="text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{row.label}</span>
                    <span className="num font-semibold text-foreground">
                      {row.total} {t("district.casesSuffix")}
                    </span>
                  </div>
                  <div className="mt-1 flex h-2 w-full overflow-hidden rounded bg-muted">
                    {row.OK > 0 && (
                      <div
                        className="bg-status-ok"
                        style={{ width: `${(row.OK / (row.total || 1)) * 100}%` }}
                      />
                    )}
                    {row.AT_RISK > 0 && (
                      <div
                        className="bg-status-warn"
                        style={{ width: `${(row.AT_RISK / (row.total || 1)) * 100}%` }}
                      />
                    )}
                    {row.BREACHED > 0 && (
                      <div
                        className="bg-status-critical"
                        style={{ width: `${(row.BREACHED / (row.total || 1)) * 100}%` }}
                      />
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-[10.5px] text-muted-foreground">
                    <span>{row.statuteRef}</span>
                    <span>
                      {row.BREACHED > 0
                        ? `${row.BREACHED} ${t("common.breached")}`
                        : t("district.onSchedule")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Litigation Risk & Public Hearing Consent Monitor */}
          <section className="panel p-3.5">
            <div className="border-b border-border pb-2">
              <div className="label-xs flex items-center gap-1.5">
                <Scale className="size-3.5 text-status-warn" />
                {t("district.section.riskTitle")}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {t("district.section.riskSub")}
              </div>
            </div>

            <div className="mt-3 divide-y divide-border">
              {scopedProposals.slice(0, 3).map((p) => {
                const multiCropFlag = p.parcels.some((par) =>
                  par.restrictionFlags.includes("MULTI_CROP_IRRIGATED"),
                );
                const unverifiedFlag = p.parcels.some(
                  (par) => par.provenance === "LEGACY_MIGRATED",
                );
                const riskLevel = multiCropFlag || unverifiedFlag ? "MEDIUM" : "LOW";

                return (
                  <div key={p.id} className="py-2 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground truncate max-w-[180px]">
                        {p.projectName}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-bold",
                          riskLevel === "MEDIUM"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800",
                        )}
                      >
                        {riskLevel === "MEDIUM"
                          ? t("district.risk.MEDIUM")
                          : t("district.risk.LOW")}{" "}
                        {t("district.risk.suffix")}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {p.affectedFamilies} {t("common.families")} · {p.parcels.length}{" "}
                      {t("common.parcels")} ({p.totalAreaHa} Ha)
                    </div>
                    {multiCropFlag && (
                      <div className="mt-1 text-[10.5px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5">
                        {t("district.warning.multiCrop")}
                      </div>
                    )}
                    {unverifiedFlag && (
                      <div className="mt-1 text-[10.5px] text-status-warn bg-status-warn/10 rounded px-1.5 py-0.5">
                        {t("district.warning.legacyBoundary")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Collector Statutory Powers Notice */}
          <div className="rounded-[6px] border border-border bg-muted/30 p-3 text-[11.5px] text-muted-foreground">
            <strong className="text-foreground">
              {t("district.notice.collectorFunctionLabel")}
            </strong>{" "}
            {t("district.notice.collectorFunctionText")}
          </div>
        </div>
      </div>
    </div>
  );
}
