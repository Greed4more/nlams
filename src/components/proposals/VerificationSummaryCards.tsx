import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileClock,
  FilePlus2,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import type { Proposal } from "@/data/mockData";
import type { SlaResult } from "@/lib/slaRules";
import { reviewBucket, type ReviewBucket } from "@/lib/landMetrics";
import { cn } from "@/lib/utils";

interface Row {
  p: Proposal;
  sla: SlaResult;
}

interface VerificationSummaryCardsProps {
  rows: Row[];
  review: ReviewBucket | "all";
  onReviewChange: (bucket: ReviewBucket | "all") => void;
  highPriority: boolean;
  onHighPriorityChange: (value: boolean) => void;
}

interface CardTone {
  accent: string;
  value: string;
  active: string;
}

type ToneKey = "info" | "warn" | "critical" | "ok" | "priority";

const TONES: Record<ToneKey, CardTone> = {
  info: {
    accent: "border-l-status-info",
    value: "text-status-info",
    active: "border-status-info/60 bg-status-info/[0.06]",
  },
  warn: {
    accent: "border-l-status-warn",
    value: "text-status-warn",
    active: "border-status-warn/60 bg-status-warn/[0.06]",
  },
  critical: {
    accent: "border-l-status-critical",
    value: "text-status-critical",
    active: "border-status-critical/60 bg-status-critical/[0.06]",
  },
  ok: {
    accent: "border-l-status-ok",
    value: "text-status-ok",
    active: "border-status-ok/60 bg-status-ok/[0.06]",
  },
  priority: {
    accent: "border-l-destructive",
    value: "text-destructive",
    active: "border-destructive/60 bg-destructive/[0.06]",
  },
};

const REVIEW_CARDS: {
  index: number;
  bucket: ReviewBucket;
  label: string;
  hint: string;
  tone: ToneKey;
  icon: LucideIcon;
}[] = [
  {
    index: 1,
    bucket: "NEW",
    label: "New Proposals",
    hint: "Submitted by agencies",
    tone: "info",
    icon: FilePlus2,
  },
  {
    index: 2,
    bucket: "UNDER_VERIFICATION",
    label: "Under Verification",
    hint: "In officer review queue",
    tone: "warn",
    icon: FileClock,
  },
  {
    index: 3,
    bucket: "RETURNED",
    label: "Returned for Correction",
    hint: "Documents awaiting correction",
    tone: "critical",
    icon: AlertTriangle,
  },
  {
    index: 4,
    bucket: "VERIFIED",
    label: "Verified",
    hint: "Notified & forwarded",
    tone: "ok",
    icon: CheckCircle2,
  },
];

/**
 * Clickable stage counters above the acquisition register. Selecting a card
 * narrows the table below to that review bucket; High Priority additionally
 * filters to proposals past their statutory clock.
 */
export function VerificationSummaryCards({
  rows,
  review,
  onReviewChange,
  highPriority,
  onHighPriorityChange,
}: VerificationSummaryCardsProps) {
  const counts = useMemo(() => {
    const base: Record<ReviewBucket, number> = {
      NEW: 0,
      UNDER_VERIFICATION: 0,
      RETURNED: 0,
      VERIFIED: 0,
    };
    for (const { p } of rows) base[reviewBucket(p)] += 1;
    return base;
  }, [rows]);

  const highPriorityCount = useMemo(
    () => rows.filter(({ sla }) => sla.status === "BREACHED").length,
    [rows],
  );

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
      {REVIEW_CARDS.map(({ index, bucket, label, hint, tone, icon: Icon }) => {
        const active = review === bucket;
        const t = TONES[tone];
        return (
          <button
            key={bucket}
            type="button"
            aria-pressed={active}
            onClick={() => onReviewChange(active ? "all" : bucket)}
            title={active ? "Show all proposals" : `Filter to ${label.toLowerCase()}`}
            className={cn(
              "rounded-[6px] border border-l-4 border-border bg-card p-3.5 text-left shadow-[0_1px_2px_rgba(15,41,66,0.06)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              t.accent,
              active && t.active,
            )}
          >
            <div className="flex items-center gap-1.5">
              <Icon className={cn("size-3.5 shrink-0", t.value)} strokeWidth={2} />
              <span className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {index}. {label}
              </span>
            </div>
            <div className={cn("num mt-1.5 text-[26px] font-bold leading-none", t.value)}>
              {counts[bucket]}
            </div>
            <div className="mt-1.5 truncate text-[10.5px] text-muted-foreground">{hint}</div>
          </button>
        );
      })}

      <button
        type="button"
        aria-pressed={highPriority}
        onClick={() => onHighPriorityChange(!highPriority)}
        title={highPriority ? "Show all proposals" : "Filter to statutory breaches"}
        className={cn(
          "rounded-[6px] border border-l-4 border-border bg-card p-3.5 text-left shadow-[0_1px_2px_rgba(15,41,66,0.06)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          TONES.priority!.accent,
          highPriority && TONES.priority!.active,
        )}
      >
        <div className="flex items-center gap-1.5">
          <ShieldAlert className={cn("size-3.5 shrink-0", TONES.priority!.value)} strokeWidth={2} />
          <span className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            5. High Priority
          </span>
        </div>
        <div className={cn("num mt-1.5 text-[26px] font-bold leading-none", TONES.priority!.value)}>
          {highPriorityCount}
        </div>
        <div className="mt-1.5 truncate text-[10.5px] text-muted-foreground">
          Requires immediate action
        </div>
      </button>
    </div>
  );
}
