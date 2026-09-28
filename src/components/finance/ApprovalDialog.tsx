import { Loader2, ShieldCheck, Send } from "lucide-react";
import { toast } from "sonner";
import type { Proposal } from "@/data/mockData";
import {
  useApproveFinancialAssessmentMutation,
  type FinancialAssessment,
} from "@/hooks/useFinance";
import { formatINRFull } from "@/data/mockData";
import { ApiError } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const lakhs = (value: number) =>
  `₹${(value / 1_00_000).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Lakhs`;

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={
        strong
          ? "flex items-baseline justify-between gap-4 border-t border-border pt-2.5"
          : "flex items-baseline justify-between gap-4"
      }
    >
      <span
        className={
          strong
            ? "text-[13px] font-semibold text-foreground"
            : "text-[12.5px] text-muted-foreground"
        }
      >
        {label}
      </span>
      <span
        className={
          strong
            ? "num text-[20px] font-bold text-ink"
            : "num text-[13px] font-medium text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Final confirmation of the Finance Officer's financial assessment: summarises
 * the total compensation liability, then persists the clearance, marks the
 * project financially approved and forwards it to the District Officer.
 */
export function ApprovalDialog({
  proposal,
  assessment,
  open,
  onOpenChange,
}: {
  proposal: Proposal;
  assessment: FinancialAssessment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const approve = useApproveFinancialAssessmentMutation(proposal.id);

  const confirm = () => {
    approve.mutate(undefined, {
      onSuccess: (result) => {
        toast.success("Financial assessment approved", {
          description:
            result.toStage != null
              ? `${result.assessment.referenceNumber} cleared — ${proposal.id} forwarded to the District Officer (${result.toStage}) for final execution.`
              : `${result.assessment.referenceNumber} cleared — forwarded to the District Officer with the financial sanction.`,
        });
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error("Could not approve financial assessment", {
          description: err instanceof ApiError ? err.message : "Unknown error",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !approve.isPending && onOpenChange(next)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[17px]">
            <ShieldCheck className="size-4 text-forest" />
            Approve Financial Assessment
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            {proposal.projectName} · <span className="num font-mono">{proposal.id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 rounded-[6px] border border-border bg-muted/30 p-3.5">
          <div className="label-xs">Compensation Liability Summary</div>
          <SummaryRow
            label="Beneficiaries"
            value={`${assessment.beneficiaryCount} affected landowners`}
          />
          <SummaryRow
            label="Land compensation (with First Schedule multiplier)"
            value={formatINRFull(assessment.totals.landValue)}
          />
          <SummaryRow
            label="Attached assets — Sec. 29"
            value={formatINRFull(assessment.totals.assetValue)}
          />
          <SummaryRow
            label="Solatium — 100% · Sec. 30(1)"
            value={formatINRFull(assessment.totals.solatium)}
          />
          <SummaryRow
            label="Statutory interest — 12% p.a. · Sec. 30(3)"
            value={formatINRFull(assessment.totals.interest)}
          />
          <SummaryRow
            label="Total Compensation Liability"
            value={lakhs(assessment.totals.totalCompensation)}
            strong
          />
        </div>

        <p className="text-[11.5px] leading-relaxed text-muted-foreground">
          Confirming persists financial clearance{" "}
          <span className="num font-mono text-foreground">{assessment.referenceNumber}</span>{" "}
          against this project, updates its financial status to <strong>Approved</strong>, and
          forwards the proposal to the District Officer for final award execution and compensation
          disbursement. The action is signed into the cryptographic audit vault.
        </p>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={approve.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={approve.isPending} onClick={confirm}>
            {approve.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Confirm &amp; Forward to District Officer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
