import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinancialStatus } from "@/data/mockData";

export function FinancialStatusBadge({
  status,
  size = "sm",
}: {
  status: FinancialStatus;
  size?: "sm" | "lg";
}) {
  const approved = status === "APPROVED";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-[4px] border font-semibold",
        approved
          ? "border-status-ok/30 bg-status-ok/10 text-status-ok"
          : "border-status-warn/30 bg-status-warn/10 text-status-warn",
        size === "lg" ? "px-2.5 py-1 text-[12px]" : "px-1.5 py-0.5 text-[10.5px]",
      )}
    >
      {approved ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
      {approved ? "Approved" : "Pending"}
    </span>
  );
}

export function LaoApprovedBadge() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-[4px] border border-status-ok/30 bg-status-ok/10 px-2.5 py-1 text-[12px] font-semibold text-status-ok">
      <CheckCircle2 className="size-3.5" />
      Approved
    </span>
  );
}

/** Shared project metadata row used by the finance cards and workspace. */
export function MetaRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "strong";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          "num text-right text-[12.5px]",
          tone === "strong" ? "font-semibold text-foreground" : "font-medium text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
