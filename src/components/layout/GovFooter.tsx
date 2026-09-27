import { Server } from "lucide-react";
import { toast } from "sonner";

const LINKS = ["Website Policies", "Accessibility Statement", "Sitemap", "RTI", "Help"] as const;

/** Static content date; refreshed with each content release. */
const CONTENT_UPDATED = "27-09-2026";

/**
 * GIGW footer band — policy links, ownership statement and the NIC Cloud /
 * MeghRaj hosting line carried by real Government of India portals.
 */
export function GovFooter({ className }: { className?: string }) {
  const openPolicy = (label: string) =>
    toast.info(label, {
      description:
        "This information page is published on the Department of Land Resources production portal.",
    });

  return (
    <footer className={["border-t border-border bg-card", className].filter(Boolean).join(" ")}>
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
          Development, Government of India.
        </p>

        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          <span className="num">Last Updated: {CONTENT_UPDATED}</span>
          <span className="inline-flex items-center gap-1">
            <Server className="size-3" />
            Hosted on NIC Cloud (MeghRaj)
          </span>
          <span>BHUMITRA v0.9 · Restricted</span>
        </div>
      </div>
    </footer>
  );
}
