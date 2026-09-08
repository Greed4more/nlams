import { History, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { STAGE_LABELS, type RfctlarrStage } from "@/data/mockData";
import { useAuditLogQuery } from "@/hooks/useProposals";
import { useVerifyAuditChainMutation } from "@/hooks/useAudit";
import { cn } from "@/lib/utils";

const ACTION_LABEL: Record<string, string> = {
  STAGE_ADVANCE: "Stage advanced",
  DOCUMENT_UPLOAD: "Document uploaded",
  DOCUMENT_VERIFY: "Document integrity checked",
  COMPENSATION_CALCULATED: "Compensation award finalized",
  GRIEVANCE_SUBMITTED: "Grievance ticket submitted",
  GRIEVANCE_RESOLVED: "Grievance ticket resolved",
  RISK_SCORED: "Litigation risk re-scored",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function AuditTrail({ proposalId }: { proposalId: string }) {
  const { data, isLoading } = useAuditLogQuery(proposalId);
  const verifyChain = useVerifyAuditChainMutation();

  return (
    <section className="panel">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <History className="size-3.5 text-muted-foreground" />
          <div className="label-xs">Audit Trail</div>
        </div>
        <div className="flex items-center gap-2">
          {verifyChain.data && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 text-[10.5px] font-medium",
                verifyChain.data.chainIntact
                  ? "border-status-ok/30 bg-status-ok/10 text-status-ok"
                  : "border-status-critical/30 bg-status-critical/10 text-status-critical",
              )}
            >
              {verifyChain.data.chainIntact ? (
                <ShieldCheck className="size-3" />
              ) : (
                <ShieldAlert className="size-3" />
              )}
              {verifyChain.data.chainIntact
                ? `Chain intact (${verifyChain.data.totalRecords})`
                : "Tamper detected"}
            </span>
          )}
          <button
            type="button"
            disabled={verifyChain.isPending}
            onClick={() => verifyChain.mutate()}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-border px-2 py-1 text-[11px] font-medium text-foreground/80 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            title="Recompute the cryptographic hash chain over the entire audit log"
          >
            {verifyChain.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="size-3.5" />
            )}
            Verify Chain Integrity
          </button>
        </div>
      </div>

      <div className="divide-y divide-border">
        {isLoading && (
          <div className="space-y-2 p-4">
            <div className="shimmer h-4 w-3/4" />
            <div className="shimmer h-4 w-1/2" />
          </div>
        )}
        {!isLoading && (!data || data.length === 0) && (
          <p className="px-4 py-6 text-center text-[12px] text-muted-foreground">
            No recorded actions against this proposal yet.
          </p>
        )}
        {data?.map((entry) => (
          <div key={entry.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-foreground">
                {ACTION_LABEL[entry.action] ?? entry.action}
                {entry.fromStage && entry.toStage && (
                  <span className="text-muted-foreground">
                    {" "}
                    — {STAGE_LABELS[entry.fromStage as RfctlarrStage]} →{" "}
                    {STAGE_LABELS[entry.toStage as RfctlarrStage]}
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {entry.actor ? `${entry.actor.name} · ${entry.actor.role}` : "System"}
              </div>
            </div>
            <div className="num shrink-0 text-[11px] text-muted-foreground">
              {fmt(entry.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
