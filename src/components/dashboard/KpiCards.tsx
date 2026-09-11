import { Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { formatCrore } from "@/data/mockData";
import { useSpotlight } from "@/context/DemoContext";
import { cn } from "@/lib/utils";
import { useDerived } from "./derive";

function Card({
  label,
  value,
  delta,
  accent,
  children,
}: {
  label: string;
  value: string;
  delta: string;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="panel relative overflow-hidden px-4 py-3">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: accent }}
      />
      <div className="label-xs">{label}</div>
      <div className="num mt-2 text-[28px] font-semibold leading-none text-foreground">{value}</div>
      <div className="mt-1.5 text-[11px] text-muted-foreground">{delta}</div>
      {children}
    </div>
  );
}

export function KpiCards() {
  const { totals, disbursalPct } = useDerived();
  const spotlight = useSpotlight("kpi-breaches");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card
        label="Active proposals"
        value={totals.count.toLocaleString("en-IN")}
        delta={`+${totals.newThisQuarter} this quarter`}
        accent="var(--status-info)"
      />
      <Card
        label="Land under acquisition"
        value={`${totals.areaHa.toLocaleString("en-IN", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} Ha`}
        delta={`across ${totals.states} state${totals.states === 1 ? "" : "s"}`}
        accent="var(--navy)"
      />
      <Card
        label="Compensation disbursed"
        value={formatCrore(totals.disbursed)}
        delta={`${disbursalPct}% of ${formatCrore(totals.assessed)} assessed`}
        accent="var(--status-ok)"
      >
        <div className="mt-2 h-[3px] w-full bg-muted">
          <div
            className="h-full"
            style={{ width: `${disbursalPct}%`, background: "var(--status-ok)" }}
          />
        </div>
      </Card>

      <Link
        to="/proposals"
        search={{ filter: "breached" }}
        className={cn(
          "panel bhumitra-pulse relative block overflow-hidden px-4 py-3 transition-colors hover:bg-accent/40",
          spotlight,
        )}
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: "var(--status-critical)" }}
        />
        <div className="flex items-center justify-between">
          <div className="label-xs flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-status-critical" />
            Statutory delay alerts
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="num mt-2 text-[28px] font-semibold leading-none text-status-critical">
          {totals.breached}
        </div>
        <div className="mt-1.5 text-[11px] text-status-critical">Sec. 24 lapse risk</div>
      </Link>
    </div>
  );
}
