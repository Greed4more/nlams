import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS, useDerived } from "./derive";

export function CompensationFlow() {
  const { compensationFlow } = useDerived();
  return (
    <section className="panel flex flex-col p-4">
      <header className="mb-3">
        <h2 className="text-[13px] font-semibold text-foreground">Compensation flow</h2>
        <p className="label-xs mt-0.5">Assessed vs disbursed · ₹ crore · last 12 months</p>
      </header>
      <div className="h-[190px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={compensationFlow} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gradAssessed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.info} stopOpacity={0.22} />
                <stop offset="100%" stopColor={CHART_COLORS.info} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradDisbursed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.ok} stopOpacity={0.26} />
                <stop offset="100%" stopColor={CHART_COLORS.ok} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 6,
                border: "1px solid var(--border)",
                fontSize: 11,
                background: "var(--card)",
              }}
              formatter={(v: number, n: string) => [`₹${v.toLocaleString("en-IN")} Cr`, n]}
            />
            <Area
              type="monotone"
              dataKey="assessed"
              name="Assessed"
              stroke={CHART_COLORS.info}
              strokeWidth={1.5}
              fill="url(#gradAssessed)"
            />
            <Area
              type="monotone"
              dataKey="disbursed"
              name="Disbursed"
              stroke={CHART_COLORS.ok}
              strokeWidth={1.5}
              fill="url(#gradDisbursed)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex gap-4 border-t border-border pt-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2" style={{ background: CHART_COLORS.info }} /> Assessed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2" style={{ background: CHART_COLORS.ok }} /> Disbursed
        </span>
      </div>
    </section>
  );
}
