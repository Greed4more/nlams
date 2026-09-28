import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import type { ApprovedProject } from "@/hooks/useFinance";
import { FinancialStatusBadge, LaoApprovedBadge, MetaRow } from "./bits";

export function ApprovedProjectCard({ project }: { project: ApprovedProject }) {
  return (
    <article className="panel flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[15.5px] font-semibold leading-snug text-foreground">
            {project.projectName}
          </h2>
          <div className="num mt-0.5 font-mono text-[11px] text-muted-foreground">
            Project ID: {project.id}
          </div>
        </div>
        <FinancialStatusBadge status={project.financialStatus} />
      </div>

      <div className="mt-3 space-y-1.5 border-t border-border pt-3">
        <MetaRow label="Agency" value={project.requiringBody} />
        <MetaRow
          label="State / District"
          value={
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3 text-muted-foreground" />
              {project.state} · {project.district}
            </span>
          }
        />
        <MetaRow
          label="Required Land"
          value={`${project.requiredLandAcres.toFixed(2)} acres (${project.requiredLandHa.toFixed(2)} Ha)`}
        />
        <MetaRow
          label="Affected Landowners"
          value={String(project.affectedLandowners)}
          tone="strong"
        />
        <div className="flex items-center justify-between gap-4 pt-0.5">
          <span className="text-[12px] text-muted-foreground">LAO Status</span>
          <LaoApprovedBadge />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[12px] text-muted-foreground">Financial Status</span>
          <FinancialStatusBadge status={project.financialStatus} />
        </div>
        {project.financialAssessment && (
          <MetaRow
            label="Total Liability"
            value={`₹${(project.financialAssessment.totalCompensation / 1_00_000).toFixed(2)} Lakhs`}
            tone="strong"
          />
        )}
      </div>

      <Link
        to="/approved-projects/$id"
        params={{ id: project.id }}
        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[4px] bg-status-info text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
      >
        View Project
        <ArrowRight className="size-3.5" />
      </Link>
    </article>
  );
}
