import { Bell, Menu, PlayCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ROLES, useRole, type Role } from "@/context/RoleContext";
import { useDemo } from "@/context/DemoContext";
import { useDerived } from "@/components/dashboard/derive";
import { DemoPanel } from "./DemoPanel";

export function TopBar({
  breadcrumb,
  onOpenNav,
}: {
  breadcrumb: string[];
  onOpenNav?: () => void;
}) {
  const { role, setRole, config } = useRole();
  const { breachedQueue } = useDerived();
  const demo = useDemo();
  const urgent = breachedQueue.slice(0, 4);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenNav}
          className="grid size-8 shrink-0 place-items-center rounded-[4px] border border-border text-muted-foreground md:hidden"
        >
          <Menu className="size-4" strokeWidth={1.75} />
        </button>
        <nav
          aria-label="Breadcrumb"
          className="hidden min-w-0 items-center gap-2 text-[13px] sm:flex"
        >
          {breadcrumb.map((crumb, i) => (
            <span key={crumb} className="flex min-w-0 items-center gap-2">
              {i > 0 && <span className="text-muted-foreground/50">/</span>}
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
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Popover open={demo.open} onOpenChange={demo.setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-navy/25 bg-navy/5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-navy transition-colors hover:bg-navy/10"
            >
              <PlayCircle className="size-3.5" strokeWidth={2} />
              Demo
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[340px] rounded-[6px] p-0">
            <DemoPanel />
          </PopoverContent>
        </Popover>

        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger className="h-8 w-[150px] rounded-[4px] border-border text-[12px] lg:w-[248px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r} className="text-[12px]">
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Notifications"
              className="relative grid size-8 place-items-center rounded-[4px] border border-border text-muted-foreground transition-colors hover:bg-accent"
            >
              <Bell className="size-4" strokeWidth={1.75} />
              {urgent.length > 0 && (
                <span className="num absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-status-critical text-[10px] font-semibold text-primary-foreground">
                  {urgent.length}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[340px] rounded-[6px] p-0">
            <div className="border-b border-border px-3 py-2">
              <div className="label-xs">Statutory breach alerts</div>
            </div>
            <ul className="divide-y divide-border">
              {urgent.length === 0 && (
                <li className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                  No breaches in the current scope.
                </li>
              )}
              {urgent.map(({ proposal, sla }) => (
                <li key={proposal.id}>
                  <Link
                    to="/proposals/$id"
                    params={{ id: proposal.id }}
                    className="block px-3 py-2 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="num text-[11px] font-semibold text-status-info">
                        {proposal.id}
                      </span>
                      <span className="num text-[11px] font-semibold text-status-critical">
                        +{sla.daysElapsed - (sla.limitDays ?? 0)}d overdue
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-foreground">
                      {proposal.projectName}
                    </div>
                    <div className="label-xs mt-0.5 truncate">{sla.statuteRef}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>

        <div className="hidden items-center gap-2 border-l border-border pl-3 sm:flex">
          <div className="grid size-8 place-items-center rounded-full bg-navy text-[11px] font-semibold text-navy-foreground">
            {config.initials}
          </div>
          <div className="hidden leading-tight lg:block">
            <div className="text-[12px] font-semibold text-foreground">{config.person}</div>
            <div className="text-[10px] text-muted-foreground">{config.designation}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
