import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Lock, Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PortalCapability {
  icon: LucideIcon;
  label: string;
  detail: string;
}

interface PortalEntryCardProps {
  tone: "restricted" | "open";
  badge: string;
  eyebrow: string;
  title: string;
  description: string;
  capabilities: PortalCapability[];
  ctaLabel: string;
  ctaTo: "/sign-in" | "/public" | "/dashboard";
  footerNote: string;
}

const TONES = {
  restricted: {
    bar: "bg-ink",
    iconTile: "bg-ink text-ink-foreground",
    badge: "border-status-warn/40 bg-status-warn/10 text-status-warn",
    hover: "hover:border-ink/35 hover:shadow-[0_14px_34px_-18px_rgba(42,33,24,0.45)]",
    cta: "bg-ink text-ink-foreground hover:bg-ink-hover",
    capabilityIcon: "text-ink",
  },
  open: {
    bar: "bg-forest",
    iconTile: "bg-forest text-forest-foreground",
    badge: "border-forest/40 bg-forest/10 text-forest",
    hover: "hover:border-forest/35 hover:shadow-[0_14px_34px_-18px_rgba(15,81,50,0.4)]",
    cta: "bg-forest text-forest-foreground hover:bg-forest-hover",
    capabilityIcon: "text-forest",
  },
} as const;

/**
 * Interactive gateway card on the public landing page — one per portal
 * (restricted officer workspace / open citizen services).
 */
export function PortalEntryCard({
  tone,
  badge,
  eyebrow,
  title,
  description,
  capabilities,
  ctaLabel,
  ctaTo,
  footerNote,
}: PortalEntryCardProps) {
  const styles = TONES[tone];
  const FooterIcon = tone === "restricted" ? Lock : Globe2;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[6px] border border-border bg-card p-6 shadow-[0_1px_2px_rgba(42,33,24,0.06)] transition-all duration-200 ease-out hover:-translate-y-0.5",
        styles.hover,
      )}
    >
      <span aria-hidden className={cn("absolute inset-x-0 top-0 h-1", styles.bar)} />

      <div className="flex items-start justify-between gap-3">
        <span
          className={cn("grid size-11 shrink-0 place-items-center rounded-[6px]", styles.iconTile)}
        >
          {tone === "restricted" ? (
            <ShieldMark />
          ) : (
            <Globe2 className="size-5" strokeWidth={1.75} />
          )}
        </span>
        <span
          className={cn(
            "rounded-[3px] border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
            styles.badge,
          )}
        >
          {badge}
        </span>
      </div>

      <div className="label-xs mt-5">{eyebrow}</div>
      <h2 className="mt-1.5 text-[21px] font-semibold leading-tight tracking-tight text-ink">
        {title}
      </h2>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>

      <ul className="mt-5 space-y-3 border-t border-border pt-5">
        {capabilities.map(({ icon: Icon, label, detail }) => (
          <li key={label} className="flex items-start gap-3">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-border bg-muted/40">
              <Icon className={cn("size-3.5", styles.capabilityIcon)} strokeWidth={1.9} />
            </span>
            <span>
              <span className="block text-[13px] font-medium leading-snug text-foreground">
                {label}
              </span>
              <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">
                {detail}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <Link
          to={ctaTo}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-[5px] text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            styles.cta,
          )}
        >
          {ctaLabel}
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
        <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-[10.5px] leading-snug text-muted-foreground">
          <FooterIcon className="mt-px size-3 shrink-0" />
          {footerNote}
        </p>
      </div>
    </article>
  );
}

function ShieldMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        d="M12 3 5 6v5.5c0 4.3 2.9 7.6 7 9.5 4.1-1.9 7-5.2 7-9.5V6l-7-3Z"
        strokeLinejoin="round"
      />
      <path d="m9.2 12 1.9 1.9 3.7-3.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
