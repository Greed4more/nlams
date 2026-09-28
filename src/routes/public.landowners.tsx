import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  MapPin,
  Search,
  Users,
  Layers,
  Satellite,
  Map as MapIcon,
} from "lucide-react";
import { LandownerPortalShell } from "@/components/public/LandownerPortalShell";
import {
  usePublicLandownerDetail,
  usePublicLandownerSearch,
  type LandownerRecord,
} from "@/hooks/usePublicPortal";
import { formatINRFull } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const LandownerParcelMap = lazy(() =>
  import("@/components/public/LandownerParcelMap").then((m) => ({
    default: m.LandownerParcelMap,
  })),
);

export const Route = createFileRoute("/public/landowners")({
  validateSearch: (search: Record<string, unknown>): { ulpin?: string } => ({
    ...(typeof search["ulpin"] === "string" ? { ulpin: search["ulpin"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Landowner Directory & Compensation — LAMS Public Portal" },
      {
        name: "description",
        content:
          "View affected landowner records, acquired parcel GIS mapping, statutory compensation breakdown and disbursement status.",
      },
    ],
  }),
  component: PublicLandownersPage,
});

function StatusBadge({ status }: { status: string }) {
  const approved = status === "APPROVED";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 text-[10.5px] font-semibold",
        approved
          ? "border-status-ok/30 bg-status-ok/10 text-status-ok"
          : "border-status-warn/30 bg-status-warn/10 text-status-warn",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {approved ? "Approved" : "In Progress"}
    </span>
  );
}

function LandownerCard({
  record,
  active,
  onSelect,
}: {
  record: LandownerRecord;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2.5 text-left transition-colors last:border-0",
        active ? "bg-status-info/[0.06]" : "hover:bg-muted/60",
      )}
    >
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold text-foreground">{record.ownerName}</div>
        <div className="num mt-0.5 truncate text-[10.5px] text-muted-foreground">
          Sy. No. {record.khasraNo} · {record.ulpin}
        </div>
        <div className="truncate text-[10.5px] text-muted-foreground">{record.projectName}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="num text-[11.5px] font-semibold">
          {record.acquiredAreaAcres.toFixed(2)} Ac
        </div>
        <div className="text-[10px] text-muted-foreground">{record.district}</div>
        <ChevronRight className="ml-auto mt-1 size-3.5 text-muted-foreground" />
      </div>
    </button>
  );
}

function PublicLandownersPage() {
  const { ulpin } = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showOsm, setShowOsm] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const search = usePublicLandownerSearch(query);
  const records = search.data?.landowners ?? [];
  const selectedUlpin = ulpin ?? records[0]?.ulpin;
  const detail = usePublicLandownerDetail(selectedUlpin);

  const select = (nextUlpin: string) => {
    void navigate({ to: "/public/landowners", search: { ulpin: nextUlpin } });
  };

  const record = detail.data;

  return (
    <LandownerPortalShell breadcrumb={["Landowner Directory & Compensation"]}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold leading-tight tracking-tight text-foreground">
            LANDOWNER DIRECTORY &amp; COMPENSATION
          </h1>
          <p className="mt-1 text-[12px] text-muted-foreground">
            View affected landowners, compensation records, acquired parcel mapping and disbursement
            status.
          </p>
        </div>
        <div className="relative min-w-[240px] flex-1 sm:max-w-[340px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ULPIN, Survey No., Project Code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 text-[12.5px]"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[320px_1fr]">
        {/* Directory */}
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div className="label-xs">Landowner Records</div>
            <span className="num text-[10.5px] text-muted-foreground">
              {records.length} records
            </span>
          </div>
          {search.isLoading && (
            <p className="px-3 py-6 text-center text-[12px] text-muted-foreground">
              Searching the land records register…
            </p>
          )}
          {!search.isLoading && records.length === 0 && (
            <p className="px-3 py-6 text-center text-[12px] text-muted-foreground">
              No landowner record matches “{query}”. Try a ULPIN, survey number or name.
            </p>
          )}
          <div className="max-h-[520px] overflow-y-auto">
            {records.map((r) => (
              <LandownerCard
                key={r.ulpin}
                record={r}
                active={r.ulpin === selectedUlpin}
                onSelect={() => select(r.ulpin)}
              />
            ))}
          </div>
        </section>

        {/* Record detail */}
        <div className="min-w-0 space-y-4">
          {!record && !detail.isLoading && (
            <div className="panel grid min-h-[200px] place-items-center p-8 text-center text-[13px] text-muted-foreground">
              Select a landowner record to view the parcel map and statutory compensation.
            </div>
          )}
          {detail.isLoading && <div className="shimmer h-[420px] w-full" />}

          {record && (
            <>
              <section className="panel border-l-4 border-l-status-info px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-status-info" />
                    <h2 className="text-[16px] font-semibold text-foreground">
                      Primary Landowner Record: {record.ownerName}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-[11.5px]">
                    <span className="text-muted-foreground">Compensation Status:</span>
                    <StatusBadge status={record.compensationStatus} />
                  </div>
                </div>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  Acquired landowner details &amp; parcel GIS mapping from the acquisition record.
                </p>

                <div className="mt-3 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <div className="text-[10.5px] text-muted-foreground">Landowner Name:</div>
                    <div className="text-[13px] font-semibold">{record.ownerName}</div>
                    <div className="text-[10.5px] text-muted-foreground">
                      Title Holder / Khatedar
                      {record.coOwners > 0 ? ` (+${record.coOwners} co-owners)` : ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] text-muted-foreground">Acquisition Project:</div>
                    <div className="text-[13px] font-semibold">{record.projectName}</div>
                    <div className="num text-[10.5px] text-muted-foreground">
                      {record.projectId} · {record.requiringBody}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] text-muted-foreground">
                      Acquired Parcel &amp; Location:
                    </div>
                    <div className="num text-[13px] font-semibold">
                      Sy. No. {record.khasraNo} (Parcel: {record.ulpin})
                    </div>
                    <div className="text-[10.5px] text-muted-foreground">
                      {record.district}, {record.state}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] text-muted-foreground">
                      Land Acquired Inside Parcel:
                    </div>
                    <div className="num text-[13px] font-semibold text-status-ok">
                      {record.acquiredAreaAcres.toFixed(3)} Acres
                    </div>
                    <div className="num text-[10.5px] text-muted-foreground">
                      Total Parcel Area: {record.totalParcelAreaAcres.toFixed(2)} Acres
                    </div>
                  </div>
                </div>
              </section>

              <section className="panel overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    <div className="label-xs">
                      GIS Map — Acquired Land Inside Parcel (Sy. No. {record.khasraNo})
                    </div>
                  </div>
                  <span className="hidden items-center gap-1 text-[10.5px] text-muted-foreground sm:flex">
                    <Layers className="size-3" />
                    High-Resolution Satellite Imagery (Esri World Imagery) with Layer Toggle
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setShowOsm(false)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      !showOsm
                        ? "border-status-info/40 bg-status-info/10 text-status-info"
                        : "border-border bg-card text-foreground hover:bg-muted",
                    )}
                  >
                    <Satellite className="size-3" />
                    Satellite imagery
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOsm(true)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      showOsm
                        ? "border-status-info/40 bg-status-info/10 text-status-info"
                        : "border-border bg-card text-foreground hover:bg-muted",
                    )}
                  >
                    <MapIcon className="size-3" />
                    OpenStreetMap
                  </button>
                  <label className="ml-1 flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={showLabels}
                      onChange={(e) => setShowLabels(e.target.checked)}
                      className="size-3.5 accent-[#1d4ed8]"
                    />
                    Survey No. Labels
                  </label>
                  <Link
                    to="/public/rr"
                    search={{ ulpin: record.ulpin }}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-[4px] bg-status-info px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Track R&amp;R
                    <ChevronRight className="size-3" />
                  </Link>
                </div>
                {mounted ? (
                  <Suspense fallback={<div className="shimmer h-[440px] w-full" />}>
                    <LandownerParcelMap
                      geometry={record.geometry}
                      ulpin={record.ulpin}
                      surveyNo={record.khasraNo}
                      district={record.district}
                      acquiredAcres={record.acquiredAreaAcres}
                      totalAcres={record.totalParcelAreaAcres}
                      ownerName={record.ownerName}
                      showOsm={showOsm}
                      showLabels={showLabels}
                    />
                  </Suspense>
                ) : (
                  <div className="shimmer h-[440px] w-full" />
                )}
              </section>

              <section className="panel overflow-hidden">
                <div className="border-b border-border px-4 py-2.5">
                  <div className="label-xs">
                    Statutory Compensation Breakdown — RFCTLARR Act, 2013
                  </div>
                </div>
                <table className="w-full border-collapse text-[13px]">
                  <tbody>
                    {(
                      [
                        [
                          "Base Land Value (Sec. 26 market value)",
                          record.compensation.baseLandValue,
                          "Assessed market value of the acquired extent",
                        ],
                        [
                          "Solatium — 100% (Sec. 30(1))",
                          record.compensation.solatium,
                          "Statutory 100% addition to market value",
                        ],
                        [
                          `Interest for period (Sec. 30(3), ${record.compensation.interestRatePercent}% p.a.)`,
                          record.compensation.interestAmount,
                          "Interest on delayed award proceedings",
                        ],
                        [
                          "Rehabilitation & Resettlement Allowance",
                          record.compensation.rrAllowance,
                          "Schedule II entitlements (housing, shifting, subsistence, training)",
                        ],
                      ] as const
                    ).map(([label, value, note]) => (
                      <tr key={label} className="border-b border-border last:border-0">
                        <td className="px-4 py-2">
                          <div className="font-medium text-foreground">{label}</div>
                          <div className="text-[10.5px] text-muted-foreground">{note}</div>
                        </td>
                        <td className="num whitespace-nowrap px-4 py-2 text-right font-semibold">
                          {formatINRFull(value)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-ink/60 bg-muted/50">
                      <td className="px-4 py-2.5">
                        <div className="text-[13px] font-bold">
                          Total Allocated Payout (Land Compensation + R&amp;R)
                        </div>
                        <div className="num text-[10.5px] text-muted-foreground">
                          Land compensation{" "}
                          {formatINRFull(record.compensation.totalLandCompensation)} + R&amp;R
                          allowance {formatINRFull(record.compensation.rrAllowance)}
                        </div>
                      </td>
                      <td className="num px-4 py-2.5 text-right text-[15px] font-bold">
                        {formatINRFull(record.compensation.totalAllocated)}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="border-t border-border bg-muted/40 px-4 py-2 text-[10.5px] leading-snug text-muted-foreground">
                  {record.notice}
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </LandownerPortalShell>
  );
}
