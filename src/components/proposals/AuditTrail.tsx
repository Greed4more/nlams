import { History } from "lucide-react";
import { STAGE_LABELS, type RfctlarrStage } from "@/data/mockData";
import { useAuditLogQuery } from "@/hooks/useProposals";

const ACTION_LABEL: Record<string, string> = {
  STAGE_ADVANCE: "Stage advanced",
  DOCUMENT_UPLOAD: "Document uploaded",
  DOCUMENT_VERIFY: "Document integrity checked",
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

  return (
    <section className="panel">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
        <History className="size-3.5 text-muted-foreground" />
        <div className="label-xs">Audit Trail</div>
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
