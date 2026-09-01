import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useDerived } from "./derive";

export function RRProgress() {
  const { rrProgress } = useDerived();
  return (
    <section className="panel flex flex-col p-4">
      <header className="mb-3">
        <h2 className="text-[13px] font-semibold text-foreground">R&amp;R progress</h2>
        <p className="label-xs mt-0.5">Affected families · rehabilitation &amp; resettlement</p>
      </header>
      <div className="relative h-[190px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rrProgress.data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={1}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {rrProgress.data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 6,
                border: "1px solid var(--border)",
                fontSize: 11,
                background: "var(--card)",
              }}
              formatter={(v: number, n: string) => [`${v.toLocaleString("en-IN")} families`, n]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="num text-[22px] font-semibold leading-none text-foreground">
            {rrProgress.total.toLocaleString("en-IN")}
          </div>
          <div className="label-xs mt-1">Families</div>
        </div>
      </div>
      <ul className="mt-2 space-y-1 border-t border-border pt-2">
        {rrProgress.data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-[11px]">
            <span className="h-2 w-2" style={{ background: d.color }} />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="num ml-auto font-semibold text-foreground">
              {d.value.toLocaleString("en-IN")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
