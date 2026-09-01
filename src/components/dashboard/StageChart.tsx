import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, useDerived, type StageRow } from "./derive";

const SERIES = [
  { key: "OK", label: "Within statutory limit", color: CHART_COLORS.ok },
  { key: "AT_RISK", label: "Approaching breach (<60 days)", color: CHART_COLORS.warn },
  { key: "BREACHED", label: "Statutory breach", color: CHART_COLORS.critical },
] as const;

function StageTooltip({ active, payload }: { active?: boolean; payload?: { payload: StageRow }[] }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]!.payload;
  return (
    <div className="rounded-[6px] border border-border bg-card px-3 py-2 shadow-md">
      <div className="text-[12px] font-semibold text-foreground">{row.label}</div>
      <div className="label-xs mt-0.5">{row.statuteRef}</div>
      <div className="mt-2 space-y-1">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-[11px]">
            <span className="h-2 w-2" style={{ background: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="num ml-auto font-semibold text-foreground">{row[s.key]}</span>
          </div>
        ))}
        <div className="num flex justify-between border-t border-border pt-1 text-[11px] font-semibold">
          <span>Total</span>
          <span>{row.total}</span>
        </div>
      </div>
    </div>
  );
}

export function StageChart() {
  const { stageBreakdown } = useDerived();
  return (
    <section className="panel flex h-full flex-col p-4">
      <header className="mb-3">
        <h2 className="text-[13px] font-semibold text-foreground">Proposals by RFCTLARR stage</h2>
        <p className="label-xs mt-0.5">Stacked by statutory SLA status</p>
      </header>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stageBreakdown} margin={{ top: 4, right: 8, bottom: 4, left: -18 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="short"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              interval={0}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip cursor={{ fill: "var(--accent)" }} content={<StageTooltip />} />
            {SERIES.map((s) => (
              <Bar key={s.key} dataKey={s.key} stackId="sla" fill={s.color} maxBarSize={44} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border pt-3">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </section>
  );
}
