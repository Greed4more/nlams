import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, HeartHandshake, Info, RefreshCw, Search } from "lucide-react";
import { LandownerPortalShell } from "@/components/public/LandownerPortalShell";
import {
  usePublicLandownerDetail,
  usePublicLandownerSearch,
  type RrStage,
} from "@/hooks/usePublicPortal";
import { formatINRFull } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/public/rr")({
  validateSearch: (search: Record<string, unknown>): { ulpin?: string } => ({
    ...(typeof search["ulpin"] === "string" ? { ulpin: search["ulpin"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Rehabilitation & Resettlement (R&R) — LAMS Public Portal" },
      {
        name: "description",
        content:
          "Track your Rehabilitation & Resettlement case through Eligibility, LAO Review, Financial Settlement, District Approval and Implementation.",
      },
    ],
  }),
  component: PublicRrPage,
});

const STATUS_TEXT: Record<RrStage["status"], string> = {
  COMPLETE: "Completed",
  IN_PROGRESS: "In progress",
  PENDING: "Pending",
};

function RrStepper({ stages, currentStep }: { stages: RrStage[]; currentStep: number }) {
  return (
    <ol className="flex items-start overflow-x-auto px-1 py-2">
      {stages.map((stage, i) => {
        const complete = stage.status === "COMPLETE";
        const current = stage.status === "IN_PROGRESS";
        return (
          <li key={stage.key} className="flex min-w-[150px] flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span
                className={cn(
                  "h-[2px] flex-1",
                  i === 0 ? "bg-transparent" : complete || current ? "bg-status-ok" : "bg-border",
                )}
              />
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full border-2 text-[12.5px] font-bold",
                  complete && "border-status-ok bg-status-ok text-white",
                  current && "border-status-info bg-status-info/10 text-status-info",
                  !complete && !current && "border-border bg-card text-muted-foreground",
                )}
              >
                {complete ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "h-[2px] flex-1",
                  i === stages.length - 1
                    ? "bg-transparent"
                    : complete
                      ? "bg-status-ok"
                      : "bg-border",
                )}
              />
            </div>
            <div
              className={cn(
                "mt-2 px-1 text-center text-[12px] font-semibold leading-tight",
                current
                  ? "text-status-info"
                  : complete
                    ? "text-foreground"
                    : "text-muted-foreground",
              )}
            >
              {i + 1}. {stage.label}
            </div>
            <div
              className={cn(
                "mt-1 text-[10.5px] font-semibold",
                complete
                  ? "text-status-ok"
                  : current
                    ? "text-status-info"
                    : "text-muted-foreground",
              )}
            >
              {STATUS_TEXT[stage.status]}
              {current ? ` (Step ${currentStep})` : ""}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function PublicRrPage() {
  const { ulpin } = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const search = usePublicLandownerSearch(query);
  const records = useMemo(() => search.data?.landowners ?? [], [search.data]);
  const selectedUlpin = ulpin ?? records[0]?.ulpin;
  const detail = usePublicLandownerDetail(selectedUlpin);
  const record = detail.data;

  useEffect(() => {
    if (!ulpin && records[0]?.ulpin) {
      // Keep the URL shareable once the first record resolves.
      void navigate({
        to: "/public/rr",
        search: { ulpin: records[0].ulpin },
        replace: true,
      });
    }
  }, [ulpin, records, navigate]);

  return (
    <LandownerPortalShell breadcrumb={["Rehabilitation & Resettlement"]}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <HeartHandshake className="mt-0.5 size-5 text-status-info" />
          <div>
            <h1 className="text-[20px] font-semibold leading-tight tracking-tight text-foreground">
              Rehabilitation &amp; Resettlement (R&amp;R)
            </h1>
            <p className="mt-1 text-[12px] text-muted-foreground">
              RFCTLARR Act 2013 Statutory Entitlements, Multi-Officer Review Workflow &amp;
              Resettlement Tracking
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void detail.refetch()}
          disabled={detail.isFetching}
          className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-3 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          <RefreshCw className={cn("size-3.5", detail.isFetching && "animate-spin")} />
          Refresh State
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] max-w-[380px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ULPIN, Survey No. or landowner name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 text-[12.5px]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {records.slice(0, 6).map((r) => (
            <button
              key={r.ulpin}
              type="button"
              onClick={() =>
                void navigate({ to: "/public/rr", search: { ulpin: r.ulpin }, replace: true })
              }
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10.5px] font-medium transition-colors",
                r.ulpin === selectedUlpin
                  ? "border-status-info/40 bg-status-info/10 text-status-info"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {r.ownerName} · Sy. {r.khasraNo}
            </button>
          ))}
        </div>
      </div>

      {!record && detail.isLoading && <div className="shimmer mt-4 h-[420px] w-full" />}
      {!record && !detail.isLoading && (
        <div className="panel mt-4 grid min-h-[200px] place-items-center p-8 text-center text-[13px] text-muted-foreground">
          No R&amp;R case found. Search by your ULPIN or survey number to track your case.
        </div>
      )}

      {record && (
        <div className="mt-4 space-y-4">
          <section className="panel border-l-4 border-l-status-info px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <HeartHandshake className="size-4 text-status-info" />
                <h2 className="text-[16px] font-semibold text-foreground">
                  Primary Landowner Case: {record.ownerName}
                </h2>
              </div>
              <div className="text-right text-[11.5px]">
                <div className="text-muted-foreground">Overall R&amp;R Status</div>
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-[4px] border border-status-info/30 bg-status-info/10 px-2 py-0.5 text-[10.5px] font-semibold text-status-info">
                  <span className="size-1.5 rounded-full bg-current" />
                  {record.rr.overallStatus.replaceAll("_", " ")}
                </span>
              </div>
            </div>
            <p className="num mt-1 text-[11.5px] text-muted-foreground">
              Case ID: {record.rr.caseId} · Automatically populated from land acquisition context
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2 xl:grid-cols-5">
              <div>
                <div className="text-[10.5px] text-muted-foreground">Affected Landowner</div>
                <div className="text-[13px] font-semibold">{record.ownerName}</div>
                <div className="text-[10.5px] text-muted-foreground">
                  Displaced Title Holder ({record.vernacularTerm?.standard ?? "Record of Rights"})
                </div>
              </div>
              <div>
                <div className="text-[10.5px] text-muted-foreground">Acquisition Project</div>
                <div className="text-[13px] font-semibold">{record.projectName}</div>
                <div className="num text-[10.5px] text-muted-foreground">{record.projectId}</div>
              </div>
              <div>
                <div className="text-[10.5px] text-muted-foreground">Survey / Cadastral Parcel</div>
                <div className="num text-[13px] font-semibold">Sy. No. {record.khasraNo}</div>
                <div className="num text-[10.5px] text-muted-foreground">
                  Parcel ID: {record.ulpin}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] text-muted-foreground">Acquired Land Extent</div>
                <div className="num text-[13px] font-semibold text-status-ok">
                  {record.acquiredAreaAcres.toFixed(2)} Acres
                </div>
                <div className="text-[10.5px] text-muted-foreground">
                  {record.district}, {record.state}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] text-muted-foreground">
                  R&amp;R Statutory Eligibility
                </div>
                <div
                  className={cn(
                    "text-[13px] font-semibold",
                    record.rr.eligibility.startsWith("Eligible")
                      ? "text-status-ok"
                      : "text-status-warn",
                  )}
                >
                  {record.rr.eligibility.startsWith("Eligible") ? "✓ " : ""}
                  {record.rr.eligibility}
                </div>
                <div className="text-[10.5px] text-muted-foreground">RFCTLARR 2nd Schedule</div>
              </div>
            </div>
          </section>

          <section className="panel overflow-hidden">
            <div className="border-b border-border px-4 py-2.5">
              <div className="label-xs">R&amp;R Workflow &amp; Approval Lifecycle</div>
            </div>
            <div className="px-3 py-4">
              <RrStepper stages={record.rr.stages} currentStep={record.rr.currentStep} />
            </div>
          </section>

          <section className="panel border-l-4 border-l-status-info px-4 py-3">
            <div className="flex items-start gap-2.5">
              <Info className="mt-0.5 size-4 shrink-0 text-status-info" />
              <div>
                <h2 className="text-[14px] font-semibold text-foreground">
                  Landowner R&amp;R Tracking Portal — Welcome {record.ownerName}
                </h2>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  Your Rehabilitation &amp; Resettlement case is being actively processed by
                  government officers. As an affected title holder, your statutory entitlements
                  under RFCTLARR Act 2013 are being verified and calculated.
                </p>
                <Link
                  to="/public/landowners"
                  search={{ ulpin: record.ulpin }}
                  className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold text-status-info hover:underline"
                >
                  View your parcel map &amp; compensation breakdown →
                </Link>
              </div>
            </div>
          </section>

          <section className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
              <div className="label-xs">
                Statutory Entitlements — Second Schedule, RFCTLARR Act 2013
              </div>
              <span className="num text-[11px] text-muted-foreground">
                Assessed R&amp;R allowance:{" "}
                <strong className="text-foreground">
                  {formatINRFull(record.compensation.rrAllowance)}
                </strong>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead className="bg-muted/50">
                  <tr>
                    {[
                      "Assistance Category",
                      "Statutory Basis",
                      "Applicability",
                      "Assessed Amount",
                    ].map((h) => (
                      <th
                        key={h}
                        className="label-xs whitespace-nowrap border-b border-border px-4 py-2 text-left"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {record.rr.entitlements.map((e) => (
                    <tr key={e.category} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-medium text-foreground">{e.category}</td>
                      <td className="px-4 py-2 text-[11.5px] text-muted-foreground">{e.basis}</td>
                      <td className="px-4 py-2">
                        <span
                          className={cn(
                            "rounded-[4px] border px-1.5 py-0.5 text-[10.5px] font-semibold",
                            e.applicable
                              ? "border-status-ok/30 bg-status-ok/10 text-status-ok"
                              : "border-border bg-muted text-muted-foreground",
                          )}
                        >
                          {e.applicable ? "Applicable" : "Not applicable"}
                        </span>
                      </td>
                      <td className="num px-4 py-2 text-right font-semibold">
                        {e.applicable ? formatINRFull(e.amount) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-muted/60 font-semibold">
                    <td className="px-4 py-2" colSpan={3}>
                      Total assessed R&amp;R allowance
                    </td>
                    <td className="num px-4 py-2 text-right">
                      {formatINRFull(record.compensation.rrAllowance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="panel overflow-hidden">
            <div className="border-b border-border px-4 py-2.5">
              <div className="label-xs">Allocated Compensation Summary</div>
            </div>
            <div className="grid grid-cols-2 gap-3 px-4 py-3 sm:grid-cols-4">
              {(
                [
                  ["Base Land Value", record.compensation.baseLandValue],
                  ["Solatium (100%)", record.compensation.solatium],
                  ["R&R Allowance", record.compensation.rrAllowance],
                  ["Total Allocated Payout", record.compensation.totalAllocated],
                ] as const
              ).map(([label, value], i) => (
                <div key={label}>
                  <div className="text-[10.5px] text-muted-foreground">{label}</div>
                  <div
                    className={cn(
                      "num mt-0.5 font-semibold",
                      i === 3 ? "text-[16px]" : "text-[14px]",
                    )}
                  >
                    {formatINRFull(value)}
                  </div>
                </div>
              ))}
            </div>
            <p className="border-t border-border bg-muted/40 px-4 py-2 text-[10.5px] leading-snug text-muted-foreground">
              {record.notice}
            </p>
          </section>
        </div>
      )}
    </LandownerPortalShell>
  );
}
