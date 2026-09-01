import { Check, AlertTriangle } from "lucide-react";
import { STAGE_ORDER, type Proposal } from "@/data/mockData";
import { getSlaStatus, SLA_RULES } from "@/lib/slaRules";
import { SHORT_STAGE } from "./bits";
import { cn } from "@/lib/utils";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export function WorkflowStepper({ proposal }: { proposal: Proposal }) {
  const sla = getSlaStatus(proposal);
  const currentIdx = STAGE_ORDER.indexOf(proposal.currentStage);
  const initiated = new Date(proposal.initiatedAt).getTime();
  const entered = new Date(proposal.stageEnteredAt).getTime();
  const rule = SLA_RULES[proposal.currentStage];

  return (
    <section className="panel">
      <div className="border-b border-border px-4 py-2.5">
        <div className="label-xs">RFCTLARR Workflow</div>
      </div>

      <div className="flex items-start gap-0 overflow-x-auto px-4 py-5">
        {STAGE_ORDER.map((stage, i) => {
          const done = i < currentIdx;
          const current = i === currentIdx;
          // interpolate a plausible completion date for finished steps
          const completedAt =
            done && currentIdx > 0
              ? new Date(initiated + ((entered - initiated) * (i + 1)) / (currentIdx + 1))
              : null;

          return (
            <div key={stage} className="flex min-w-[132px] flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <span
                  className={cn("h-[2px] flex-1", i === 0 ? "bg-transparent" : done || current ? "bg-navy" : "bg-border")}
                />
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-semibold",
                    done && "border-navy bg-navy text-navy-foreground",
                    current &&
                      cn(
                        "border-2 bg-card nlams-pulse",
                        sla.status === "BREACHED"
                          ? "border-status-critical text-status-critical ring-4 ring-status-critical/15"
                          : "border-status-info text-status-info ring-4 ring-status-info/15",
                      ),
                    !done && !current && "border-border bg-card text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={cn(
                    "h-[2px] flex-1",
                    i === STAGE_ORDER.length - 1 ? "bg-transparent" : done ? "bg-navy" : "bg-border",
                  )}
                />
              </div>

              <div
                className={cn(
                  "mt-2 px-1 text-center text-[11.5px] font-semibold leading-tight",
                  current ? "text-foreground" : done ? "text-foreground/80" : "text-muted-foreground",
                )}
              >
                {SHORT_STAGE[stage]}
              </div>
              <div className="num mt-1 px-1 text-center text-[10.5px] leading-tight text-muted-foreground">
                {current ? (
                  rule ? (
                    <span className={sla.status === "BREACHED" ? "font-semibold text-status-critical" : ""}>
                      {sla.daysElapsed} / {rule.limitDays} days
                      <br />
                      {rule.statuteRef}
                    </span>
                  ) : (
                    <>In progress</>
                  )
                ) : completedAt ? (
                  fmt(completedAt.toISOString())
                ) : (
                  "—"
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sla.status === "BREACHED" && (
        <div className="flex items-start gap-2 border-t border-status-critical/25 bg-status-critical/[0.07] px-4 py-2.5">
          <AlertTriangle className="mt-[1px] size-4 shrink-0 text-status-critical" />
          <p className="text-[12px] leading-snug text-status-critical">
            <span className="font-bold tracking-wide">STATUTORY DEADLINE EXCEEDED</span> —{" "}
            {sla.consequence} Liable to lapse under {sla.statuteRef}. Escalated to District
            Collector.
          </p>
        </div>
      )}
    </section>
  );
}
