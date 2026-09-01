import { useDerived } from "./derive";

export function StateDistribution() {
  const { stateDistribution } = useDerived();
  const max = Math.max(1, ...stateDistribution.map((s) => s.count));
  return (
    <section className="panel flex flex-col">
      <header className="border-b border-border px-4 py-2.5">
        <h2 className="text-[13px] font-semibold text-foreground">State-wise distribution</h2>
      </header>
      <ul className="space-y-2.5 px-4 py-3">
        {stateDistribution.map((s) => (
          <li key={s.state} className="flex items-center gap-3">
            <span className="w-[86px] shrink-0 truncate text-[12px] text-foreground">{s.state}</span>
            <span className="h-[6px] flex-1 bg-muted">
              <span
                className="block h-full"
                style={{ width: `${(s.count / max) * 100}%`, background: "var(--navy)" }}
              />
            </span>
            <span className="num w-6 shrink-0 text-right text-[12px] font-semibold text-foreground">
              {s.count}
            </span>
            <span className="num w-[74px] shrink-0 text-right text-[11px] text-muted-foreground">
              {s.areaHa.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Ha
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
