import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeIndianRupee,
  CheckCircle2,
  Clock,
  FolderSearch,
  Landmark,
} from "lucide-react";
import { useApprovedProjectsQuery } from "@/hooks/useFinance";
import { FinancialStatusBadge } from "@/components/finance/bits";
import { formatINR } from "@/data/mockData";
import { useRole } from "@/context/RoleContext";
import { cn } from "@/lib/utils";

/** Finance Officer landing view — the disbursement desk summary with a direct
 * route into the Approved Projects & Disbursement register. */
export function FinanceOfficerDashboard() {
  const { roleLabel } = useRole();
  const { data, isLoading } = useApprovedProjectsQuery();
  const projects = data ?? [];

  const pending = projects.filter((p) => p.financialStatus === "PENDING");
  const cleared = projects.filter((p) => p.financialStatus === "APPROVED");
  const clearedLiability = cleared.reduce(
    (s, p) => s + (p.financialAssessment?.totalCompensation ?? 0),
    0,
  );

  const kpis = [
    {
      label: "LAO Approved Projects",
      value: String(projects.length),
      icon: FolderSearch,
      tone: "bg-ink",
    },
    {
      label: "Pending Financial Clearance",
      value: String(pending.length),
      icon: Clock,
      tone: "bg-status-warn",
    },
    {
      label: "Clearances Approved",
      value: String(cleared.length),
      icon: CheckCircle2,
      tone: "bg-status-ok",
    },
    {
      label: "Cleared Liability",
      value: formatINR(clearedLiability),
      icon: BadgeIndianRupee,
      tone: "bg-status-info",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[6px] border border-ink/20 bg-gradient-to-r from-ink via-[#3b2f20] to-[#4c3d29] p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-400/20 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-amber-300">
                FINANCE OFFICER
              </span>
              <span className="text-[12px] text-white/80">
                Compensation &amp; Disbursement Desk
              </span>
            </div>
            <h2 className="mt-1.5 text-[20px] font-semibold tracking-tight">
              Financial sanctions &amp; compensation clearance
            </h2>
            <p className="mt-0.5 text-[12.5px] text-white/80">
              {roleLabel} desk — approve LAO-cleared assessments and forward them to District
              Officers for execution.
            </p>
          </div>
          <Link
            to="/approved-projects"
            className="inline-flex items-center gap-1.5 rounded-[4px] bg-status-info px-3 py-2 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Open Approved Projects &amp; Disbursement
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="panel relative overflow-hidden px-4 py-3">
            <span className={cn("absolute inset-y-0 left-0 w-[3px]", tone)} />
            <div className="flex items-center justify-between gap-2">
              <div className="label-xs">{label}</div>
              <Icon className="size-4 text-muted-foreground/70" />
            </div>
            <div className="num mt-2 text-[24px] font-semibold leading-none text-foreground">
              {value}
            </div>
          </div>
        ))}
      </div>

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <Landmark className="size-3.5 text-ink" />
            <div className="label-xs">Awaiting Financial Assessment</div>
          </div>
          <Link
            to="/approved-projects"
            className="text-[11px] font-medium text-status-info hover:underline"
          >
            View all approved projects
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            <div className="shimmer h-10 w-full" />
            <div className="shimmer h-10 w-full" />
          </div>
        ) : pending.length === 0 ? (
          <div className="px-4 py-8 text-center text-[12.5px] text-muted-foreground">
            No LAO-approved projects are awaiting financial clearance in your scope.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pending.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="num font-mono text-[11px] font-semibold text-ink">{p.id}</span>
                    <FinancialStatusBadge status={p.financialStatus} />
                  </div>
                  <div className="mt-0.5 truncate text-[13px] font-medium text-foreground">
                    {p.projectName}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {p.state} · {p.district} · {p.affectedLandowners} affected landowners ·{" "}
                    {p.requiredLandAcres.toFixed(2)} acres
                  </div>
                </div>
                <Link
                  to="/approved-projects/$id"
                  params={{ id: p.id }}
                  className="inline-flex shrink-0 items-center gap-1 rounded-[4px] border border-border px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Assess &amp; Approve
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
