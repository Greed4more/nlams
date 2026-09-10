import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRole } from "@/context/RoleContext";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { StageChart } from "@/components/dashboard/StageChart";
import { DelayQueue } from "@/components/dashboard/DelayQueue";
import { StateDistribution } from "@/components/dashboard/StateDistribution";
import { CompensationFlow } from "@/components/dashboard/CompensationFlow";
import { RRProgress } from "@/components/dashboard/RRProgress";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { MisExport } from "@/components/dashboard/MisExport";
import { useI18n } from "@/context/I18nContext";

import { DolrSecretaryDashboard } from "@/components/dashboard/roles/DolrSecretaryDashboard";
import { DistrictCollectorDashboard } from "@/components/dashboard/roles/DistrictCollectorDashboard";
import { LaoDashboard } from "@/components/dashboard/roles/LaoDashboard";
import { StateRevenueDashboard } from "@/components/dashboard/roles/StateRevenueDashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Executive Overview — NLAMS | Department of Land Resources" },
      {
        name: "description",
        content:
          "Real-time monitoring of land acquisition proposals, statutory timelines and compensation disbursal under the RFCTLARR Act, 2013.",
      },
      { property: "og:title", content: "NLAMS Executive Overview" },
      {
        property: "og:description",
        content:
          "Track RFCTLARR Act 2013 acquisition proposals, statutory SLA breaches and compensation across states.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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

function Dashboard() {
  const { person, roleLabel, role, dashboardTitle } = useRole();
  const { t } = useI18n();
  const now = useLiveClock();
  const stamp = now
    ? now.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium" })
    : "synchronising…";

  return (
    <AppShell breadcrumb={["Home", "Dashboard"]}>
      <PageHeader
        title={dashboardTitle || t("page.dashboard.title")}
        subtitle={`Signed in as ${person} (${roleLabel}) · Live as of ${stamp} IST`}
        actions={<MisExport />}
      />

      {role === "DOLR_SECRETARY" && <DolrSecretaryDashboard />}
      {role === "DISTRICT_COLLECTOR" && <DistrictCollectorDashboard />}
      {role === "LAO" && <LaoDashboard />}
      {role === "STATE_REVENUE" && <StateRevenueDashboard />}

      {!role && (
        <div className="space-y-3">
          <KpiCards />

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5 lg:items-start">
            <div className="lg:col-span-3">
              <StageChart />
            </div>
            <div className="flex flex-col gap-3 lg:col-span-2">
              <DelayQueue />
              <StateDistribution />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <CompensationFlow />
            <RRProgress />
            <ActivityFeed />
          </div>
        </div>
      )}
    </AppShell>
  );
}
