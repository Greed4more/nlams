import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { formatINRFull } from "@/data/mockData";
import { getSlaStatus, SLA_STATUS_LABEL } from "@/lib/slaRules";
import { SlaBadge } from "@/components/proposals/bits";
import { WorkflowStepper } from "@/components/proposals/WorkflowStepper";
import { ParcelsTable } from "@/components/proposals/ParcelsTable";
import { DocumentRepository } from "@/components/proposals/DocumentRepository";
import { AuditTrail } from "@/components/proposals/AuditTrail";
import { RiskConsentPanel } from "@/components/proposals/RiskConsentPanel";
import { useRole, NO_CREDENTIALS_HINT } from "@/context/RoleContext";
import { useSpotlight } from "@/context/DemoContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { useAdvanceStageMutation, useProposalQuery } from "@/hooks/useProposals";

export const Route = createFileRoute("/proposals/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — BHUMITRA` },
      {
        name: "description",
        content: `Statutory status, parcels and compensation for acquisition proposal ${params.id}.`,
      },
    ],
  }),
  component: ProposalDetail,
});

function ProposalNotFound() {
  return (
    <AppShell breadcrumb={["Home", "Proposals", "Not found"]}>
      <div className="panel grid min-h-[240px] place-items-center p-8 text-center">
        <div>
          <div className="label-xs">Record not found</div>
          <p className="mt-2 text-[13px] text-muted-foreground">
            No proposal exists against this identifier in the BHUMITRA register.
          </p>
          <Link
            to="/proposals"
            className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-status-info hover:underline"
          >
            <ChevronLeft className="size-3.5" /> Back to Proposal Pipeline
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function ProposalDetail() {
  const { id } = Route.useParams();
  const { data: proposal, isLoading, error } = useProposalQuery(id);
  const { canAct } = useRole();
  const advanceStage = useAdvanceStageMutation(id);
  const headerSpotlight = useSpotlight("proposal-header");

  if (isLoading) {
    return (
      <AppShell breadcrumb={["Home", "Proposals", id]}>
        <div className="space-y-3">
          <div className="shimmer h-24 w-full" />
          <div className="shimmer h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (error instanceof ApiError && error.status === 404) return <ProposalNotFound />;
  if (!proposal) return <ProposalNotFound />;

  const sla = getSlaStatus(proposal);

  const pills: [string, string][] = [
    ["Requiring Body", proposal.requiringBody],
    ["State / District", `${proposal.state} · ${proposal.district}`],
    ["Total Area", `${proposal.totalAreaHa.toFixed(2)} Ha`],
    ["Affected Families", String(proposal.affectedFamilies)],
    [
      "Date Initiated",
      new Date(proposal.initiatedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    ],
  ];

  const handleAdvance = () => {
    if (!canAct) return;
    advanceStage.mutate(undefined, {
      onSuccess: (updated) => {
        toast.success("Stage advanced", {
          description: `${updated.id} moved to the next statutory stage — logged to the audit trail.`,
        });
      },
      onError: (err) => {
        toast.error("Could not advance stage", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      },
    });
  };

  return (
    <AppShell breadcrumb={["Home", "Proposals", proposal.id]}>
      <Link
        to="/proposals"
        className="mb-3 inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" /> Proposal Pipeline
      </Link>

      {/* Header banner */}
      <header
        className={cn("rounded-[6px] bg-navy px-5 py-4 text-navy-foreground", headerSpotlight)}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="num font-mono text-[12px] tracking-wide text-navy-muted">
              {proposal.id}
            </div>
            <h1 className="mt-1 text-[22px] font-semibold leading-tight">{proposal.projectName}</h1>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {pills.map(([label, value]) => (
                <span
                  key={label}
                  className="rounded-[4px] border border-white/15 bg-white/5 px-2 py-1 text-[11.5px]"
                >
                  <span className="text-navy-muted">{label}: </span>
                  <span className="num font-medium">{value}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="text-right">
              <div className="label-xs text-navy-muted">Statutory Status</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[12px] text-navy-muted">{SLA_STATUS_LABEL[sla.status]}</span>
                <SlaBadge sla={sla} size="lg" />
              </div>
            </div>
            {(() => {
              const disabled =
                !canAct || advanceStage.isPending || proposal.currentStage === "RR_COMPLETE";
              const advanceButton = (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={handleAdvance}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-[4px] bg-status-info px-3 py-2 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90",
                    disabled && "cursor-not-allowed opacity-45 hover:opacity-45",
                  )}
                >
                  {advanceStage.isPending && <Loader2 className="size-3.5 animate-spin" />}
                  Advance to Next Stage
                  {!advanceStage.isPending && <ArrowRight className="size-3.5" />}
                </button>
              );
              if (canAct) return advanceButton;
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">{advanceButton}</span>
                  </TooltipTrigger>
                  <TooltipContent side="left">{NO_CREDENTIALS_HINT}</TooltipContent>
                </Tooltip>
              );
            })()}
          </div>
        </div>
      </header>

      <div className="mt-4">
        <WorkflowStepper proposal={proposal} />
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[65fr_35fr]">
        <div className="space-y-4">
          <ParcelsTable proposal={proposal} />
          <div className="panel px-4 py-3">
            <div className="label-xs">Compensation Summary</div>
            <div className="mt-2 grid grid-cols-3 gap-3 text-[13px]">
              {(
                [
                  ["Assessed", proposal.compensation.assessed],
                  ["Disbursed", proposal.compensation.disbursed],
                  ["Pending", proposal.compensation.pending],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <div className="text-[11px] text-muted-foreground">{label}</div>
                  <div className="num mt-0.5 text-[15px] font-semibold">{formatINRFull(value)}</div>
                </div>
              ))}
            </div>
          </div>
          <RiskConsentPanel proposalId={proposal.id} />
          <AuditTrail proposalId={proposal.id} />
        </div>
        <DocumentRepository proposal={proposal} />
      </div>
    </AppShell>
  );
}
