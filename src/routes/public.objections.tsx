import { useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  FileUp,
  Gavel,
  Loader2,
  MessageSquareWarning,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { LandownerPortalShell } from "@/components/public/LandownerPortalShell";
import {
  OBJECTION_TYPES,
  usePublicLandownerDetail,
  usePublicLandownerSearch,
  usePublicObjections,
  useSubmitPublicObjection,
  type ObjectionType,
  type PublicObjection,
} from "@/hooks/usePublicPortal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/public/objections")({
  validateSearch: (search: Record<string, unknown>): { ulpin?: string } => ({
    ...(typeof search["ulpin"] === "string" ? { ulpin: search["ulpin"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Objections & Dispute Redressal — LAMS Public Portal" },
      {
        name: "description",
        content:
          "Raise and track a formal objection on land valuation, boundary displacement, R&R eligibility or compensation disbursement.",
      },
    ],
  }),
  component: PublicObjectionsPage,
});

const STATUS_TONE: Record<string, string> = {
  SUBMITTED: "border-status-info/30 bg-status-info/10 text-status-info",
  UNDER_REVIEW: "border-status-warn/30 bg-status-warn/10 text-status-warn",
  FIELD_VERIFICATION: "border-status-warn/30 bg-status-warn/10 text-status-warn",
  RESOLVED: "border-status-ok/30 bg-status-ok/10 text-status-ok",
  REJECTED: "border-status-critical/30 bg-status-critical/10 text-status-critical",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

async function downloadEvidence(objection: PublicObjection) {
  const apiUrl = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:4000";
  const res = await fetch(`${apiUrl}/api/public/objections/${objection.id}/evidence`);
  if (!res.ok) throw new Error("Evidence could not be retrieved");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = objection.evidenceName ?? "objection-evidence";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4_000);
}

function ObjectionCard({ objection }: { objection: PublicObjection }) {
  const [downloading, setDownloading] = useState(false);
  const overdue =
    !["RESOLVED", "REJECTED"].includes(objection.status) &&
    new Date(objection.slaDeadline).getTime() < Date.now();

  return (
    <article className="panel px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold text-foreground">
              {objection.objectionTypeLabel}
            </span>
            <span
              className={cn(
                "rounded-[4px] border px-1.5 py-0.5 text-[10.5px] font-semibold",
                STATUS_TONE[objection.status] ?? "border-border bg-muted text-muted-foreground",
              )}
            >
              {objection.statusLabel}
            </span>
          </div>
          <div className="num mt-0.5 text-[10.5px] text-muted-foreground">
            {objection.id.slice(0, 12).toUpperCase()} · filed {fmtDate(objection.createdAt)}
            {objection.projectName ? ` · ${objection.projectName}` : ""}
          </div>
        </div>
        <div className="text-right text-[10.5px] text-muted-foreground">
          {objection.resolvedAt ? (
            <span className="font-semibold text-status-ok">
              Closed {fmtDate(objection.resolvedAt)}
            </span>
          ) : (
            <span className={cn(overdue && "font-semibold text-status-critical")}>
              SLA due {fmtDate(objection.slaDeadline)}
              {overdue ? " · overdue" : ""}
            </span>
          )}
        </div>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground/90">
        {objection.description}
      </p>
      {(objection.hasEvidence || objection.evidenceUrl) && (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
          {objection.hasEvidence && (
            <button
              type="button"
              disabled={downloading}
              onClick={async () => {
                setDownloading(true);
                try {
                  await downloadEvidence(objection);
                } catch (err) {
                  toast.error("Could not download evidence", {
                    description: err instanceof Error ? err.message : "Unknown error",
                  });
                } finally {
                  setDownloading(false);
                }
              }}
              className="inline-flex items-center gap-1.5 font-medium text-status-info hover:underline disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <FileUp className="size-3" />
              )}
              {objection.evidenceName ?? "Attached evidence"}
            </button>
          )}
          {objection.evidenceUrl && (
            <a
              href={objection.evidenceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-status-info hover:underline"
            >
              Linked reference
            </a>
          )}
        </div>
      )}
    </article>
  );
}

function PublicObjectionsPage() {
  const { ulpin } = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const search = usePublicLandownerSearch(query);
  const records = useMemo(() => search.data?.landowners ?? [], [search.data]);
  const selectedUlpin = ulpin ?? records[0]?.ulpin;
  const detail = usePublicLandownerDetail(selectedUlpin);
  const record = detail.data;
  const objections = usePublicObjections(selectedUlpin);
  const submitObjection = useSubmitPublicObjection();

  const [objectionType, setObjectionType] = useState<ObjectionType>("LAND_VALUATION");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!record) return;
    if (description.trim().length < 10) {
      toast.error("Description too short", {
        description: "Please describe the objection in at least 10 characters.",
      });
      return;
    }
    submitObjection.mutate(
      {
        ulpin: record.ulpin,
        objectionType,
        description,
        evidenceUrl: evidenceUrl || undefined,
        evidenceFile,
      },
      {
        onSuccess: (created) => {
          toast.success("Objection filed", {
            description: `Reference ${created.id.slice(0, 12).toUpperCase()} — the Land Acquisition Officer will review it within the 15-day statutory SLA.`,
          });
          setDescription("");
          setEvidenceUrl("");
          setEvidenceFile(null);
          if (fileInput.current) fileInput.current.value = "";
        },
        onError: (err) =>
          toast.error("Could not file the objection", {
            description: err instanceof Error ? err.message : "Unknown error",
          }),
      },
    );
  };

  const list = objections.data?.objections ?? [];

  return (
    <LandownerPortalShell breadcrumb={["Public Dispute Redressal"]}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <MessageSquareWarning className="mt-0.5 size-5 text-status-warn" />
          <div>
            <h1 className="text-[20px] font-semibold leading-tight tracking-tight text-foreground">
              PUBLIC DISPUTE REDRESSAL — OBJECTIONS
            </h1>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Raise a formal objection on land valuation, boundary displacement (EGPS pegging),
              R&amp;R eligibility or compensation disbursement, and track its resolution.
            </p>
          </div>
        </div>
        <div className="relative min-w-[240px] max-w-[380px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ULPIN, Survey No. or landowner name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 text-[12.5px]"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {records.slice(0, 8).map((r) => (
          <button
            key={r.ulpin}
            type="button"
            onClick={() =>
              void navigate({ to: "/public/objections", search: { ulpin: r.ulpin }, replace: true })
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

      {!selectedUlpin && (
        <div className="panel mt-4 grid min-h-[200px] place-items-center p-8 text-center text-[13px] text-muted-foreground">
          Search for your land record above to raise or track an objection.
        </div>
      )}

      {selectedUlpin && (
        <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[440px_1fr]">
          {/* Filing engine */}
          <section className="panel overflow-hidden">
            <div className="border-b border-border px-4 py-2.5">
              <div className="label-xs">Objection Filing Engine</div>
            </div>

            {record && (
              <div className="border-b border-border bg-muted/30 px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
                  Auto-populated from land acquisition context
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <div className="text-[10.5px] text-muted-foreground">Landowner Name</div>
                    <div className="text-[12.5px] font-semibold">{record.ownerName}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] text-muted-foreground">Survey / Parcel No.</div>
                    <div className="num text-[12.5px] font-semibold">
                      Sy. No. {record.khasraNo} · {record.ulpin}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-[10.5px] text-muted-foreground">Project</div>
                    <div className="text-[12.5px] font-semibold">{record.projectName}</div>
                    <div className="num text-[10.5px] text-muted-foreground">
                      {record.projectId} · {record.district}, {record.state}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 px-4 py-3">
              <div>
                <label
                  htmlFor="objection-type"
                  className="text-[11px] font-semibold text-foreground"
                >
                  Objection Type
                </label>
                <select
                  id="objection-type"
                  value={objectionType}
                  onChange={(e) => setObjectionType(e.target.value as ObjectionType)}
                  className="mt-1 w-full rounded-[4px] border border-border bg-card px-2 py-1.5 text-[12px] font-medium text-foreground"
                >
                  {OBJECTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="objection-description"
                  className="text-[11px] font-semibold text-foreground"
                >
                  Detailed Description
                </label>
                <Textarea
                  id="objection-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Describe the grievance with survey details, dates and the relief sought…"
                  className="mt-1 text-[12px]"
                />
              </div>

              <div>
                <label htmlFor="evidence-url" className="text-[11px] font-semibold text-foreground">
                  Evidence URL (optional)
                </label>
                <Input
                  id="evidence-url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://… link to a supporting record"
                  className="mt-1 text-[12px]"
                />
              </div>

              <div>
                <div className="text-[11px] font-semibold text-foreground">
                  Attach Supporting Document (optional)
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <FileUp className="size-3.5" />
                    Choose file
                  </button>
                  {evidenceFile ? (
                    <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Check className="size-3 text-status-ok" />
                      <span className="truncate">{evidenceFile.name}</span>
                      <button
                        type="button"
                        aria-label="Remove attachment"
                        onClick={() => {
                          setEvidenceFile(null);
                          if (fileInput.current) fileInput.current.value = "";
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ) : (
                    <span className="text-[10.5px] text-muted-foreground">
                      PDF/image/scan up to 10 MB
                    </span>
                  )}
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <button
                type="submit"
                disabled={submitObjection.isPending || !record}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-[4px] bg-status-info px-3 py-2 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitObjection.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Gavel className="size-3.5" />
                )}
                {submitObjection.isPending ? "Filing objection…" : "Submit Objection"}
              </button>

              <p className="flex items-start gap-1.5 text-[10.5px] leading-snug text-muted-foreground">
                <AlertTriangle className="mt-[1px] size-3 shrink-0" />
                Filed objections enter the LAO's Objection Management queue with a 15-day statutory
                SLA under the RFCTLARR Act, 2013.
              </p>
            </form>
          </section>

          {/* Filed objections */}
          <section className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="label-xs">
                Filed Objections — Sy. No. {detail.data?.khasraNo ?? "—"}
              </div>
              <span className="num text-[10.5px] text-muted-foreground">
                {objections.data?.count ?? 0} record(s)
              </span>
            </div>

            {objections.isLoading && (
              <div className="mt-2 space-y-2">
                <div className="shimmer h-24 w-full" />
                <div className="shimmer h-24 w-full" />
              </div>
            )}

            {!objections.isLoading && list.length === 0 && (
              <div className="panel mt-2 grid min-h-[160px] place-items-center p-6 text-center">
                <div>
                  <div className="label-xs">No objections on record</div>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    No objection has been filed against this parcel yet. Use the form to raise one.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-2 space-y-2">
              {list.map((objection) => (
                <ObjectionCard key={objection.id} objection={objection} />
              ))}
            </div>
          </section>
        </div>
      )}
    </LandownerPortalShell>
  );
}
