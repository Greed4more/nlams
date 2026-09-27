import { STAGE_ORDER, type Proposal } from "@/data/mockData";

/**
 * Officer review queue a proposal currently sits in — the counters on the
 * Acquisition Window map one-to-one onto these buckets.
 *
 * - NEW: submitted by the requiring body, not yet taken up for review.
 * - UNDER_VERIFICATION: appraisal in progress (SIA / SIA appraisal).
 * - RETURNED: documents failed verification and were sent back for correction.
 * - VERIFIED: Section 11 notified — the SIA appraisal was accepted.
 */
export type ReviewBucket = "NEW" | "UNDER_VERIFICATION" | "RETURNED" | "VERIFIED";

const SEC_11_INDEX = STAGE_ORDER.indexOf("SEC_11");

export function reviewBucket(p: Proposal): ReviewBucket {
  if (STAGE_ORDER.indexOf(p.currentStage) >= SEC_11_INDEX) return "VERIFIED";
  if (p.documents.some((d) => !d.verified)) return "RETURNED";
  if (p.currentStage === "INTAKE") return "NEW";
  return "UNDER_VERIFICATION";
}

/**
 * Land finally selected for acquisition. Nothing is finally selected while
 * the alignment is still being appraised; the Section 11 notification
 * declares the extent, so from that stage onward the notified area is the
 * selected area.
 */
export function selectedAreaHa(p: Proposal): number {
  return STAGE_ORDER.indexOf(p.currentStage) >= SEC_11_INDEX ? p.totalAreaHa : 0;
}

export function parcelCount(p: Proposal): number {
  return p.parcels.length;
}

/** Land required for the project, as recorded against the requiring body. */
export function landRequiredHa(p: Proposal): number {
  return p.totalAreaHa;
}

const SUBMITTED_DATE = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const SUBMITTED_TIME = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatSubmittedAt(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "" };
  return { date: SUBMITTED_DATE.format(d), time: SUBMITTED_TIME.format(d) };
}
