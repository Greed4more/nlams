import { Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  TrendingUp,
  Globe2,
  Building2,
  FileText,
  AlertOctagon,
  ArrowRight,
  Server,
  RefreshCw,
} from "lucide-react";
import { formatCrore, formatINRFull } from "@/data/mockData";
import { useDerived } from "../derive";
import { useVerifyAuditChainMutation } from "@/hooks/useAudit";
import { useStateAdaptersQuery } from "@/hooks/useAdminAdapters";
import { useI18n } from "@/context/I18nContext";
import { StageChart } from "../StageChart";
import { DelayQueue } from "../DelayQueue";
import { cn } from "@/lib/utils";

export function DolrSecretaryDashboard() {
  const { totals, disbursalPct, enriched } = useDerived();
  const verifyChain = useVerifyAuditChainMutation();
  const { data: adaptersData } = useStateAdaptersQuery();
  const { t } = useI18n();

  // Aggregate by state
  const stateStats = Array.from(new Set(enriched.map((e) => e.proposal.state))).map((state) => {
    const inState = enriched.filter((e) => e.proposal.state === state);
    const count = inState.length;
    const area = inState.reduce((s, e) => s + e.proposal.totalAreaHa, 0);
    const assessed = inState.reduce((s, e) => s + e.proposal.compensation.assessed, 0);
    const disbursed = inState.reduce((s, e) => s + e.proposal.compensation.disbursed, 0);
    const breached = inState.filter((e) => e.sla.status === "BREACHED").length;
    const atRisk = inState.filter((e) => e.sla.status === "AT_RISK").length;
    const complianceRate = count > 0 ? Math.round(((count - breached) / count) * 100) : 100;
    return { state, count, area, assessed, disbursed, breached, atRisk, complianceRate };
  }).sort((a, b) => b.count - a.count);

  // Aggregate by requiring body
  const requiringBodyStats = Array.from(new Set(enriched.map((e) => e.proposal.requiringBody))).map((body) => {
    const inBody = enriched.filter((e) => e.proposal.requiringBody === body);
    const count = inBody.length;
    const assessed = inBody.reduce((s, e) => s + e.proposal.compensation.assessed, 0);
    const disbursed = inBody.reduce((s, e) => s + e.proposal.compensation.disbursed, 0);
    return { body, count, assessed, disbursed };
  }).sort((a, b) => b.assessed - a.assessed);

  return (
    <div className="space-y-4">
      {/* Apex Banner */}
      <div className="rounded-[6px] border border-navy/20 bg-gradient-to-r from-navy to-[#183d63] p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-white/15 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-white">
                {t("dolr.banner.badge")}
              </span>
              <span className="text-[12px] text-white/70">{t("dolr.banner.dept")}</span>
            </div>
            <h2 className="mt-1.5 text-[20px] font-semibold tracking-tight">
              {t("dolr.banner.title")}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-white/80">{t("dolr.banner.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/adapters"
              className="inline-flex items-center gap-1.5 rounded-[4px] bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/20"
            >
              <Server className="size-3.5" />
              {t("dolr.banner.adaptersRegistry")}
            </Link>
          </div>
        </div>
      </div>

      {/* National KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-status-info" />
          <div className="label-xs">{t("dolr.kpi.activeCases")}</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-foreground">
            {totals.count}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            {totals.states} {t("dolr.kpi.activeCasesSub")}
          </div>
        </div>

        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-navy" />
          <div className="label-xs">{t("dolr.kpi.landArea")}</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-foreground">
            {totals.areaHa.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Ha
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            {totals.families.toLocaleString("en-IN")} {t("dolr.kpi.landAreaSub")}
          </div>
        </div>

        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-status-ok" />
          <div className="label-xs">{t("dolr.kpi.budget")}</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-foreground">
            {formatCrore(totals.disbursed)}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            {disbursalPct}% {t("dolr.kpi.disbursedOf")} {formatCrore(totals.assessed)}{" "}
            {t("dolr.kpi.assessedSuffix")}
          </div>
          <div className="mt-2 h-[3px] w-full bg-muted">
            <div className="h-full bg-status-ok" style={{ width: `${disbursalPct}%` }} />
          </div>
        </div>

        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-status-critical" />
          <div className="label-xs">{t("dolr.kpi.breaches")}</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-status-critical">
            {totals.breached}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            +{totals.atRisk} {t("dolr.kpi.breachesSub")}
          </div>
        </div>
      </div>

      {/* Main Grid: State Comparisons & Pipeline */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {/* Left Column: State Comparison Table & Requiring Body breakdown */}
        <div className="space-y-3 lg:col-span-3">
          {/* State Performance Table */}
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <Globe2 className="size-3.5 text-muted-foreground" />
                <div className="label-xs">{t("dolr.section.statePerf")}</div>
              </div>
              <span className="num text-[11px] text-muted-foreground">
                {stateStats.length} {t("dolr.section.reportingStates")}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">
                      {t("common.state")}
                    </th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">
                      {t("dolr.table.cases")}
                    </th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">
                      {t("dolr.table.area")}
                    </th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">
                      {t("dolr.table.disbursedAssessed")}
                    </th>
                    <th className="label-xs border-b border-border px-3 py-2 text-center">
                      {t("dolr.table.breaches")}
                    </th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">
                      {t("dolr.table.compliance")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stateStats.map((row) => (
                    <tr key={row.state} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium text-foreground">{row.state}</td>
                      <td className="num px-3 py-2 text-right">{row.count}</td>
                      <td className="num px-3 py-2 text-right">{row.area.toFixed(1)}</td>
                      <td className="num px-3 py-2 text-right text-[11.5px]">
                        <span className="font-semibold text-status-ok">{formatCrore(row.disbursed, 1)}</span>
                        <span className="text-muted-foreground"> / {formatCrore(row.assessed, 1)}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.breached > 0 ? (
                          <span className="num inline-flex rounded bg-status-critical/10 px-1.5 py-0.5 text-[11px] font-bold text-status-critical">
                            {row.breached} {t("common.breached")}
                          </span>
                        ) : (
                          <span className="num inline-flex rounded bg-status-ok/10 px-1.5 py-0.5 text-[11px] font-medium text-status-ok">
                            0 {t("common.onTrack")}
                          </span>
                        )}
                      </td>
                      <td className="num px-3 py-2 text-right font-medium">
                        <span className={row.complianceRate >= 80 ? "text-status-ok" : "text-status-warn"}>
                          {row.complianceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Requiring Body Breakdown */}
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <Building2 className="size-3.5 text-muted-foreground" />
                <div className="label-xs">{t("dolr.section.reqBodies")}</div>
              </div>
            </div>
            <div className="divide-y divide-border">
              {requiringBodyStats.map((item) => {
                const pct = totals.assessed > 0 ? Math.round((item.assessed / totals.assessed) * 100) : 0;
                return (
                  <div key={item.body} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[12.5px]">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground">{item.body}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 w-32 rounded bg-muted">
                          <div className="h-full rounded bg-navy" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="num text-[11px] text-muted-foreground">
                          {pct}% {t("dolr.pctOfBudget")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="num font-semibold text-foreground">{formatCrore(item.assessed)}</div>
                      <div className="num text-[11px] text-muted-foreground">
                        {item.count} {t("common.proposals")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Stage Pipeline & State Adapters / Vault */}
        <div className="space-y-3 lg:col-span-2">
          {/* Stage Chart */}
          <StageChart />

          {/* National Delay Queue */}
          <DelayQueue />

          {/* Pluggable State Adapters & Audit Vault Health */}
          <div className="grid grid-cols-1 gap-3">
            <section className="panel p-3.5">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="label-xs flex items-center gap-1.5">
                  <Server className="size-3.5 text-navy" />
                  {t("dolr.module9.title")}
                </div>
                <Link to="/admin/adapters" className="text-[11px] font-medium text-status-info hover:underline">
                  {t("dolr.module9.manage")}
                </Link>
              </div>
              <div className="mt-2.5 space-y-2 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("dolr.module9.referenceAdapter")}</span>
                  <span className="font-medium text-foreground">{t("dolr.module9.wbBanglarbhumi")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("dolr.module9.syncStatus")}</span>
                  <span className="inline-flex items-center gap-1 rounded bg-status-ok/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-status-ok">
                    {t("dolr.module9.activeIdle")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("dolr.module9.registeredStates")}</span>
                  <span className="num font-semibold text-foreground">
                    {adaptersData?.totalStatesSupported ?? 6} {t("dolr.module9.statesUts")}
                  </span>
                </div>
              </div>
            </section>

            <section className="panel p-3.5">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="label-xs flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-status-info" />
                  {t("dolr.vault.title")}
                </div>
                <button
                  type="button"
                  onClick={() => verifyChain.mutate()}
                  disabled={verifyChain.isPending}
                  className="text-[11px] font-medium text-status-info hover:underline disabled:opacity-50"
                >
                  {t("dolr.vault.verify")}
                </button>
              </div>
              <div className="mt-2.5 space-y-2 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("dolr.vault.ledgerStatus")}</span>
                  <span className="inline-flex items-center gap-1 rounded bg-status-ok/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-status-ok">
                    {t("dolr.vault.cryptoIntact")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("dolr.vault.blockHashing")}</span>
                  <span className="font-mono text-[11px] text-foreground">
                    {t("dolr.vault.sha256Chained")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("dolr.vault.tamperProtection")}</span>
                  <span className="text-[11px] font-medium text-status-ok">
                    {t("dolr.vault.zeroDiscrepancies")}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
