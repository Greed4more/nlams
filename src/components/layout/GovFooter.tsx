import { Mail, Server } from "lucide-react";
import { toast } from "sonner";

const LINKS = ["Website Policies", "Accessibility Statement", "Sitemap", "RTI", "Help"] as const;

/** Static content date; refreshed with each content release. */
const CONTENT_UPDATED = "27-09-2026";

/**
 * GIGW footer band — tricolour rule, citizen helpdesk strip, policy links,
 * ownership statement and the NIC Cloud / MeghRaj hosting line carried by
 * real Government of India portals.
 */
export function GovFooter({ className }: { className?: string }) {
  const openPolicy = (label: string) =>
    toast.info(label, {
      description:
        "This information page is published on the Department of Land Resources production portal.",
    });

  return (
    <footer className={["border-t border-border bg-card", className].filter(Boolean).join(" ")}>
      <div aria-hidden className="tricolour-rule h-[3px] w-full" />

      <div className="border-b border-border bg-muted/40 px-5 py-3 print:hidden">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-[10.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Mail className="size-3 shrink-0 text-navy" />
            Citizen helpdesk:&nbsp;
            <span className="font-medium text-foreground">help-dolr@gov.in</span>
          </span>
          <span>
            District Land Acquisition Office &middot; Monday&ndash;Friday, 10:00&ndash;17:30 IST
          </span>
          <span className="font-serif text-[11px] font-semibold tracking-[0.08em] text-navy">
            भूमित्र &middot; BHUMITRA
          </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-5 py-4 print:hidden">
        <nav
          aria-label="Website policies"
          className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1"
        >
          {LINKS.map((label, i) => (
            <span key={label} className="flex items-center">
              {i > 0 && <span className="mx-2 text-muted-foreground/40">|</span>}
              <button
                type="button"
                onClick={() => openPolicy(label)}
                className="text-[11px] font-medium text-status-info underline-offset-2 hover:underline"
              >
                {label}
              </button>
            </span>
          ))}
        </nav>

        <p className="mt-2.5 text-center text-[10.5px] leading-relaxed text-muted-foreground">
          Content owned and maintained by the Department of Land Resources, Ministry of Rural
          Development, Government of India. Designed in accordance with the Guidelines for Indian
          Government Websites (GIGW).
        </p>

        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          <span className="num">Last Updated: {CONTENT_UPDATED}</span>
          <span className="inline-flex items-center gap-1">
            <Server className="size-3" />
            Hosted on NIC Cloud (MeghRaj)
          </span>
          <span className="font-serif">BHUMITRA v0.9 &middot; Restricted</span>
        </div>
      </div>
    </footer>
  );
}
