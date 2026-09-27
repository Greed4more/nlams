import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, RefreshCcw, CircleDashed } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRole } from "@/context/RoleContext";
import { useStateAdaptersQuery, useTriggerStateSyncMutation } from "@/hooks/useAdminAdapters";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/adapters")({
  head: () => ({
    meta: [
      { title: "State Adapters — BHUMITRA" },
      {
        name: "description",
        content:
          "Pluggable per-state land-records adapter framework — one live integration (West Bengal Banglarbhumi), remaining states planned.",
      },
    ],
  }),
  component: AdminAdaptersPage,
});

/** Only West Bengal has a real land-records integration in this deployment. */
const LIVE_ADAPTER_CODE = "WB";

function relativeTime(iso: string | undefined): string {
  if (!iso) return "not yet synced";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} day(s) ago`;
}

function AdminAdaptersPage() {
  const { role } = useRole();

  if (role !== "DOLR_SECRETARY") {
    return (
      <AppShell breadcrumb={["Home", "Admin", "State Adapters"]}>
        <div className="panel grid min-h-[240px] place-items-center p-8 text-center">
          <div>
            <div className="label-xs">Access restricted</div>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Only the DoLR Secretary role can manage the national state-adapter registry.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return <AdaptersTable />;
}

function AdaptersTable() {
  const { data, isLoading } = useStateAdaptersQuery();
  const triggerSync = useTriggerStateSyncMutation();

  const handleSync = (stateCode: string) => {
    triggerSync.mutate(stateCode, {
      onSuccess: () => toast.success(`Sync triggered for ${stateCode}`),
      onError: (err) =>
        toast.error("Sync trigger failed", {
          description: err instanceof ApiError ? err.message : "Unknown error",
        }),
    });
  };

  const liveCount = data?.registeredPlugins.filter((p) => p.stateCode === LIVE_ADAPTER_CODE).length;
  const total = data?.totalStatesSupported ?? 36;

  return (
    <AppShell breadcrumb={["Home", "Admin", "State Adapters"]}>
      <PageHeader
        title="State Adapters"
        subtitle={
          data
            ? `${total} States/UTs in the adapter framework · ${liveCount ?? 1} live integration (West Bengal Banglarbhumi) · remaining states planned, not yet connected`
            : "Pluggable per-state land-records adapter framework"
        }
      />

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="label-xs">Registered Plugins</div>
          <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-status-ok" /> Live integration
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground/40" /> Planned
            </span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {isLoading && <div className="shimmer m-4 h-5 w-2/3" />}
          {data?.registeredPlugins.map((plugin) => {
            const dbRow = data.dbAdapters.find((a) => a.stateCode === plugin.stateCode);
            const live = plugin.stateCode === LIVE_ADAPTER_CODE;
            const syncing = live && dbRow?.lastSyncStatus === "syncing_in_progress";
            return (
              <div key={plugin.stateCode} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium">
                      [{plugin.stateCode}] {plugin.stateName}
                    </span>
                    {live ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-status-ok/30 bg-status-ok/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-status-ok">
                        <span className="relative flex size-1.5">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-status-ok/70" />
                          <span className="relative inline-flex size-1.5 rounded-full bg-status-ok" />
                        </span>
                        Live Integration
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <CircleDashed className="size-3" />
                        Planned / Not Yet Connected
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {live
                      ? syncing
                        ? "Sync in progress — pulling Banglarbhumi records…"
                        : `Last synced ${relativeTime(dbRow?.updatedAt)}`
                      : "Adapter scaffold registered — integration scheduled under the national rollout"}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!live || triggerSync.isPending}
                  title={
                    live
                      ? "Pull latest records from Banglarbhumi"
                      : "Integration not yet connected for this state"
                  }
                  onClick={() => live && handleSync(plugin.stateCode)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border px-2 py-1 text-[11px] font-medium transition-colors",
                    live
                      ? "border-border text-foreground/80 hover:bg-muted"
                      : "cursor-not-allowed border-border/60 text-muted-foreground/50",
                    triggerSync.isPending && "disabled:opacity-50",
                  )}
                >
                  {live && triggerSync.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCcw className="size-3.5" />
                  )}
                  {live ? "Trigger Sync" : "Not Connected"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
