import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useGrievancesQuery } from "@/hooks/useGrievances";
import { useRole, NO_CREDENTIALS_HINT } from "@/context/RoleContext";
import { SubmitGrievanceDialog } from "@/components/grievances/SubmitGrievanceDialog";
import { ResolveGrievanceDialog } from "@/components/grievances/ResolveGrievanceDialog";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/grievances")({
  head: () => ({
    meta: [
      { title: "Grievances — BHUMITRA" },
      {
        name: "description",
        content: "Land-title and parcel correction grievance tickets, 15-day statutory SLA.",
      },
    ],
  }),
  component: GrievancesPage,
});

const STATUS_TONE: Record<string, string> = {
  SUBMITTED: "border-status-info/30 bg-status-info/10 text-status-info",
  UNDER_REVIEW: "border-status-warn/30 bg-status-warn/10 text-status-warn",
  FIELD_VERIFICATION: "border-status-warn/30 bg-status-warn/10 text-status-warn",
  RESOLVED: "border-status-ok/30 bg-status-ok/10 text-status-ok",
  REJECTED: "border-status-critical/30 bg-status-critical/10 text-status-critical",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function GrievancesPage() {
  const { data, isLoading } = useGrievancesQuery();
  const { canAct } = useRole();

  return (
    <AppShell breadcrumb={["Home", "Grievances"]}>
      <PageHeader
        title="Grievances"
        subtitle="Land-title and parcel correction tickets, 15-day statutory SLA"
        actions={<SubmitGrievanceDialog />}
      />

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead className="bg-muted/50">
              <tr>
                {["Ticket", "Proposal", "Issue", "Status", "SLA Deadline", "Submitted"].map((h) => (
                  <th
                    key={h}
                    className="label-xs whitespace-nowrap border-b border-border px-3 py-2 text-left"
                  >
                    {h}
                  </th>
                ))}
                <th className="label-xs w-24 border-b border-border px-3 py-2 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-3 py-2">
                      <div className="shimmer h-5 w-full" />
                    </td>
                  </tr>
                ))}
              {!isLoading && data?.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-[12px] text-muted-foreground"
                  >
                    No grievance tickets in scope.
                  </td>
                </tr>
              )}
              {data?.map((ticket) => {
                const isOpen = ticket.status !== "RESOLVED" && ticket.status !== "REJECTED";
                const breached = isOpen && new Date(ticket.slaDeadline) < new Date();
                return (
                  <tr
                    key={ticket.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="num whitespace-nowrap px-3 py-2 font-mono text-[12px]">
                      {ticket.id.slice(0, 10)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {ticket.proposal?.projectName ?? ticket.proposalId}
                    </td>
                    <td className="max-w-[280px] px-3 py-2">
                      <div className="truncate font-medium">{ticket.issueCategory}</div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {ticket.description}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-block whitespace-nowrap rounded-[4px] border px-1.5 py-0.5 text-[10.5px] font-semibold",
                          STATUS_TONE[ticket.status],
                        )}
                      >
                        {ticket.status.replace("_", " ")}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "num whitespace-nowrap px-3 py-2",
                        breached && "font-semibold text-status-critical",
                      )}
                    >
                      {fmt(ticket.slaDeadline)}
                      {breached && " · overdue"}
                    </td>
                    <td className="num whitespace-nowrap px-3 py-2 text-muted-foreground">
                      {fmt(ticket.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {!isOpen ? null : canAct ? (
                        <ResolveGrievanceDialog ticket={ticket} />
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-[11px] text-muted-foreground">—</span>
                          </TooltipTrigger>
                          <TooltipContent side="left">{NO_CREDENTIALS_HINT}</TooltipContent>
                        </Tooltip>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
