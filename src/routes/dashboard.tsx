import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LastLoginNotice } from "@/components/layout/LastLoginNotice";
import { useRole } from "@/context/RoleContext";
import { MisExport } from "@/components/dashboard/MisExport";
import { useI18n } from "@/context/I18nContext";

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
 * Role-scoped landing surface: every role signs in to its own custom
 * dashboard — there is no shared/generic overview and no in-app persona
 * switcher.
 */
function Dashboard() {
  const { roleLabel, role, dashboardTitle } = useRole();
  const { t } = useI18n();
  const now = useLiveClock();
  const stamp = now
    ? now.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium" })
    : "synchronising…";

  return (
    <AppShell breadcrumb={["Home", "Dashboard"]}>
      <PageHeader
        title={dashboardTitle || t("page.dashboard.title")}
        subtitle={`Role: ${roleLabel} · Statutory positions computed at page load (${stamp} IST) — seeded demo dataset`}
        actions={<MisExport />}
      />

      <LastLoginNotice />

      {role === "DOLR_SECRETARY" && <DolrSecretaryDashboard />}
      {role === "DISTRICT_COLLECTOR" && <DistrictCollectorDashboard />}
      {role === "LAO" && <LaoDashboard />}
      {role === "STATE_REVENUE" && <StateRevenueDashboard />}
      {role === "FINANCE_OFFICER" && <FinanceOfficerDashboard />}
    </AppShell>
  );
}
