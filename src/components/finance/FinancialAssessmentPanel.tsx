import { useState } from "react";
import {
  AlertTriangle,
  BadgeIndianRupee,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import type { Proposal } from "@/data/mockData";
import { formatINRFull } from "@/data/mockData";
import { useRole } from "@/context/RoleContext";
import { ApiError } from "@/lib/api";
import { formatLakhs, type FinancialAssessment } from "@/hooks/useFinance";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ApprovalDialog } from "./ApprovalDialog";

function SummaryTile({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("rounded-[5px] border border-border p-3", strong && "bg-ink text-white")}>
      <div
        className={cn(
          "text-[10.5px] font-semibold uppercase tracking-wide",
          strong ? "text-white/70" : "text-muted-foreground",
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "num mt-1 text-[15px] font-semibold",
          strong ? "text-white" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function FinancialAssessmentPanel({
  proposal,
  assessment,
  isFetching,
  error,
  engineRun,
  onRun,
  onRefresh,
}: {
  proposal: Proposal;
  assessment: FinancialAssessment | undefined;
  isFetching: boolean;
  error: unknown;
  engineRun: boolean;
  onRun: () => void;
  onRefresh: () => void;
}) {
  const { role } = useRole();
  const [approvalOpen, setApprovalOpen] = useState(false);
  const canApprove = role === "FINANCE_OFFICER";
  const persisted = assessment?.persisted === true;

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-status-info" />
          <div>
            <div className="label-xs">Automatic Compensation Calculation</div>
            <div className="text-[11px] text-muted-foreground">
              Sec. 26–30 RFCTLARR Act 2013 · market value → First Schedule multiplier → assets →
              solatium → 12% interest
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {assessment && (
            <span className="num rounded-[4px] border border-border bg-muted/50 px-2 py-1 text-[10.5px] text-muted-foreground">
              engine {assessment.landRulesVersion}
            </span>
          )}
          {engineRun ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isFetching ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Recompute
            </button>
          ) : (
            <Button type="button" size="sm" onClick={onRun} className="h-7 text-[11.5px]">
              <Sparkles className="size-3.5" />
              Run Automatic Compensation Calculation
            </Button>
          )}
        </div>
      </div>

      {!engineRun && (
        <div className="px-4 py-10 text-center">
          <BadgeIndianRupee className="mx-auto size-8 text-muted-foreground/50" />
          <div className="mt-2 text-[14px] font-semibold text-foreground">
            Compensation liability not yet computed
          </div>
          <p className="mx-auto mt-1 max-w-xl text-[12px] leading-relaxed text-muted-foreground">
            The engine reads every affected parcel's survey extent, classification and the{" "}
            {proposal.state} land-rate tables, applies the First Schedule rural multiplier, values
            attached assets, adds 100% solatium and statutory interest, and produces the beneficiary
            payout schedule for review.
          </p>
          <Button type="button" onClick={onRun} className="mt-4">
            <Sparkles className="size-4" />
            Run Automatic Compensation Calculation
          </Button>
        </div>
      )}

      {engineRun && isFetching && !assessment && (
        <div className="space-y-3 p-4">
          <div className="shimmer h-16 w-full" />
          <div className="shimmer h-40 w-full" />
        </div>
      )}

      {engineRun && !!error && (
        <div className="flex items-start gap-2.5 p-4 text-[12.5px] text-status-critical">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <div className="font-semibold">Unable to compute the compensation assessment</div>
            <div className="mt-0.5 text-muted-foreground">
              {error instanceof ApiError
                ? error.message
                : "The compensation engine did not return a result for this project."}
            </div>
          </div>
        </div>
      )}

      {assessment && (
        <div>
          {persisted && (
            <div className="flex flex-wrap items-center gap-2 border-b border-status-ok/25 bg-status-ok/10 px-4 py-2.5 text-[12px] text-status-ok">
              <CheckCircle2 className="size-4 shrink-0" />
              <span className="font-semibold">Financial clearance</span>
              <span className="num font-mono">{assessment.referenceNumber}</span>
              <span className="text-status-ok/80">
                approved
                {assessment.approvedAt
                  ? ` on ${new Date(assessment.approvedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}`
                  : ""}{" "}
                {assessment.approvedBy ? `by ${assessment.approvedBy.name}` : ""} — forwarded to the
                District Officer for final award execution and disbursement.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 xl:grid-cols-5">
            <SummaryTile
              label="Land Compensation"
              value={formatINRFull(assessment.totals.landValue)}
            />
            <SummaryTile
              label="Assets — Sec. 29"
              value={formatINRFull(assessment.totals.assetValue)}
            />
            <SummaryTile
              label="Solatium — 100%"
              value={formatINRFull(assessment.totals.solatium)}
            />
            <SummaryTile
              label="Interest — 12% p.a."
              value={formatINRFull(assessment.totals.interest)}
            />
            <SummaryTile
              label="Total Liability"
              value={formatLakhs(assessment.totals.totalCompensation)}
              strong
            />
          </div>

          <div className="border-t border-border">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
              <div>
                <div className="label-xs">Compensation Beneficiaries</div>
                <div className="text-[11px] text-muted-foreground">
                  {assessment.beneficiaryCount} beneficiaries · {assessment.totalAreaHa.toFixed(2)}{" "}
                  Ha · notification{" "}
                  {new Date(assessment.notificationDate).toLocaleDateString("en-IN")} → award{" "}
                  {new Date(assessment.awardDate).toLocaleDateString("en-IN")}
                </div>
              </div>
              <div className="num text-right text-[12px]">
                <div className="font-semibold text-foreground">
                  {formatINRFull(assessment.totals.totalCompensation)}
                </div>
                <div className="text-[10.5px] text-muted-foreground">
                  {formatLakhs(assessment.totals.totalCompensation)}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border-t border-border">
              <table className="w-full border-collapse text-[12.5px]">
                <thead className="bg-muted/50">
                  <tr>
                    {[
                      "#",
                      "Beneficiary / Survey No.",
                      "Extent",
                      "Zone",
                      "Market Rate ₹/Ha",
                      "Factor",
                      "Land Value",
                      "Assets",
                      "Solatium",
                      "Interest",
                      "Total Payout",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "label-xs whitespace-nowrap border-b border-border px-2.5 py-2 text-left",
                          i >= 4 && "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assessment.beneficiaries.map((b, i) => (
                    <tr
                      key={b.parcelId}
                      className="border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="num px-2.5 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-2.5 py-2">
                        <div className="font-medium text-foreground">{b.ownerName}</div>
                        <div className="num font-mono text-[10.5px] text-muted-foreground">
                          Sy. No. {b.surveyNo} · {b.ulpin}
                          {b.coOwners > 0 ? ` · +${b.coOwners} co-owners` : ""}
                        </div>
                      </td>
                      <td className="num whitespace-nowrap px-2.5 py-2">
                        {b.areaHa.toFixed(2)} Ha
                        <div className="text-[10.5px] text-muted-foreground">
                          {b.areaAcres.toFixed(2)} Ac
                        </div>
                      </td>
                      <td className="px-2.5 py-2">
                        <span
                          className={cn(
                            "rounded-[4px] border px-1.5 py-0.5 text-[10px] font-semibold",
                            b.classification === "URBAN"
                              ? "border-status-info/30 bg-status-info/10 text-status-info"
                              : "border-status-ok/30 bg-status-ok/10 text-status-ok",
                          )}
                        >
                          {b.classification === "URBAN" ? "Urban" : "Rural"}
                        </span>
                        {b.classification === "RURAL" && (
                          <div className="text-[10px] text-muted-foreground">
                            {b.distanceFromUrbanKm.toFixed(1)} km
                          </div>
                        )}
                      </td>
                      <td className="num whitespace-nowrap px-2.5 py-2 text-right">
                        {formatINRFull(b.marketValuePerHa)}
                      </td>
                      <td className="num whitespace-nowrap px-2.5 py-2 text-right">
                        ×{b.multiplier.toFixed(2)}
                      </td>
                      <td className="num whitespace-nowrap px-2.5 py-2 text-right">
                        {formatINRFull(b.landValue)}
                      </td>
                      <td className="num whitespace-nowrap px-2.5 py-2 text-right">
                        {formatINRFull(b.assetValue)}
                      </td>
                      <td className="num whitespace-nowrap px-2.5 py-2 text-right">
                        {formatINRFull(b.solatium)}
                      </td>
                      <td className="num whitespace-nowrap px-2.5 py-2 text-right">
                        {formatINRFull(b.interest)}
                      </td>
                      <td className="num whitespace-nowrap px-2.5 py-2 text-right font-semibold">
                        {formatINRFull(b.totalCompensation)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-muted/60 font-semibold">
                    <td className="px-2.5 py-2 text-[11.5px]" colSpan={6}>
                      Total — {assessment.beneficiaryCount} beneficiaries
                    </td>
                    <td className="num px-2.5 py-2 text-right text-[11.5px]">
                      {formatINRFull(assessment.totals.landValue)}
                    </td>
                    <td className="num px-2.5 py-2 text-right text-[11.5px]">
                      {formatINRFull(assessment.totals.assetValue)}
                    </td>
                    <td className="num px-2.5 py-2 text-right text-[11.5px]">
                      {formatINRFull(assessment.totals.solatium)}
                    </td>
                    <td className="num px-2.5 py-2 text-right text-[11.5px]">
                      {formatINRFull(assessment.totals.interest)}
                    </td>
                    <td className="num px-2.5 py-2 text-right text-[11.5px]">
                      {formatINRFull(assessment.totals.totalCompensation)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3">
            <p className="max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
              {persisted
                ? "This clearance is persisted against the project and cannot be re-approved. Any revision requires a fresh valuation through the statutory process."
                : "Review the beneficiary schedule, then approve the financial assessment. Approval persists the clearance and forwards the proposal to the District Officer."}
            </p>
            <Button
              type="button"
              disabled={persisted || !canApprove}
              title={
                !canApprove
                  ? "Requires Finance Officer credentials"
                  : persisted
                    ? "Financial clearance already approved"
                    : undefined
              }
              onClick={() => setApprovalOpen(true)}
            >
              {persisted ? <CheckCircle2 className="size-4" /> : <Send className="size-4" />}
              {persisted ? "Financial Clearance Approved" : "Approve Financial Assessment"}
            </Button>
          </div>
        </div>
      )}

      {assessment && (
        <ApprovalDialog
          proposal={proposal}
          assessment={assessment}
          open={approvalOpen}
          onOpenChange={setApprovalOpen}
        />
      )}
    </section>
  );
}
