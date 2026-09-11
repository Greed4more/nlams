import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { usePublicProposalDetail } from "@/hooks/usePublicPortal";
import { STAGE_LABELS, formatCrore } from "@/data/mockData";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/public/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Public Case Record — BHUMITRA` },
      {
        name: "description",
        content: `Public, non-identifying disclosure for land acquisition case ${params.id}.`,
      },
    ],
  }),
  component: PublicProposalDetailPage,
});

function PublicProposalDetailPage() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = usePublicProposalDetail(id);

  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <PublicShell>
      <Link
        to="/public"
        className="mb-3 inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" /> Public Case Search
      </Link>

      {isLoading && (
        <div className="space-y-3">
          <div className="shimmer h-16 w-full" />
          <div className="shimmer h-40 w-full" />
        </div>
      )}

      {notFound && !isLoading && (
        <div className="panel grid min-h-[200px] place-items-center p-8 text-center">
          <div>
            <div className="label-xs">Record not found</div>
            <p className="mt-2 text-[13px] text-muted-foreground">
              No public disclosure exists against this case identifier.
            </p>
          </div>
        </div>
      )}

      {data && (
        <>
          <header className="rounded-[6px] bg-navy px-5 py-4 text-navy-foreground">
            <div className="num font-mono text-[12px] tracking-wide text-navy-muted">
              {data.projectId}
            </div>
            <h1 className="mt-1 text-[20px] font-semibold leading-tight">{data.projectName}</h1>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                ["State / District", `${data.state} · ${data.district}`],
                ["Current Stage", STAGE_LABELS[data.currentStage] ?? data.currentStage],
              ].map(([label, value]) => (
                <span
                  key={label}
                  className="rounded-[4px] border border-white/15 bg-white/5 px-2 py-1 text-[11.5px]"
                >
                  <span className="text-navy-muted">{label}: </span>
                  <span className="num font-medium">{value}</span>
                </span>
              ))}
            </div>
          </header>

          <section className="panel mt-4 px-4 py-3">
            <div className="label-xs">Aggregate Public Metrics</div>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(
                [
                  ["Parcels Notified", String(data.aggregateMetrics.totalParcelsNotified)],
                  [
                    "Area Notified (Ha)",
                    data.aggregateMetrics.aggregateAreaNotifiedHectares.toFixed(2),
                  ],
                  [
                    "Compensation Disbursed",
                    formatCrore(
                      data.aggregateMetrics.aggregateCompensationDisbursedCrores * 10_000_000,
                    ),
                  ],
                  ["Affected Families", String(data.aggregateMetrics.affectedFamilies)],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <div className="text-[11px] text-muted-foreground">{label}</div>
                  <div className="num mt-0.5 text-[16px] font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            {data.transparencyNotice}
          </p>
        </>
      )}
    </PublicShell>
  );
}
