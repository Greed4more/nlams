import { Award, FileCheck2, FileText, Gavel, HomeIcon } from "lucide-react";
import { useDerived } from "./derive";

const ICONS: Record<string, typeof FileText> = {
  SIA_REPORT: FileText,
  SEC_11_NOTIFICATION: FileCheck2,
  SEC_19_DECLARATION: Gavel,
  AWARD_ORDER: Award,
  RR_SCHEME: HomeIcon,
};

export function ActivityFeed() {
  const { recentActivity } = useDerived();
  return (
    <section className="panel flex flex-col">
      <header className="border-b border-border px-4 py-2.5">
        <h2 className="text-[13px] font-semibold text-foreground">Recent activity</h2>
        <p className="label-xs mt-0.5">Hash-verified document filings</p>
      </header>
      <ol className="px-4 py-3">
        {recentActivity.map((e, i) => {
          const Icon = ICONS[e.docType] ?? FileText;
          const last = i === recentActivity.length - 1;
          return (
            <li key={e.id} className="relative flex gap-3 pb-3 last:pb-0">
              {!last && <span className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />}
              <span className="mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border border-border bg-secondary">
                <Icon className="h-3 w-3 text-navy" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] text-foreground">{e.action}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="num font-semibold text-status-info">{e.proposalId}</span>
                  <span>·</span>
                  <span className="num">{e.ago}</span>
                </div>
                <div className="num mt-0.5 truncate text-[10px] text-muted-foreground/70">
                  sha256:{e.sha}…
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
