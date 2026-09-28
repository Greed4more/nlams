import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { formatCrore } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useDerived } from "./derive";
import { KpiCards } from "./KpiCards";
import { StageChart } from "./StageChart";
import { DelayQueue } from "./DelayQueue";
import { CompensationFlow } from "./CompensationFlow";
import { RRProgress } from "./RRProgress";
import { ActivityFeed } from "./ActivityFeed";

interface DistrictRow {
  district: string;
  count: number;
  areaHa: number;
  assessed: number;
  disbursed: number;
  families: number;
  breached: number;
}

/**
 * State-wise dashboard shown alongside the national role dashboard. Every
 * role carries a nationwide roll, so the state view is a drill-down rather
 * than a credential restriction: the selected state drives `activeState`,
 * which scopes every widget below to that state.
 */
export function StateWiseDashboard({ state }: { state: string }) {
  const { scopedProposals } = useRole();
  const { totals, disbursalPct } = useDerived();

  const districts = useMemo<DistrictRow[]>(() => {
    const map = new Map<string, DistrictRow>();
    for (const p of scopedProposals) {
      const row =
        map.get(p.district) ??
        ({
          district: p.district,
          count: 0,
          areaHa: 0,
          assessed: 0,
          disbursed: 0,
          families: 0,
          breached: 0,
        } satisfies DistrictRow);
      row.count += 1;
      row.areaHa += p.totalAreaHa;
      row.assessed += p.compensation.assessed;
      row.disbursed += p.compensation.disbursed;
      row.families += p.affectedFamilies;
      map.set(p.district, row);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [scopedProposals]);

  return (
    <div className="space-y-3">
      {/* State summary strip */}
      <section className="panel flex flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[5px] bg-ink text-ink-foreground">
            <MapPin className="size-5" />
          </span>
          <div>
            <div className="label-xs">State-wise Dashboard</div>
            <h2 className="text-[18px] font-semibold leading-tight text-ink">{state}</h2>
            <div className="text-[11.5px] text-muted-foreground">
              {districts.length} reporting districts · {totals.count} active proposals ·{" "}
              {totals.areaHa.toFixed(1)} Ha
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-right">
          <div>
            <div className="text-[10.5px] text-muted-foreground">Assessed</div>
            <div className="num text-[15px] font-semibold text-foreground">
              {formatCrore(totals.assessed)}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] text-muted-foreground">Disbursed</div>
            <div className="num text-[15px] font-semibold text-status-ok">
              {formatCrore(totals.disbursed)}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] text-muted-foreground">Disbursal</div>
            <div className="num text-[15px] font-semibold text-foreground">{disbursalPct}%</div>
          </div>
        </div>
      </section>

      <KpiCards />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5 lg:items-start">
        <div className="lg:col-span-3">
          <StageChart />
        </div>
        <div className="flex flex-col gap-3 lg:col-span-2">
          <DelayQueue />

          {/* District breakdown — the signature widget of the state view */}
          <section className="panel overflow-hidden">
            <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <h2 className="text-[13px] font-semibold text-foreground">District breakdown</h2>
              <span className="num text-[11px] text-muted-foreground">
                {districts.length} districts
              </span>
            </header>
            <div className="max-h-[300px] overflow-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead className="sticky top-0 bg-muted/60">
                  <tr>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">
                      District
                    </th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">Cases</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">
                      Area (Ha)
                    </th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">
                      Disbursal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {districts.map((row) => {
                    const pct =
                      row.assessed > 0
                        ? Math.min(100, Math.round((row.disbursed / row.assessed) * 100))
                        : 0;
                    return (
                      <tr key={row.district} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 font-medium text-foreground">{row.district}</td>
                        <td className="num px-3 py-2 text-right">{row.count}</td>
                        <td className="num px-3 py-2 text-right">{row.areaHa.toFixed(1)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-14 overflow-hidden rounded bg-muted">
                              <div
                                className={cn(
                                  "h-full rounded",
                                  pct >= 75
                                    ? "bg-status-ok"
                                    : pct >= 40
                                      ? "bg-status-warn"
                                      : "bg-status-critical",
                                )}
                                style={{ width: `${Math.max(2, pct)}%` }}
                              />
                            </div>
                            <span className="num w-8 text-right text-[11px] text-muted-foreground">
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {districts.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-[12px] text-muted-foreground"
                      >
                        No acquisition records filed in this state yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <CompensationFlow />
        <RRProgress />
        <ActivityFeed />
      </div>
    </div>
  );
}
