import { Link } from "@tanstack/react-router";
import {
  Building2,
  TrendingUp,
  AlertOctagon,
  Scale,
  Wheat,
  Database,
  ArrowRight,
  Server,
  Layers,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { formatCrore, formatINRFull } from "@/data/mockData";
import { useDerived } from "../derive";
import { useRole } from "@/context/RoleContext";
import { StageChart } from "../StageChart";
import { DelayQueue } from "../DelayQueue";
import { cn } from "@/lib/utils";

export function StateRevenueDashboard() {
  const { person, scopedProposals } = useRole();
  const { totals, disbursalPct, enriched } = useDerived();

  // Aggregate by district within Maharashtra
  const districtStats = Array.from(new Set(scopedProposals.map((p) => p.district))).map((district) => {
    const inDist = scopedProposals.filter((p) => p.district === district);
    const enrichedInDist = enriched.filter((e) => e.proposal.district === district);
    const count = inDist.length;
    const area = inDist.reduce((s, p) => s + p.totalAreaHa, 0);
    const assessed = inDist.reduce((s, p) => s + p.compensation.assessed, 0);
    const disbursed = inDist.reduce((s, p) => s + p.compensation.disbursed, 0);
    const breached = enrichedInDist.filter((e) => e.sla.status === "BREACHED").length;
    const atRisk = enrichedInDist.filter((e) => e.sla.status === "AT_RISK").length;
    const complianceRate = count > 0 ? Math.round(((count - breached) / count) * 100) : 100;
    return { district, count, area, assessed, disbursed, breached, atRisk, complianceRate };
  }).sort((a, b) => b.count - a.count);

  // Aggregate by requiring body in Maharashtra
  const requiringBodyStats = Array.from(new Set(scopedProposals.map((p) => p.requiringBody))).map((body) => {
    const inBody = scopedProposals.filter((p) => p.requiringBody === body);
    const count = inBody.length;
    const assessed = inBody.reduce((s, p) => s + p.compensation.assessed, 0);
    const disbursed = inBody.reduce((s, p) => s + p.compensation.disbursed, 0);
    return { body, count, assessed, disbursed };
  }).sort((a, b) => b.assessed - a.assessed);

  // Section 10 agricultural multi-crop analysis
  const multiCropParcels = scopedProposals.flatMap((p) =>
    p.parcels.filter((par) => par.restrictionFlags.includes("MULTI_CROP_IRRIGATED"))
  );
  const multiCropAreaHa = multiCropParcels.reduce((s, p) => s + p.areaHa, 0);
  const multiCropCapHa = 1500; // Statutory illustrative cap for district/state
  const multiCropPct = Math.min(100, Math.round((multiCropAreaHa / multiCropCapHa) * 100));

  return (
    <div className="space-y-4">
      {/* State Coordination Banner */}
      <div className="rounded-[6px] border border-navy/20 bg-gradient-to-r from-navy via-[#16385d] to-[#1e4875] p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-sky-400/20 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-sky-200">
                STATE COORDINATION DESK
              </span>
              <span className="text-[12px] text-white/80">Revenue &amp; Forest Department · Mantralaya, Maharashtra</span>
            </div>
            <h2 className="mt-1.5 text-[20px] font-semibold tracking-tight">
              Statewide Inter-District Land Acquisition &amp; Budget Allocation Monitor
            </h2>
            <p className="mt-0.5 text-[12.5px] text-white/80">
              Coordinated by {person}. Oversight of inter-district performance, requiring body capital demands, Section 10 agricultural ceiling compliance, and state land bank.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/proposals"
              className="inline-flex items-center gap-1.5 rounded-[4px] bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/20"
            >
              <Building2 className="size-3.5" />
              State Project Registry
            </Link>
          </div>
        </div>
      </div>

      {/* State Coordination KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-navy" />
          <div className="label-xs">Active Projects in State</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-foreground">
            {totals.count}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            {totals.areaHa.toFixed(1)} Ha across {districtStats.length} active revenue districts
          </div>
        </div>

        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-status-ok" />
          <div className="label-xs">State PFMS Disbursal Outlay</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-foreground">
            {formatCrore(totals.disbursed)}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            {disbursalPct}% disbursed of {formatCrore(totals.assessed)} assessed
          </div>
          <div className="mt-2 h-[3px] w-full bg-muted">
            <div className="h-full bg-status-ok" style={{ width: `${disbursalPct}%` }} />
          </div>
        </div>

        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-status-warn" />
          <div className="label-xs">Inter-District SLA Breaches</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-status-critical">
            {totals.breached}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            +{totals.atRisk} approaching statutory lapse (&lt;60d)
          </div>
        </div>

        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-status-info" />
          <div className="label-xs">Sec 10 Irrigated Multi-Crop Quota</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-foreground">
            {multiCropAreaHa.toFixed(1)} Ha
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            {multiCropPct}% of state cumulative ceiling ({multiCropCapHa} Ha)
          </div>
          <div className="mt-2 h-[3px] w-full bg-muted">
            <div className="h-full bg-status-info" style={{ width: `${multiCropPct}%` }} />
          </div>
        </div>
      </div>

      {/* Main Grid: Inter-District Comparison & Requiring Body breakdown */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {/* Left Column: Inter-District Performance Table & Requiring Bodies */}
        <div className="space-y-3 lg:col-span-3">
          {/* Inter-District Comparison Table */}
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground" />
                <div className="label-xs">Maharashtra Inter-District RFCTLARR Performance</div>
              </div>
              <span className="num text-[11px] text-muted-foreground">
                {districtStats.length} reporting districts
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">District</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">Cases</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">Area (Ha)</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">Disbursed / Assessed</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-center">Lapses</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {districtStats.map((row) => (
                    <tr key={row.district} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium text-foreground">{row.district}</td>
                      <td className="num px-3 py-2 text-right">{row.count}</td>
                      <td className="num px-3 py-2 text-right">{row.area.toFixed(1)}</td>
                      <td className="num px-3 py-2 text-right text-[11.5px]">
                        <span className="font-semibold text-status-ok">{formatCrore(row.disbursed, 1)}</span>
                        <span className="text-muted-foreground"> / {formatCrore(row.assessed, 1)}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.breached > 0 ? (
                          <span className="num inline-flex rounded bg-status-critical/10 px-1.5 py-0.5 text-[11px] font-bold text-status-critical">
                            {row.breached} breached
                          </span>
                        ) : (
                          <span className="num inline-flex rounded bg-status-ok/10 px-1.5 py-0.5 text-[11px] font-medium text-status-ok">
                            0 on track
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
                  {districtStats.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground text-[12px]">
                        No active acquisition records found for this state.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Requiring Body Demand in Maharashtra */}
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <Building2 className="size-3.5 text-muted-foreground" />
                <div className="label-xs">State &amp; Central Requiring Bodies in Maharashtra</div>
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
                        <span className="num text-[11px] text-muted-foreground">{pct}% of state budget</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="num font-semibold text-foreground">{formatCrore(item.assessed)}</div>
                      <div className="num text-[11px] text-muted-foreground">{item.count} projects</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* State Land Records Integration (Mahabhulekh Satbara 7/12) */}
          <section className="panel p-3.5">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="label-xs flex items-center gap-1.5">
                <Server className="size-3.5 text-navy" />
                Mahabhulekh (Satbara 7/12) Digital Integration
              </div>
              <span className="inline-flex items-center gap-1 rounded bg-status-ok/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-status-ok">
                Live Sync Active
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3 text-[12px]">
              <div className="rounded border border-border bg-muted/20 p-2">
                <div className="text-[11px] text-muted-foreground">Vernacular ROR Record</div>
                <div className="mt-1 font-semibold text-foreground">Sat-Bara (सातबारा)</div>
              </div>
              <div className="rounded border border-border bg-muted/20 p-2">
                <div className="text-[11px] text-muted-foreground">Survey Sub-division</div>
                <div className="mt-1 font-semibold text-foreground">Gat / Khasra (गट / खसरा)</div>
              </div>
              <div className="rounded border border-border bg-muted/20 p-2">
                <div className="text-[11px] text-muted-foreground">Digital Mutation Status</div>
                <div className="mt-1 font-semibold text-status-ok">e-Ferfar Integrated</div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Stage Pipeline & Section 10 Land Protection */}
        <div className="space-y-3 lg:col-span-2">
          {/* State Stage Pipeline */}
          <StageChart />

          {/* State Delay Queue */}
          <DelayQueue />

          {/* Section 10 Agricultural Land Protection & Land Bank */}
          <section className="panel p-3.5">
            <div className="border-b border-border pb-2">
              <div className="label-xs flex items-center gap-1.5">
                <Wheat className="size-3.5 text-amber-600" />
                Section 10 Multi-Crop Agricultural Ceiling
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Statutory restriction on acquiring multi-cropped irrigated land
              </div>
            </div>

            <div className="mt-3 space-y-3 text-[12px]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cumulative Multi-Crop Area:</span>
                  <span className="font-semibold text-foreground">{multiCropAreaHa.toFixed(1)} Ha</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground">Statutory State Ceiling:</span>
                  <span className="font-medium text-foreground">{multiCropCapHa} Ha</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded transition-all",
                      multiCropPct > 80 ? "bg-status-critical" : multiCropPct > 50 ? "bg-status-warn" : "bg-status-ok"
                    )}
                    style={{ width: `${multiCropPct}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-[10.5px] text-muted-foreground">
                  {multiCropPct}% utilized
                </div>
              </div>

              <div className="rounded bg-muted/40 p-2.5 text-[11.5px] text-muted-foreground">
                <strong className="text-foreground">Section 10 Mandate:</strong> Irrigated multi-cropped land shall not be acquired except under exceptional circumstances, and equal area of culturable wasteland must be developed for agricultural purposes or deposited in the State Land Bank.
              </div>

              {/* State Land Bank under Sec 101 */}
              <div className="border-t border-border pt-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Database className="size-3.5 text-navy" />
                    <span className="font-medium text-foreground">State Land Bank (Sec 101)</span>
                  </div>
                  <span className="num font-semibold text-navy">248.6 Ha</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Unutilized acquired land held in State Reserve for social infrastructure.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
