import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Copy, Check, MapPin, Calculator } from "lucide-react";
import type { Proposal } from "@/data/mockData";
import { formatINRFull } from "@/data/mockData";
import { cn } from "@/lib/utils";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      className="text-muted-foreground transition-colors hover:text-foreground"
      onClick={() => {
        void navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
    >
      {copied ? <Check className="size-3 text-status-ok" /> : <Copy className="size-3" />}
    </button>
  );
}

export function ParcelsTable({ proposal }: { proposal: Proposal }) {
  const totalArea = proposal.parcels.reduce((s, p) => s + p.areaHa, 0);
  const totalAssessed = proposal.parcels.reduce((s, p) => s + p.compensationAssessed, 0);
  const totalDisbursed = proposal.parcels.reduce((s, p) => s + p.compensationDisbursed, 0);

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="label-xs">Land Parcels</div>
        <div className="num text-[11px] text-muted-foreground">
          {proposal.parcels.length} parcels
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead className="bg-muted/50">
            <tr>
              {["ULPIN", "Khasra / Survey No.", "Classification", "Area (Ha)", "Zone", "Owner", "Compensation"].map(
                (h, i) => (
                  <th
                    key={h}
                    className={cn(
                      "label-xs whitespace-nowrap border-b border-border px-3 py-2 text-left",
                      i === 3 && "text-right",
                    )}
                  >
                    {h}
                  </th>
                ),
              )}
              <th className="label-xs w-16 whitespace-nowrap border-b border-border px-3 py-2 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {proposal.parcels.map((p) => {
              const pct = p.compensationAssessed
                ? Math.round((p.compensationDisbursed / p.compensationAssessed) * 100)
                : 0;
              return (
                <tr key={p.ulpin} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="num font-mono text-[12px]">{p.ulpin}</span>
                      <CopyButton value={p.ulpin} label="ULPIN" />
                    </span>
                  </td>
                  <td className="num whitespace-nowrap px-3 py-2 font-mono text-[12px]">
                    {p.khasraNo}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-[13px] font-medium text-foreground">
                      {p.vernacularTerm.script}
                    </div>
                    <div className="text-[10.5px] text-muted-foreground">
                      {p.vernacularTerm.standard}
                    </div>
                  </td>
                  <td className="num whitespace-nowrap px-3 py-2 text-right">
                    {p.areaHa.toFixed(2)}
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
                    <div className="whitespace-nowrap">{p.ownerName}</div>
                    {p.coOwners > 0 && (
                      <span className="mt-0.5 inline-block rounded-[3px] bg-muted px-1.5 py-[1px] text-[10.5px] text-muted-foreground">
                        +{p.coOwners} co-owners
                      </span>
                    )}
                  </td>
                  <td className="min-w-[150px] px-3 py-2">
                    <div className="num flex items-baseline justify-between gap-2 text-[11px]">
                      <span className="text-foreground">{formatINRFull(p.compensationDisbursed)}</span>
                      <span className="text-muted-foreground">
                        / {formatINRFull(p.compensationAssessed)}
                      </span>
                    </div>
                    <div className="mt-1 h-[4px] w-full rounded-[2px] bg-border">
                      <div
                        className={cn(
                          "h-full rounded-[2px]",
                          pct >= 100 ? "bg-status-ok" : pct > 0 ? "bg-status-warn" : "bg-status-critical",
                        )}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2 text-muted-foreground">
                      <Link
                        to="/map-view"
                        search={{ ulpin: p.ulpin }}
                        aria-label={`Locate ${p.ulpin} on map`}
                        title="Locate on map"
                        className="transition-colors hover:text-foreground"
                      >
                        <MapPin className="size-3.5" />
                      </Link>
                      <Link
                        to="/calculator"
                        search={{ ulpin: p.ulpin }}
                        aria-label={`Compute compensation for ${p.ulpin}`}
                        title="Compensation calculator"
                        className="transition-colors hover:text-foreground"
                      >
                        <Calculator className="size-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/60 font-semibold">
              <td className="px-3 py-2 text-[12px]" colSpan={3}>
                Total
              </td>
              <td className="num px-3 py-2 text-right">{totalArea.toFixed(2)}</td>
              <td />
              <td className="num px-3 py-2 text-[12px] text-muted-foreground">
                {proposal.affectedFamilies} families
              </td>
              <td className="num px-3 py-2 text-[11px]">
                {formatINRFull(totalDisbursed)}{" "}
                <span className="font-normal text-muted-foreground">
                  / {formatINRFull(totalAssessed)}
                </span>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
