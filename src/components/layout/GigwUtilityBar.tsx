import { useEffect, useState } from "react";
import { Contrast, Ear, Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Persisted accessibility preferences — GIGW utility strip controls. */
const SCALE_KEY = "bhumitra.fontScale";
const CONTRAST_KEY = "bhumitra.highContrast";

function applyScale(scale: number) {
  document.documentElement.style.setProperty("--user-font-scale", String(scale));
}

function applyContrast(on: boolean) {
  document.documentElement.classList.toggle("high-contrast", on);
}

/**
 * Thin GIGW utility strip: skip link, text-size controls, high-contrast
 * toggle and the screen-reader access statement. Rendered above the masthead
 * on every shell (officer app, public portal and sign-in).
 */
export function GigwUtilityBar({ className }: { className?: string }) {
  const [scale, setScale] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [srOpen, setSrOpen] = useState(false);

  useEffect(() => {
    try {
      const storedScale = Number(localStorage.getItem(SCALE_KEY));
      if (storedScale >= 0.85 && storedScale <= 1.15) {
        setScale(storedScale);
        applyScale(storedScale);
      }
      if (localStorage.getItem(CONTRAST_KEY) === "1") {
        setHighContrast(true);
        applyContrast(true);
      }
    } catch {
      // storage unavailable — defaults are fine
    }
  }, []);

  const changeScale = (next: number) => {
    const clamped = Math.min(1.15, Math.max(0.85, Number(next.toFixed(2))));
    setScale(clamped);
    applyScale(clamped);
    try {
      localStorage.setItem(SCALE_KEY, String(clamped));
    } catch {
      // ignore
    }
  };

  const toggleContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    applyContrast(next);
    try {
      localStorage.setItem(CONTRAST_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <div aria-hidden className="tricolour-rule h-[3px] w-full border-b border-ink/10" />
      <div
        className={cn(
          "flex h-8 items-center justify-between gap-3 border-b border-white/10 bg-ink px-3 text-[11px] text-ink-muted sm:px-5",
          className,
        )}
      >
        <a
          href="#main-content"
          className="rounded-[2px] font-medium text-ink-foreground/90 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-status-info"
        >
          Skip to Main Content
        </a>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="hidden items-center gap-1 sm:flex">
            <span className="text-ink-muted">Text size</span>
            <button
              type="button"
              aria-label="Decrease text size"
              onClick={() => changeScale(scale - 0.05)}
              className="grid size-5 place-items-center rounded-[2px] text-ink-foreground/80 transition-colors hover:bg-white/10"
            >
              <Minus className="size-3" />
            </button>
            <button
              type="button"
              aria-label="Reset text size"
              onClick={() => changeScale(1)}
              className="num grid size-5 place-items-center rounded-[2px] text-[11px] font-semibold text-ink-foreground/80 transition-colors hover:bg-white/10"
            >
              A
            </button>
            <button
              type="button"
              aria-label="Increase text size"
              onClick={() => changeScale(scale + 0.05)}
              className="grid size-5 place-items-center rounded-[2px] text-ink-foreground/80 transition-colors hover:bg-white/10"
            >
              <Plus className="size-3" />
            </button>
          </div>

          <button
            type="button"
            aria-pressed={highContrast}
            onClick={toggleContrast}
            className={cn(
              "inline-flex items-center gap-1 rounded-[2px] px-1.5 py-0.5 font-medium transition-colors hover:bg-white/10",
              highContrast ? "text-status-warn" : "text-ink-foreground/80",
            )}
          >
            <Contrast className="size-3" />
            High Contrast
          </button>

          <button
            type="button"
            onClick={() => setSrOpen(true)}
            className="inline-flex items-center gap-1 rounded-[2px] px-1.5 py-0.5 font-medium text-ink-foreground/80 transition-colors hover:bg-white/10"
          >
            <Ear className="size-3" />
            Screen Reader Access
          </button>
        </div>

        <Dialog open={srOpen} onOpenChange={setSrOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[15px]">Screen Reader Access</DialogTitle>
              <DialogDescription className="text-[12.5px] leading-relaxed">
                BHUMITRA follows the Guidelines for Indian Government Websites (GIGW) and the WCAG
                2.1 AA standard. The application is tested with NVDA, JAWS, and the built-in screen
                readers of Windows, macOS, and Android.
              </DialogDescription>
            </DialogHeader>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[12px] leading-relaxed text-muted-foreground">
              <li>All interactive controls are reachable by keyboard alone (Tab / Shift+Tab).</li>
              <li>Data tables use proper header scopes and caption text.</li>
              <li>Status changes are announced through ARIA live regions where applicable.</li>
              <li>
                For assistance, write to{" "}
                <span className="font-medium text-foreground">help-dolr@gov.in</span>.
              </li>
            </ul>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
