import { Bell, LogOut, Menu, PlayCircle, Shield, Languages } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRole, PERSONA_PRESETS } from "@/context/RoleContext";
import { useAuth, type Role } from "@/context/AuthContext";
import { useDemo } from "@/context/DemoContext";
import { useI18n } from "@/context/I18nContext";
import { LANGUAGES } from "@/lib/translations";
import { useDerived } from "@/components/dashboard/derive";
import { DemoPanel } from "./DemoPanel";

export function TopBar({
  breadcrumb,
  onOpenNav,
}: {
  breadcrumb: string[];
  onOpenNav?: () => void;
}) {
  const { initials, person, roleLabel, role, switchPersona, switchingPersona } = useRole();
  const { signOut } = useAuth();
  const { lang, setLang, t } = useI18n();
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
        {/* Role & Persona Switcher */}
        <div className="hidden sm:flex items-center">
          <Select
            value={role ?? "DOLR_SECRETARY"}
            onValueChange={(val) => void switchPersona(val as Role)}
            disabled={switchingPersona}
          >
            <SelectTrigger className="h-8 w-[230px] rounded-[4px] border-border bg-muted/30 text-[11.5px] font-medium text-foreground">
              <div className="flex min-w-0 items-center gap-1.5">
                <Shield className="size-3.5 text-navy shrink-0" />
                <SelectValue placeholder="Select persona">{roleLabel}</SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent align="end" className="w-[300px]">
              {(Object.keys(PERSONA_PRESETS) as Role[]).map((r) => {
                const p = PERSONA_PRESETS[r];
                return (
                  <SelectItem key={r} value={r} className="py-2 text-[12px]">
                    <div className="font-semibold text-foreground">{p.label}</div>
                    <div className="text-[10.5px] text-muted-foreground leading-tight mt-0.5">
                      {p.name} · {p.description}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <Select
          value={lang}
          onValueChange={(v) => setLang(v as (typeof LANGUAGES)[number]["value"])}
        >
          <SelectTrigger
            aria-label="Select language"
            className="h-8 w-[150px] rounded-[4px] border-border bg-muted/30 text-[11.5px] font-medium text-foreground"
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <Languages className="size-3.5 text-navy shrink-0" />
              <SelectValue placeholder="Language">
                {LANGUAGES.find((l) => l.value === lang)?.label ?? "English"}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent align="end">
            {LANGUAGES.map((l) => (
              <SelectItem key={l.value} value={l.value} className="text-[12px]">
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="hidden items-center gap-2 border-l border-border pl-3 sm:flex"
            >
              <div className="grid size-8 place-items-center rounded-full bg-navy text-[11px] font-semibold text-navy-foreground">
                {initials}
              </div>
              <div className="hidden text-left leading-tight lg:block">
                <div className="text-[12px] font-semibold text-foreground">{person}</div>
                <div className="text-[10px] text-muted-foreground">{roleLabel}</div>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[200px] rounded-[6px] p-1">
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex w-full items-center gap-2 rounded-[4px] px-2.5 py-2 text-left text-[12.5px] font-medium text-foreground transition-colors hover:bg-accent"
            >
              <LogOut className="size-3.5" />
              {t("action.signOut")}
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
