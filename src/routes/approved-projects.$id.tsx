import { lazy, Suspense, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, FileText } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectThumbnail } from "@/components/proposals/ProjectThumbnail";
import { StagePill } from "@/components/proposals/bits";
import { DocumentRepository } from "@/components/proposals/DocumentRepository";
import { AuditTrail } from "@/components/proposals/AuditTrail";
import { AffectedLandownersTable } from "@/components/finance/AffectedLandownersTable";
import { FinancialAssessmentPanel } from "@/components/finance/FinancialAssessmentPanel";
import { FinancialStatusBadge, LaoApprovedBadge, MetaRow } from "@/components/finance/bits";
import {
  useFinancialAssessmentQuery,
  useProposalGeometryQuery,
  type ProposalParcelGeometry,
} from "@/hooks/useFinance";
import { useProposalQuery } from "@/hooks/useProposals";
import { formatINRFull, isLaoApproved } from "@/data/mockData";
import { fileNumberOf } from "@/lib/fileNumber";
import { ApiError } from "@/lib/api";

const AcquisitionMap = lazy(() =>
  import("@/components/finance/AcquisitionMap").then((m) => ({ default: m.AcquisitionMap })),
);

export const Route = createFileRoute("/approved-projects/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Financial Workspace | BHUMITRA` },
      {
        name: "description",
        content: `Financial assessment, affected landowners and compensation disbursement workspace for ${params.id}.`,
      },
    ],
  }),
  component: FinanceWorkspace,
});

function WorkspaceNotFound() {
  return (
    <AppShell breadcrumb={["Home", "Approved Projects & Disbursement", "Not found"]}>
      <div className="panel grid min-h-[240px] place-items-center p-8 text-center">
        <div>
          <div className="label-xs">Record not found</div>
          <p className="mt-2 text-[13px] text-muted-foreground">
            No approved project exists against this identifier in your scope.
          </p>
          <Link
            to="/approved-projects"
            className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-status-info hover:underline"
          >
            <ChevronLeft className="size-3.5" /> Back to Approved Projects
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function FinanceWorkspace() {
  const { id } = Route.useParams();
  const { data: proposal, isLoading, error } = useProposalQuery(id);
  const [engineRequested, setEngineRequested] = useState(false);
  const [selectedUlpin, setSelectedUlpin] = useState<string | null>(null);

  const autoRun = proposal?.financialStatus === "APPROVED";
  const assessmentQuery = useFinancialAssessmentQuery(id, engineRequested || autoRun);
  const geometryQuery = useProposalGeometryQuery(id);

  if (isLoading) {
    return (
      <AppShell breadcrumb={["Home", "Approved Projects & Disbursement", id]}>
        <p className="mb-3 text-[12px] text-muted-foreground">
          Retrieving approved project {id} from the financial register…
        </p>
        <div className="space-y-3">
          <div className="shimmer h-28 w-full" />
          <div className="shimmer h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (error instanceof ApiError && error.status === 404) return <WorkspaceNotFound />;
  if (!proposal) return <WorkspaceNotFound />;

  const notApproved = !isLaoApproved(proposal.currentStage);
  const requiredLandAcres = proposal.totalAreaHa * 2.47105;
  const geometryParcels: ProposalParcelGeometry[] = geometryQuery.data?.parcels ?? [];

  const pills: [string, string][] = [
    ["Agency", proposal.requiringBody],
    ["State / District", `${proposal.state} · ${proposal.district}`],
    ["Required Land", `${requiredLandAcres.toFixed(2)} acres`],
    ["Affected Landowners", String(proposal.parcels.length)],
    [
      "Initiated",
      new Date(proposal.initiatedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    ],
  ];

  return (
    <AppShell
      breadcrumb={[
        "Home",
        "Compensation Management",
        "Approved Projects & Disbursement",
        proposal.id,
      ]}
    >
      <Link
        to="/approved-projects"
        className="mb-3 inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" /> Approved Projects &amp; Disbursement
      </Link>

      <header className="rounded-[6px] bg-ink px-5 py-4 text-ink-foreground">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <ProjectThumbnail
              projectName={proposal.projectName}
              className="hidden h-[84px] w-[112px] sm:grid"
            />
            <div className="min-w-0">
              <div className="num font-mono text-[12px] tracking-wide text-ink-muted">
                {proposal.id}
                <span className="ml-2 text-white/50">·</span>
                <span className="ml-2 text-[11px]">{fileNumberOf(proposal)}</span>
              </div>
              <h1 className="mt-1 text-[22px] font-semibold leading-tight">
                {proposal.projectName}
              </h1>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {pills.map(([label, value]) => (
                  <span
                    key={label}
                    className="rounded-[4px] border border-white/15 bg-white/5 px-2 py-1 text-[11.5px]"
                  >
                    <span className="text-ink-muted">{label}: </span>
                    <span className="num font-medium">{value}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="text-right">
              <div className="label-xs text-ink-muted">LAO Status</div>
              <div className="mt-1">
                <LaoApprovedBadge />
              </div>
            </div>
            <div className="text-right">
              <div className="label-xs text-ink-muted">Financial Status</div>
              <div className="mt-1">
                <FinancialStatusBadge status={proposal.financialStatus} size="lg" />
              </div>
            </div>
            <Link
              to="/dossier/$id"
              params={{ id: proposal.id }}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-white/20 px-3 py-1.5 text-[11.5px] font-medium text-ink-foreground/90 transition-colors hover:bg-white/10"
            >
              <FileText className="size-3.5" />
              Read proposal dossier
            </Link>
          </div>
        </div>
      </header>

      {notApproved && (
        <div className="mt-4 rounded-[5px] border border-status-warn/40 bg-status-warn/10 px-4 py-2.5 text-[12.5px] text-status-warn">
          This proposal has not yet received Land Acquisition Authority approval — financial
          assessment is disabled until it reaches the Section 19 declaration.
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[65fr_35fr]">
        <div className="space-y-4">
          {/* Project metadata & statutory compensation position */}
          <section className="panel p-4">
            <div className="label-xs">Project &amp; Financial Metadata</div>
            <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
              <div className="space-y-2.5">
                <MetaRow label="Project ID" value={proposal.id} />
                <MetaRow label="File Number" value={fileNumberOf(proposal)} />
                <MetaRow label="Agency / Requiring Body" value={proposal.requiringBody} />
                <MetaRow label="State" value={proposal.state} />
                <MetaRow label="District" value={proposal.district} />
                <MetaRow
                  label="Required Land"
                  value={`${requiredLandAcres.toFixed(2)} acres (${proposal.totalAreaHa.toFixed(2)} Ha)`}
                />
              </div>
              <div className="space-y-2.5">
                <MetaRow label="Affected Landowners" value={String(proposal.parcels.length)} />
                <MetaRow label="Affected Families" value={String(proposal.affectedFamilies)} />
                <MetaRow
                  label="Current Stage"
                  value={<StagePill stage={proposal.currentStage} />}
                />
                <MetaRow
                  label="Initiated"
                  value={new Date(proposal.initiatedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                />
                <MetaRow
                  label="Stage Entered"
                  value={new Date(proposal.stageEnteredAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                />
                <MetaRow
                  label="LAO Status"
                  value={<span className="text-status-ok">Approved</span>}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3 border-t border-border pt-3 text-[13px]">
              {(
                [
                  ["Assessed (Sec. 26)", proposal.compensation.assessed],
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
          </section>

          {/* Interactive acquisition map overlay */}
          <section className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
              <div>
                <div className="label-xs">Acquisition Map Overlay</div>
                <div className="text-[11px] text-muted-foreground">
                  Cadastral parcel geometry for this project — click a parcel to inspect its
                  valuation row.
                </div>
              </div>
              {selectedUlpin && (
                <button
                  type="button"
                  onClick={() => setSelectedUlpin(null)}
                  className="rounded-[4px] border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  Clear selection
                </button>
              )}
            </div>
            {geometryQuery.isLoading ? (
              <div className="shimmer h-[440px] w-full" />
            ) : geometryQuery.isError ? (
              <div className="grid h-[320px] place-items-center px-6 text-center text-[12.5px] text-muted-foreground">
                The parcel geometry service is unavailable for this project.
              </div>
            ) : (
              <Suspense fallback={<div className="shimmer h-[440px] w-full" />}>
                <AcquisitionMap
                  parcels={geometryParcels}
                  state={proposal.state}
                  district={proposal.district}
                  selectedUlpin={selectedUlpin}
                  onSelectUlpin={setSelectedUlpin}
                />
              </Suspense>
            )}
          </section>

          <AffectedLandownersTable
            proposal={proposal}
            assessment={assessmentQuery.data}
            selectedUlpin={selectedUlpin}
            onSelectUlpin={setSelectedUlpin}
          />

          <FinancialAssessmentPanel
            proposal={proposal}
            assessment={assessmentQuery.data}
            isFetching={assessmentQuery.isFetching}
            error={assessmentQuery.error}
            engineRun={engineRequested || autoRun}
            onRun={() => setEngineRequested(true)}
            onRefresh={() => void assessmentQuery.refetch()}
          />

          <AuditTrail proposalId={proposal.id} />
        </div>

        <div className="space-y-4">
          <DocumentRepository proposal={proposal} />
        </div>
      </div>
    </AppShell>
  );
}
