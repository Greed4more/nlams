import { Link } from "@tanstack/react-router";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { STAGE_LABELS } from "@/data/mockData";
import { useDerived } from "./derive";

export function DelayQueue() {
  const { breachedQueue } = useDerived();

  return (
    <section className="panel flex flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="text-[13px] font-semibold text-foreground">Critical delay queue</h2>
        <span className="num rounded-[4px] bg-status-critical/10 px-1.5 py-0.5 text-[11px] font-semibold text-status-critical">
          {breachedQueue.length}
        </span>
      </header>

      {breachedQueue.length === 0 ? (
        <div className="grid flex-1 place-items-center px-4 py-8 text-center">
          <div>
            <ShieldCheck className="mx-auto size-5 text-status-ok" />
            <p className="mt-2 text-[12px] text-muted-foreground">
              No statutory breaches in the current scope.
            </p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {breachedQueue.map(({ proposal, sla }) => {
            const overdue = sla.daysElapsed - (sla.limitDays ?? 0);
            return (
              <li key={proposal.id}>
                <Link
                  to="/proposals/$id"
                  params={{ id: proposal.id }}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="num text-[11px] font-semibold text-status-info">
                        {proposal.id}
                      </span>
                      <span className="label-xs truncate">
                        {STAGE_LABELS[proposal.currentStage]}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-foreground">
                      {proposal.projectName}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="num text-[13px] font-semibold text-status-critical">
                      +{overdue}d
                    </div>
                    <div className="label-xs">{sla.statuteRef}</div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
