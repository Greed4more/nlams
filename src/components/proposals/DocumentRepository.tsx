import { useEffect, useState } from "react";
import {
  FileText,
  ShieldCheck,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { DocumentRef, Proposal } from "@/data/mockData";
import { useDemo, useSpotlight } from "@/context/DemoContext";
import { cn } from "@/lib/utils";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtSize = (kb: number) =>
  kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;

export function DocumentRepository({ proposal }: { proposal: Proposal }) {
  const spotlight = useSpotlight("document-repository");
  const { verifySignal } = useDemo();

  return (
    <section className={cn("panel", spotlight)}>
      <div className="border-b border-border px-4 py-2.5">
        <div className="label-xs">Document Repository &amp; Blockchain Verification</div>
      </div>

      <div className="divide-y divide-border">
        {proposal.documents.length === 0 && (
          <p className="px-4 py-8 text-center text-[12px] text-muted-foreground">
            No statutory documents filed at this stage.
          </p>
        )}
        {proposal.documents.map((doc, i) => (
          <DocumentCard key={doc.id} doc={doc} autoVerifySignal={i === 0 ? verifySignal : undefined} />
        ))}
      </div>

      <div className="border-t border-border bg-muted/40 px-4 py-2 text-[10.5px] leading-snug text-muted-foreground">
        Anchored to Hyperledger Fabric 2.5 · Immutable audit trail · Admissible under Sec. 24
        proceedings
      </div>
    </section>
  );
}

function DocumentCard({
  doc,
  autoVerifySignal,
}: {
  doc: DocumentRef;
  autoVerifySignal?: number | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const reverify = () => {
    setVerifying(true);
    setVerified(false);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 1500);
  };

  useEffect(() => {
    if (!autoVerifySignal) return;
    setOpen(true);
    reverify();
  }, [autoVerifySignal]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <FileText className="mt-[2px] size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-medium text-foreground">{doc.name}</div>
          <div className="num mt-0.5 text-[11px] text-muted-foreground">
            {fmtDate(doc.uploadedAt)} · {fmtSize(doc.sizeKb)}
          </div>
          <span
            className={cn(
              "mt-1.5 inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 text-[10.5px] font-semibold",
              doc.verified
                ? "border-status-ok/30 bg-status-ok/10 text-status-ok"
                : "border-status-warn/30 bg-status-warn/10 text-status-warn",
            )}
          >
            <ShieldCheck className="size-3" />
            {doc.verified ? "Blockchain Verified" : "Pending Anchoring"}
          </span>
        </div>
        {open ? (
          <ChevronDown className="mt-1 size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="space-y-2.5 border-t border-border bg-muted/30 px-4 py-3">
          <div>
            <div className="label-xs">SHA-256 Hash</div>
            <div className="mt-1 flex items-start gap-1.5">
              <code className="num break-all font-mono text-[10.5px] leading-snug text-foreground">
                {doc.sha256}
              </code>
              <button
                type="button"
                aria-label="Copy hash"
                onClick={() => {
                  void navigator.clipboard?.writeText(doc.sha256);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1400);
                }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                {copied ? <Check className="size-3 text-status-ok" /> : <Copy className="size-3" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="label-xs">Block Height</div>
              <div className="num mt-0.5 font-mono text-[12px]">
                {doc.blockHeight.toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div className="label-xs">Anchored At</div>
              <div className="num mt-0.5 text-[12px]">
                {new Date(doc.uploadedAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={reverify}
            disabled={verifying}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-70"
          >
            {verifying && <Loader2 className="size-3 animate-spin" />}
            {verifying ? "Verifying…" : "Re-verify Hash"}
          </button>

          {verified && !verifying && (
            <div className="flex items-center gap-1.5 rounded-[4px] border border-status-ok/30 bg-status-ok/10 px-2.5 py-1.5 text-[11.5px] font-medium text-status-ok">
              <ShieldCheck className="size-3.5" />
              Integrity confirmed — hash matches on-chain record
            </div>
          )}
        </div>
      )}
    </div>
  );
}
