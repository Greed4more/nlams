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
import { cn } from "@/lib/utils";

export function DistrictCollectorDashboard() {
  const { person, canAct, scopedProposals } = useRole();
  const { totals, disbursalPct, enriched, stageBreakdown } = useDerived();
  const { data: grievances = [] } = useGrievancesQuery();

  // Filter grievances in scope
  const districtProposalIds = new Set(scopedProposals.map((p) => p.id));
  const districtGrievances = grievances.filter(
    (g) => districtProposalIds.has(g.proposalId) || g.proposal?.district === "South Goa"
  );

  // Statutory lapse items (sorted by urgency: breached first, then shortest remaining time)
  const statutoryLapseItems = enriched
    .filter((e) => e.sla.limitDays !== null)
    .sort((a, b) => a.sla.daysRemaining - b.sla.daysRemaining);

  const urgentCount = statutoryLapseItems.filter(
    (item) => item.sla.status === "BREACHED" || item.sla.status === "AT_RISK"
  ).length;

  return (
    <div className="space-y-4">
      {/* Collector Command Banner */}
      <div className="rounded-[6px] border border-navy/20 bg-gradient-to-r from-navy via-[#163a5f] to-[#1c4b7a] p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-400/20 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-amber-300">
                DISTRICT GOVERNANCE DESK
              </span>
              <span className="text-[12px] text-white/80">South Goa District · State of Goa</span>
            </div>
            <h2 className="mt-1.5 text-[20px] font-semibold tracking-tight">
              Statutory SLA Enforcement &amp; District R&amp;R Delivery Command
            </h2>
            <p className="mt-0.5 text-[12.5px] text-white/80">
              Presided by {person} (Collector &amp; DM). Statutory oversight of Sections 4(2), 14, 19(7) &amp; 25 lapse countdowns, rehabilitation awards, and public consultation consent.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/proposals"
              className="inline-flex items-center gap-1.5 rounded-[4px] bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/20"
            >
              <FileCheck2 className="size-3.5" />
              District Case Register
            </Link>
          </div>
        </div>
      </div>

      {/* District Governance KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-navy" />
          <div className="label-xs">Active District Proposals</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-foreground">
            {totals.count}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            {totals.areaHa.toFixed(2)} Ha under acquisition in South Goa
          </div>
        </div>

        <div className="panel relative overflow-hidden px-4 py-3">
          <span className={cn("absolute inset-y-0 left-0 w-[3px]", urgentCount > 0 ? "bg-status-critical" : "bg-status-ok")} />
          <div className="label-xs">Statutory Legal Lapse Clocks</div>
          <div className="num mt-2 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold leading-none text-status-critical">
              {totals.breached}
            </span>
            <span className="text-[14px] text-muted-foreground">
              breached · {totals.atRisk} &lt;60d
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            Risk of statutory lapse under Sec 4, 14, 19(7), 25
          </div>
        </div>

        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-status-ok" />
          <div className="label-xs">R&amp;R Family Rehabilitation &amp; DBT</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-foreground">
            {totals.families.toLocaleString("en-IN")}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            {disbursalPct}% compensated ({formatCrore(totals.disbursed, 1)} of {formatCrore(totals.assessed, 1)})
          </div>
          <div className="mt-2 h-[3px] w-full bg-muted">
            <div className="h-full bg-status-ok" style={{ width: `${disbursalPct}%` }} />
          </div>
        </div>

        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-status-warn" />
          <div className="label-xs">15-Day SLA Grievance Objections</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-foreground">
            {districtGrievances.length > 0 ? districtGrievances.length : 3}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            Section 15 land-title disputes &amp; boundary objections
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
                <div className="label-xs">RFCTLARR Statutory Lapse Countdown Queue</div>
              </div>
              <span className="num text-[11px] text-muted-foreground">
                Mandatory Clocks under Act 30 of 2013
              </span>
            </div>
            <div className="divide-y divide-border">
              {statutoryLapseItems.length === 0 ? (
                <div className="p-4 text-center text-[12.5px] text-muted-foreground">
                  No active statutory clocks in this district.
                </div>
              ) : (
                statutoryLapseItems.map((item) => {
                  const { proposal, sla } = item;
                  const isBreached = sla.status === "BREACHED";
                  const isAtRisk = sla.status === "AT_RISK";
                  const pct = Math.min(100, Math.round((sla.daysElapsed / (sla.limitDays ?? 365)) * 100));

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
                            <Link to="/proposals" className="hover:text-status-info hover:underline">
                              {proposal.projectName}
                            </Link>
                          </h4>
                          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                            {sla.description} · Stage: <span className="font-medium text-foreground">{proposal.currentStage}</span>
                          </p>
                        </div>

                        {/* Status badge */}
                        <div className="text-right shrink-0">
                          {isBreached ? (
                            <span className="inline-flex items-center gap-1 rounded bg-status-critical/15 px-2 py-0.5 text-[11px] font-bold text-status-critical">
                              <AlertOctagon className="size-3" />
                              LAPSED by {Math.abs(sla.daysRemaining)}d
                            </span>
                          ) : isAtRisk ? (
                            <span className="inline-flex items-center gap-1 rounded bg-status-warn/20 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                              <Clock className="size-3" />
                              {sla.daysRemaining}d remaining
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-status-ok/10 px-2 py-0.5 text-[11px] font-medium text-status-ok">
                              <CheckCircle2 className="size-3" />
                              {sla.daysRemaining}d remaining
                            </span>
                          )}
                          <div className="num mt-1 text-[11px] text-muted-foreground">
                            {sla.daysElapsed}d / {sla.limitDays}d elapsed
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar & Consequence Alert */}
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Elapsed statutory time:</span>
                          <span className={cn("num font-medium", isBreached ? "text-status-critical" : "text-foreground")}>
                            {pct}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded transition-all",
                              isBreached ? "bg-status-critical" : isAtRisk ? "bg-status-warn" : "bg-status-ok"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2 rounded bg-muted/40 px-2.5 py-1.5 text-[11.5px]">
                        <span className="text-muted-foreground">
                          <strong className="text-foreground">Consequence:</strong> {sla.consequence}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="shrink-0 text-[11px] font-medium text-muted-foreground cursor-not-allowed">
                              Advance Stage (LAO only)
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
                <div className="label-xs">Section 15 Citizen Objections &amp; Title Grievances</div>
              </div>
              <Link to="/grievances" className="text-[11px] font-medium text-status-info hover:underline">
                View All Grievances →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">Ticket</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">Issue Category</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">Status</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">SLA Clock</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-center">Executive Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {districtGrievances.slice(0, 4).map((g) => (
                    <tr key={g.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-[11.5px] font-semibold text-navy">
                        {g.id}
                      </td>
                      <td className="px-3 py-2 text-foreground font-medium">
                        {g.issueCategory}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10.5px] font-medium text-foreground">
                          {g.status}
                        </span>
                      </td>
                      <td className="num px-3 py-2 text-right text-[11px] text-muted-foreground">
                        {new Date(g.slaDeadline).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block cursor-not-allowed rounded bg-muted/70 px-2 py-0.5 text-[10.5px] text-muted-foreground">
                              Resolve Ticket
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{NO_CREDENTIALS_HINT}</TooltipContent>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                  {districtGrievances.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground text-[12px]">
                        No open title dispute tickets pending in South Goa.
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
                South Goa Statutory Progression Funnel
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Distribution across RFCTLARR 2013 statutory milestones
              </div>
            </div>

            <div className="mt-3 space-y-2.5">
              {stageBreakdown.map((row) => (
                <div key={row.stage} className="text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{row.label}</span>
                    <span className="num font-semibold text-foreground">{row.total} cases</span>
                  </div>
                  <div className="mt-1 flex h-2 w-full overflow-hidden rounded bg-muted">
                    {row.OK > 0 && (
                      <div className="bg-status-ok" style={{ width: `${(row.OK / (row.total || 1)) * 100}%` }} />
                    )}
                    {row.AT_RISK > 0 && (
                      <div className="bg-status-warn" style={{ width: `${(row.AT_RISK / (row.total || 1)) * 100}%` }} />
                    )}
                    {row.BREACHED > 0 && (
                      <div className="bg-status-critical" style={{ width: `${(row.BREACHED / (row.total || 1)) * 100}%` }} />
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-[10.5px] text-muted-foreground">
                    <span>{row.statuteRef}</span>
                    <span>{row.BREACHED > 0 ? `${row.BREACHED} breached` : "On schedule"}</span>
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
                Litigation Risk &amp; Consent Assessment
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Monitoring high-litigation exposure projects under Section 2(2) &amp; Section 10
              </div>
            </div>

            <div className="mt-3 divide-y divide-border">
              {scopedProposals.slice(0, 3).map((p) => {
                const multiCropFlag = p.parcels.some((par) => par.restrictionFlags.includes("MULTI_CROP_IRRIGATED"));
                const unverifiedFlag = p.parcels.some((par) => par.provenance === "LEGACY_MIGRATED");
                const riskLevel = multiCropFlag || unverifiedFlag ? "MEDIUM" : "LOW";

                return (
                  <div key={p.id} className="py-2 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground truncate max-w-[180px]">{p.projectName}</span>
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold",
                        riskLevel === "MEDIUM" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      )}>
                        {riskLevel} RISK
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {p.affectedFamilies} families · {p.parcels.length} parcels ({p.totalAreaHa} Ha)
                    </div>
                    {multiCropFlag && (
                      <div className="mt-1 text-[10.5px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5">
                        ⚠ Section 10 multi-crop irrigated land detected
                      </div>
                    )}
                    {unverifiedFlag && (
                      <div className="mt-1 text-[10.5px] text-status-warn bg-status-warn/10 rounded px-1.5 py-0.5">
                        ⚠ Legacy boundary records require ground-truthing
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Collector Statutory Powers Notice */}
          <div className="rounded-[6px] border border-border bg-muted/30 p-3 text-[11.5px] text-muted-foreground">
            <strong className="text-foreground">Collector Statutory Function:</strong> Under Section 23 of RFCTLARR 2013, the Collector presides over administrative enquiry and sanctions rehabilitation schemes. Casework determination and record modification are delegated to the Land Acquisition Officer.
          </div>
        </div>
      </div>
    </div>
  );
}
