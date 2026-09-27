import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { formatLastLogin, getLastLogin } from "@/lib/lastLogin";

/**
 * Security notice real government/banking portals show after sign-in: the
 * timestamp of the previous successful session on this device. Renders
 * nothing on a first-ever sign-in.
 */
export function LastLoginNotice() {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    const last = getLastLogin();
    if (last) setLine(formatLastLogin(last.at));
  }, []);

  if (!line) return null;

  return (
    <div className="mb-3 flex items-center gap-1.5 rounded-[4px] border border-border bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground">
      <ShieldCheck className="size-3 shrink-0 text-status-ok" />
      <span>
        Previous sign-in: <span className="num font-medium text-foreground">{line}</span> from this
        device. If this wasn&apos;t you, contact the DoLR helpdesk immediately.
      </span>
    </div>
  );
}
