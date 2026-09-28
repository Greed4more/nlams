import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeIndianRupee, CheckCircle2, Clock, FolderSearch, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApprovedProjectCard } from "@/components/finance/ApprovedProjectCard";
import { useApprovedProjectsQuery } from "@/hooks/useFinance";
import { formatINR } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/approved-projects/")({
  head: () => ({
    meta: [
      { title: "Approved Projects & Disbursement — BHUMITRA" },
      {
        name: "description",
        content:
          "Financial sanctions, LAO approved projects, e-Kuber treasury integrations and compensation DBT clearances.",
      },
    ],
  }),
  component: ApprovedProjectsPage,
});

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof BadgeIndianRupee;
  tone: string;
}) {
  return (
    <div className="panel relative overflow-hidden px-4 py-3">
      <span className={cn("absolute inset-y-0 left-0 w-[3px]", tone)} />
      <div className="flex items-center justify-between gap-2">
        <div className="label-xs">{label}</div>
        <Icon className="size-4 text-muted-foreground/70" />
      </div>
      <div className="num mt-2 text-[24px] font-semibold leading-none text-foreground">{value}</div>
    </div>
  );
}

function ApprovedProjectsPage() {
  const { data, isLoading, isError, error } = useApprovedProjectsQuery();
  const [query, setQuery] = useState("");
  const projects = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter((p) =>
      [p.projectName, p.id, p.state, p.district, p.requiringBody, ...p.surveyNumbers, ...p.ulpins]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [projects, query]);

  const pending = projects.filter((p) => p.financialStatus === "PENDING").length;
  const cleared = projects.filter((p) => p.financialStatus === "APPROVED");
  const clearedLiability = cleared.reduce(
    (s, p) => s + (p.financialAssessment?.totalCompensation ?? 0),
    0,
  );

  return (
    <AppShell breadcrumb={["Home", "Compensation Management", "Approved Projects & Disbursement"]}>
      <PageHeader
        title="Approved Projects & Disbursement"
        subtitle="Financial sanctions, LAO approved projects, e-Kuber treasury integrations, and compensation DBT."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="LAO Approved Projects"
          value={String(projects.length)}
          icon={FolderSearch}
          tone="bg-ink"
        />
        <Kpi
          label="Pending Financial Clearance"
          value={String(pending)}
          icon={Clock}
          tone="bg-status-warn"
        />
        <Kpi
          label="Financial Clearances Approved"
          value={String(cleared.length)}
          icon={CheckCircle2}
          tone="bg-status-ok"
        />
        <Kpi
          label="Cleared Compensation Liability"
          value={formatINR(clearedLiability)}
          icon={BadgeIndianRupee}
          tone="bg-status-info"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search approved projects, project code, survey no. or ULPIN…"
            className="h-9 rounded-[4px] pl-8 text-[13px]"
            aria-label="Search approved projects"
          />
        </div>
        <div className="text-[11.5px] text-muted-foreground">
          {filtered.length} of {projects.length} projects
        </div>
      </div>

      {isLoading && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-[300px] w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div className="panel mt-3 p-6 text-center text-[13px] text-status-critical">
          Could not load the approved projects register.
          <div className="mt-1 text-[11.5px] text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="panel mt-3 grid min-h-[220px] place-items-center p-8 text-center">
          <div>
            <div className="label-xs">No matching projects</div>
            <p className="mt-2 text-[12.5px] text-muted-foreground">
              {projects.length === 0
                ? "No proposals have been approved by the Land Acquisition Authority in your scope yet."
                : "No approved project matches this search. Try a project code, survey number or district."}
            </p>
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {!isLoading &&
          filtered.map((project) => <ApprovedProjectCard key={project.id} project={project} />)}
      </div>
    </AppShell>
  );
}
