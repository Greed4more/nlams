import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/context/RoleContext";
import { useI18n } from "@/context/I18nContext";
import { getSlaStatus } from "@/lib/slaRules";
import { downloadCsv } from "@/lib/exportCsv";

const CSV_HEADERS = [
  "Proposal ID",
  "Project Name",
  "Requiring Body",
  "State",
  "District",
  "Stage",
  "SLA Status",
  "Days Elapsed in Stage",
  "Total Area (Ha)",
  "Affected Families",
  "Compensation Assessed (INR)",
  "Compensation Disbursed (INR)",
  "Compensation Pending (INR)",
];

export function MisExport() {
  const { scopedProposals, scopeLabel } = useRole();
  const { t } = useI18n();

  const exportCsv = () => {
    if (scopedProposals.length === 0) {
      toast.error("Nothing to export", { description: "No proposals in the current scope." });
      return;
    }
    const rows = scopedProposals.map((p) => {
      const sla = getSlaStatus(p);
      return [
        p.id,
        p.projectName,
        p.requiringBody,
        p.state,
        p.district,
        p.currentStage,
        sla.status,
        sla.daysElapsed,
        p.totalAreaHa,
        p.affectedFamilies,
        p.compensation.assessed,
        p.compensation.disbursed,
        p.compensation.pending,
      ];
    });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`nlams-mis-report-${stamp}.csv`, CSV_HEADERS, rows);
    toast.success("MIS report exported", {
      description: `${rows.length} proposals (${scopeLabel}) — nlams-mis-report-${stamp}.csv`,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={exportCsv}
        className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
      >
        <Download className="size-3.5" />
        {t("action.exportCsv")}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
      >
        <Printer className="size-3.5" />
        {t("action.print")}
      </button>
    </div>
  );
}
