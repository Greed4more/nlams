import { Bell, LogOut, Menu, PlayCircle, Languages } from "lucide-react";
import { AshokaChakra } from "./GovIdentity";
import { Link } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import { useDemo } from "@/context/DemoContext";
import { useI18n } from "@/context/I18nContext";
import { LANGUAGES } from "@/lib/translations";
import { useDerived } from "@/components/dashboard/derive";
import { DemoPanel } from "./DemoPanel";

/**
 * Gov-portal-style masthead: brand/ministry identity left, officer controls
 * right. Officers are identified by role only — there is no persona switcher;
 * a different role dashboard is reached by signing in with that role.
 */
export function Masthead({ onOpenNav }: { onOpenNav?: () => void }) {
  const { roleInitials, roleLabel } = useRole();
  const { signOut } = useAuth();
  const { lang, setLang, t } = useI18n();
  const { breachedQueue } = useDerived();
  const demo = useDemo();
  const urgent = breachedQueue.slice(0, 4);

  return (
    <header className="border-b-[3px] border-double border-foreground/40 bg-card px-3 sm:px-5">
      <div className="flex h-16 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onOpenNav}
            className="grid size-8 shrink-0 place-items-center rounded-[4px] border border-border text-muted-foreground md:hidden"
          >
            <Menu className="size-4" strokeWidth={1.75} />
          </button>
          <Link to="/dashboard" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-ink/20 bg-ink text-ink-foreground">
              <AshokaChakra className="size-7" />
            </span>
            <span className="min-w-0">
              <span className="flex items-baseline gap-2 leading-tight">
                <span className="font-serif text-[19px] font-bold tracking-[0.12em] text-ink">
                  BHUMITRA
                </span>
                <span className="hidden text-[12px] font-semibold text-muted-foreground sm:inline">
                  भूमित्र
                </span>
              </span>
              <span className="hidden truncate text-[10.5px] leading-tight text-muted-foreground lg:block">
                Ministry of Rural Development &middot; Department of Land Resources &middot; भारत
                सरकार
              </span>
            </span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Select
            value={lang}
            onValueChange={(v) => setLang(v as (typeof LANGUAGES)[number]["value"])}
          >
            <SelectTrigger
              aria-label="Select language"
              className="h-8 w-9 justify-center gap-0 rounded-[4px] border-border bg-muted/30 px-0 text-[11.5px] font-medium text-foreground md:w-[150px] md:justify-start md:gap-1.5 md:px-3"
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <Languages className="size-3.5 text-ink shrink-0" />
                <SelectValue placeholder="Language">
                  <span className="hidden md:inline">
                    {LANGUAGES.find((l) => l.value === lang)?.label ?? "English"}
                  </span>
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
                className="hidden md:inline-flex h-8 items-center gap-1.5 rounded-full border border-ink/25 bg-ink/5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink transition-colors hover:bg-ink/10"
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
                <div className="grid size-8 place-items-center rounded-full bg-ink text-[11px] font-semibold text-ink-foreground">
                  {roleInitials}
                </div>
                <div className="hidden text-left leading-tight lg:block">
                  <div className="text-[12px] font-semibold text-foreground">{roleLabel}</div>
                  <div className="text-[10px] text-muted-foreground">Officer Workspace</div>
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
      </div>
    </header>
  );
}
