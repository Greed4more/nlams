import { ExternalLink, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/context/RoleContext";
import { statePortalFor } from "@/lib/statePortals";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

/**
 * Thin breadcrumb strip under the main nav bar, with the officer integration
 * controls: region view switcher and the NIC-Bhoomi state land-records
 * gateway shortcut.
 */
export function TopBar({ breadcrumb }: { breadcrumb: string[] }) {
  const { activeState, setActiveState, stateOptions } = useRole();
  const portal = statePortalFor(activeState);

  const openGateway = () => {
    if (!activeState) {
      toast.info("Select a state first", {
        description: "The NIC-Bhoomi Gateway opens the land-records portal of the selected state.",
      });
      return;
    }
    if (!portal) {
      toast.info(`${activeState} gateway not connected`, {
        description:
          "This state's adapter is registered, but its NIC-Bhoomi gateway is not wired in this environment yet.",
      });
      return;
    }
    window.open(portal.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex h-9 items-center justify-between gap-3 border-b border-border bg-muted/30 px-3 sm:px-5">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[12.5px]">
        {breadcrumb.map((crumb, i) => (
          <span key={crumb} className="flex min-w-0 items-center gap-2">
            {i > 0 && <span className="text-muted-foreground/50">›</span>}
            <span
              className={
                i === breadcrumb.length - 1
                  ? "truncate font-semibold text-foreground"
                  : "truncate text-muted-foreground"
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="hidden shrink-0 items-center gap-1.5 md:flex">
        <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <MapPin className="size-3" />
          Region
        </span>
        <Select
          value={activeState ?? ALL}
          onValueChange={(v) => setActiveState(v === ALL ? null : v)}
        >
          <SelectTrigger
            aria-label="Select region view"
            className="h-7 w-[176px] rounded-[4px] border-border bg-card text-[11.5px] font-medium"
          >
            <SelectValue placeholder="All states in scope" />
          </SelectTrigger>
          <SelectContent align="end" className="max-h-[320px]">
            <SelectItem value={ALL} className="text-[12px]">
              All states in scope
            </SelectItem>
            {stateOptions.map((s) => (
              <SelectItem key={s} value={s} className="text-[12px]">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={openGateway}
          title={
            portal
              ? `Open ${portal.name} (${activeState})`
              : activeState
                ? `${activeState} land-records gateway is not connected`
                : "Select a state to open its land-records gateway"
          }
          className="inline-flex h-7 items-center gap-1.5 rounded-[4px] border border-navy/25 bg-navy/5 px-2.5 text-[11.5px] font-semibold text-navy transition-colors hover:bg-navy/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ExternalLink className="size-3.5" />
          NIC-Bhoomi Gateway
        </button>
      </div>
    </div>
  );
}
