import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, RefreshCcw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRole } from "@/context/RoleContext";
import { useStateAdaptersQuery, useTriggerStateSyncMutation } from "@/hooks/useAdminAdapters";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/admin/adapters")({
  head: () => ({
    meta: [
      { title: "State Adapters — BHUMITRA" },
      {
        name: "description",
        content: "Pluggable per-state land-records adapter registry (Module 9).",
      },
    ],
  }),
  component: AdminAdaptersPage,
});

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

  return (
    <AppShell breadcrumb={["Home", "Admin", "State Adapters"]}>
      <PageHeader
        title="State Adapters"
        subtitle={
          data
            ? `${data.totalStatesSupported} States/UTs supported · reference implementation: ${data.activeReferenceAdapter}`
            : "Pluggable per-state land-records adapter registry"
        }
      />

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="label-xs">Registered Plugins</div>
        </div>
        <div className="divide-y divide-border">
          {isLoading && <div className="shimmer m-4 h-5 w-2/3" />}
          {data?.registeredPlugins.map((plugin) => {
            const dbRow = data.dbAdapters.find((a) => a.stateCode === plugin.stateCode);
            return (
              <div key={plugin.stateCode} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <div className="text-[13px] font-medium">
                    [{plugin.stateCode}] {plugin.stateName}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Last sync: {dbRow?.lastSyncStatus ?? "idle"}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={triggerSync.isPending}
                  onClick={() => handleSync(plugin.stateCode)}
                  className="inline-flex items-center gap-1.5 rounded-[4px] border border-border px-2 py-1 text-[11px] font-medium text-foreground/80 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {triggerSync.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCcw className="size-3.5" />
                  )}
                  Trigger Sync
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
