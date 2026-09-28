import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Globe2, MapPin } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LastLoginNotice } from "@/components/layout/LastLoginNotice";
import { useRole } from "@/context/RoleContext";
import { StateWiseDashboard } from "@/components/dashboard/StateWiseDashboard";
import { MisExport } from "@/components/dashboard/MisExport";
import { useI18n } from "@/context/I18nContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { DolrSecretaryDashboard } from "@/components/dashboard/roles/DolrSecretaryDashboard";
import { DistrictCollectorDashboard } from "@/components/dashboard/roles/DistrictCollectorDashboard";
import { LaoDashboard } from "@/components/dashboard/roles/LaoDashboard";
import { StateRevenueDashboard } from "@/components/dashboard/roles/StateRevenueDashboard";
import { FinanceOfficerDashboard } from "@/components/dashboard/roles/FinanceOfficerDashboard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Executive Overview — BHUMITRA | Department of Land Resources" },
      {
        name: "description",
        content:
          "Real-time monitoring of land acquisition proposals, statutory timelines and compensation disbursal under the RFCTLARR Act, 2013.",
      },
      { property: "og:title", content: "BHUMITRA Executive Overview" },
      {
        property: "og:description",
        content:
          "Track RFCTLARR Act 2013 acquisition proposals, statutory SLA breaches and compensation across states.",
      },
      { property: "og:type", content: "website" },
      { property: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function useLiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/**
 * Role-scoped landing surface. Every role holds a nationwide roll, so the
 * dashboard offers two views: the role's National dashboard and a State-wise
 * drill-down (chosen state scopes every widget on the page).
 */
function Dashboard() {
  const { role, roleLabel, dashboardTitle, activeState, setActiveState, stateOptions, proposals } =
    useRole();
  const { t } = useI18n();
  const now = useLiveClock();
  const stamp = now
    ? now.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium" })
    : "synchronising…";

  // Default state for the state-wise view: the state carrying the most cases.
  const defaultState = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of proposals) counts.set(p.state, (counts.get(p.state) ?? 0) + 1);
    let best: string | null = null;
    let bestCount = -1;
    for (const [state, count] of counts) {
      if (count > bestCount) {
        best = state;
        bestCount = count;
      }
    }
    return best ?? stateOptions[0] ?? "";
  }, [proposals, stateOptions]);

  const stateView = activeState != null;

  return (
    <AppShell breadcrumb={["Home", "Dashboard"]}>
      <PageHeader
        title={
          stateView ? `${activeState} State Dashboard` : dashboardTitle || t("page.dashboard.title")
        }
        subtitle={`Role: ${roleLabel} · ${stateView ? `${activeState} state-wise view` : "National view"} · Statutory positions computed at page load (${stamp} IST) — seeded demo dataset`}
        actions={<MisExport />}
      />

      <LastLoginNotice />

      {/* National ↔ State-wise dashboard switcher */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-border bg-card px-3 py-2">
        <div className="flex items-center gap-1 rounded-[5px] bg-muted/60 p-0.5">
          <button
            type="button"
            onClick={() => setActiveState(null)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-[12px] font-semibold transition-colors",
              !stateView
                ? "bg-card text-ink shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Globe2 className="size-3.5" />
            National Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveState(activeState ?? defaultState)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-[12px] font-semibold transition-colors",
              stateView
                ? "bg-card text-ink shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MapPin className="size-3.5" />
            State-wise Dashboard
          </button>
        </div>

        {stateView && (
          <div className="flex items-center gap-2">
            <span className="label-xs">State</span>
            <Select value={activeState} onValueChange={(v) => setActiveState(v)}>
              <SelectTrigger
                aria-label="Select state dashboard"
                className="h-8 w-[220px] rounded-[4px] border-border bg-muted/30 text-[12px] font-medium"
              >
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent align="end" className="max-h-[320px]">
                {stateOptions.map((s) => (
                  <SelectItem key={s} value={s} className="text-[12px]">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {stateView ? (
        <StateWiseDashboard state={activeState} />
      ) : (
        <>
          {role === "DOLR_SECRETARY" && <DolrSecretaryDashboard />}
          {role === "DISTRICT_COLLECTOR" && <DistrictCollectorDashboard />}
          {role === "LAO" && <LaoDashboard />}
          {role === "STATE_REVENUE" && <StateRevenueDashboard />}
          {role === "FINANCE_OFFICER" && <FinanceOfficerDashboard />}
        </>
      )}
    </AppShell>
  );
}
