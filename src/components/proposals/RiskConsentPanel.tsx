import { useState } from "react";
import { toast } from "sonner";
import { AlertOctagon, Loader2, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { useRiskQuery, useUpdateConsentMutation } from "@/hooks/useRisk";
import { useRole, NO_CREDENTIALS_HINT } from "@/context/RoleContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

const TIER_TONE: Record<string, string> = {
  LOW: "border-status-ok/30 bg-status-ok/10 text-status-ok",
  MEDIUM: "border-status-warn/30 bg-status-warn/10 text-status-warn",
  HIGH: "border-status-critical/30 bg-status-critical/10 text-status-critical",
};

const FEATURE_LABEL: Record<string, string> = {
  multi_crop_irrigated_flag: "Multi-crop irrigated land",
  consent_percentage_collected: "SIA public consent collected",
  valuation_gap_pct: "Market/compensation valuation gap",
  is_landbank_parcel: "Government land-bank parcel",
  sla_overrun_flag: "SLA overrun on current stage",
};

/** Module 5 — explainable litigation & delay risk score, plus the SIA consent % that drives it. */
export function RiskConsentPanel({ proposalId }: { proposalId: string }) {
  const { data: risk, isLoading, isError } = useRiskQuery(proposalId);
  const { canAct } = useRole();
  const updateConsent = useUpdateConsentMutation(proposalId);
  const [consentInput, setConsentInput] = useState("");

  const handleUpdateConsent = () => {
    const value = Number(consentInput);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      toast.error("Enter a consent percentage between 0 and 100");
      return;
    }
    updateConsent.mutate(value, {
      onSuccess: () => {
        toast.success("Consent recorded, risk re-scored");
        setConsentInput("");
      },
      onError: (err) => {
        toast.error("Could not update consent", {
          description: err instanceof ApiError ? err.message : "Unknown error",
        });
      },
    });
  };

  return (
    <section className="panel px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="label-xs">Litigation &amp; Delay Risk</div>
        {risk && (
          <span
            className={cn(
              "num inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 text-[12px] font-semibold",
              TIER_TONE[risk.riskTier],
            )}
          >
            {risk.riskTier === "HIGH" && <AlertOctagon className="size-3.5" />}
            {risk.riskScore.toFixed(0)}% · {risk.riskTier}
          </span>
        )}
      </div>

      {isLoading && <div className="shimmer mt-2 h-4 w-2/3" />}
      {isError && !isLoading && (
        <p className="mt-2 text-[12px] text-muted-foreground">
          Risk score unavailable — the ml_service microservice may be offline.
        </p>
      )}

      {risk && (
        <div className="mt-2.5 space-y-1.5">
          {risk.topContributingFactors.slice(0, 3).map((f) => (
            <div key={f.feature} className="flex items-center gap-2 text-[11px]">
              <span className="w-40 shrink-0 truncate text-muted-foreground">
                {FEATURE_LABEL[f.feature] ?? f.feature}
              </span>
              <div className="h-[5px] flex-1 rounded-[2px] bg-border">
                <div
                  className="h-full rounded-[2px] bg-navy"
                  style={{ width: `${Math.round(f.importance * 100)}%` }}
                />
              </div>
              <span className="num w-9 shrink-0 text-right text-muted-foreground">
                {Math.round(f.importance * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <Input
          type="number"
          min={0}
          max={100}
          placeholder="SIA consent %"
          value={consentInput}
          onChange={(e) => setConsentInput(e.target.value)}
          disabled={!canAct}
          className="h-8 max-w-[140px] text-[12px]"
        />
        {canAct ? (
          <button
            type="button"
            disabled={updateConsent.isPending || !consentInput}
            onClick={handleUpdateConsent}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-border px-2 py-1.5 text-[11px] font-medium text-foreground/80 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updateConsent.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCcw className="size-3.5" />
            )}
            Record &amp; Rescore
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[11px] text-muted-foreground">{NO_CREDENTIALS_HINT}</span>
            </TooltipTrigger>
            <TooltipContent side="top">{NO_CREDENTIALS_HINT}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </section>
  );
}
