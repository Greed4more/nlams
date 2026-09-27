import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import { useProposalsQuery } from "@/hooks/useProposals";
import { cn } from "@/lib/utils";

/**
 * Live polling indicator for the acquisition register — shows the age of the
 * last successful sync and lets officers force a refresh.
 */
export function LiveSyncBadge() {
  const qc = useQueryClient();
  const { dataUpdatedAt, isFetching, isError } = useProposalsQuery();
  const [, tick] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => tick((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const ageSec = dataUpdatedAt
    ? Math.max(0, Math.round((Date.now() - dataUpdatedAt) / 1000))
    : null;
  const ageLabel =
    ageSec == null ? "awaiting first sync" : ageSec < 3 ? "just now" : `${ageSec}s ago`;
  const offline = isError;

  return (
    <div
      className="flex shrink-0 items-center gap-2 text-[11.5px]"
      title="Proposals auto-refresh from the server every 15 seconds"
    >
      <span className="relative flex size-2">
        <span
          className={cn(
            "absolute inline-flex size-full rounded-full opacity-60",
            offline ? "bg-status-critical" : "animate-ping bg-status-ok",
          )}
        />
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            offline ? "bg-status-critical" : "bg-status-ok",
          )}
        />
      </span>
      <span className={cn("font-semibold", offline ? "text-status-critical" : "text-status-ok")}>
        {offline ? "Offline" : isFetching ? "Syncing" : "Live"}
      </span>
      <span className="text-muted-foreground">
        &middot; Synced <span className="num">{ageLabel}</span>
      </span>
      <span className="hidden text-[10.5px] text-muted-foreground/80 lg:inline">
        &middot; 15s polling
      </span>
      <button
        type="button"
        onClick={() => void qc.invalidateQueries({ queryKey: ["proposals"] })}
        aria-label="Refresh proposals now"
        className="grid size-6 place-items-center rounded-[4px] border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
      >
        <RefreshCcw className={cn("size-3", isFetching && "animate-spin")} />
      </button>
    </div>
  );
}
