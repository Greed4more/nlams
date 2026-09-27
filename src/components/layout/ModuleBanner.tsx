import { ShieldCheck, Eye } from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { cn } from "@/lib/utils";

/**
 * Subtle clearance banner indicating what the signed-in officer may do in the
 * current module — statutory actions versus read-only monitoring.
 */
export function ModuleBanner() {
  const { roleLabel, canAct, activeState, scopeLabel } = useRole();
  const scope = activeState ?? scopeLabel;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[6px] border border-border bg-card px-3 py-2">
      <span className="rounded-[3px] border border-ink/25 bg-ink/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink">
        Officer Verification Module
      </span>
      <span className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        {canAct ? (
          <ShieldCheck className="size-3.5 shrink-0 text-status-ok" />
        ) : (
          <Eye className="size-3.5 shrink-0 text-status-warn" />
        )}
        <span className={cn("font-medium", canAct ? "text-status-ok" : "text-status-warn")}>
          {canAct
            ? "Statutory action clearance — workflow advance and verification actions enabled"
            : "Read-only acquisition access — statutory actions are restricted to the Land Acquisition Officer"}
        </span>
      </span>
      <span className="ml-auto text-[11px] text-muted-foreground">
        {roleLabel}
        {scope ? ` · ${scope}` : ""}
      </span>
    </div>
  );
}
