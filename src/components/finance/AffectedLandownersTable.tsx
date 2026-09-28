import { Link } from "@tanstack/react-router";
import { Calculator, MapPin } from "lucide-react";
import type { Proposal } from "@/data/mockData";
import { formatINRFull } from "@/data/mockData";
import type { FinancialAssessment } from "@/hooks/useFinance";
import { ACRES_PER_HECTARE } from "@/lib/landMetrics";
import { cn } from "@/lib/utils";

/**
 * Affected Landowners register for the Finance Officer workspace — survey
 * numbers, plot extents, market rates from the automatic assessment, and
 * per-parcel valuation links.
 */
export function AffectedLandownersTable({
  proposal,
  assessment,
  selectedUlpin,
  onSelectUlpin,
}: {
  proposal: Proposal;
  assessment: FinancialAssessment | null | undefined;
  selectedUlpin: string | null;
  onSelectUlpin: (ulpin: string | null) => void;
}) {
  const byParcelId = new Map(assessment?.beneficiaries.map((b) => [b.parcelId, b]) ?? []);
  const rows = proposal.parcels;

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div>
          <div className="label-xs">Affected Landowners</div>
          <div className="text-[11px] text-muted-foreground">
            Survey numbers, plot extents and market rates per beneficiary — select a row to locate
            it on the acquisition map.
          </div>
        </div>
        <div className="num text-[11px] text-muted-foreground">
          {rows.length} affected landowners · {proposal.totalAreaHa.toFixed(2)} Ha
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead className="bg-muted/50">
            <tr>
              {[
                "Survey No.",
                "Extent",
                "Classification",
                "Landowner",
                "Market Rate (₹/Ha)",
                "Land Value",
                "Total Payout",
                "Valuation",
              ].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "label-xs whitespace-nowrap border-b border-border px-3 py-2 text-left",
                    (i === 4 || i === 5 || i === 6) && "text-right",
                    i === 7 && "text-right",
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const valuation = byParcelId.get(p.id);
              const selected = selectedUlpin === p.ulpin;
              return (
                <tr
                  key={p.ulpin}
                  onClick={() => onSelectUlpin(selected ? null : p.ulpin)}
                  className={cn(
                    "cursor-pointer border-b border-border last:border-0",
                    selected ? "bg-status-info/5" : "hover:bg-muted/50",
                  )}
                >
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="num font-mono text-[12px] font-medium">{p.khasraNo}</div>
                    <div className="text-[10.5px] text-muted-foreground">
                      {p.vernacularTerm.script} · {p.vernacularTerm.standard}
                    </div>
                  </td>
                  <td className="num whitespace-nowrap px-3 py-2">
                    {p.areaHa.toFixed(2)} Ha
                    <div className="text-[10.5px] text-muted-foreground">
                      {(p.areaHa * ACRES_PER_HECTARE).toFixed(2)} acres
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "rounded-[4px] border px-1.5 py-0.5 text-[10.5px] font-semibold",
                        p.classification === "URBAN"
                          ? "border-status-info/30 bg-status-info/10 text-status-info"
                          : "border-status-ok/30 bg-status-ok/10 text-status-ok",
                      )}
                    >
                      {p.classification === "URBAN" ? "Urban" : "Rural"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="whitespace-nowrap font-medium">{p.ownerName}</div>
                    <div className="num font-mono text-[10.5px] text-muted-foreground">
                      {p.ulpin}
                    </div>
                  </td>
                  <td className="num whitespace-nowrap px-3 py-2 text-right">
                    {valuation ? formatINRFull(valuation.marketValuePerHa) : "—"}
                    {valuation && (
                      <div className="text-[10.5px] text-muted-foreground">
                        circle {formatINRFull(valuation.circleRatePerHa)}
                      </div>
                    )}
                  </td>
                  <td className="num whitespace-nowrap px-3 py-2 text-right">
                    {valuation ? formatINRFull(valuation.landValue) : "—"}
                    {valuation && (
                      <div className="text-[10.5px] text-muted-foreground">
                        ×{valuation.multiplier.toFixed(2)} factor
                      </div>
                    )}
                  </td>
                  <td className="num whitespace-nowrap px-3 py-2 text-right font-semibold">
                    {valuation ? formatINRFull(valuation.totalCompensation) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2 text-muted-foreground">
                      <Link
                        to="/calculator"
                        search={{ ulpin: p.ulpin }}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Open valuation for survey no. ${p.khasraNo}`}
                        title="Open valuation workspace"
                        className="text-[11px] font-medium text-status-info hover:underline"
                      >
                        <Calculator className="mr-1 inline size-3.5" />
                        Valuation
                      </Link>
                      <Link
                        to="/map-view"
                        search={{ ulpin: p.ulpin, proposal: proposal.id }}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Locate ${p.ulpin} on the GIS map`}
                        title="Locate on map"
                        className="transition-colors hover:text-foreground"
                      >
                        <MapPin className="size-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-6 text-center text-[12.5px] text-muted-foreground"
                >
                  No affected landowner records are attached to this project yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
