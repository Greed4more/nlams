import { useEffect, useRef, useState } from "react";
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import type { DocumentRef, Proposal } from "@/data/mockData";
import { useDemo, useSpotlight } from "@/context/DemoContext";
import { useRole, NO_CREDENTIALS_HINT } from "@/context/RoleContext";
import { useUploadDocumentMutation, useVerifyDocumentMutation } from "@/hooks/useProposals";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const DOC_TYPE_LABEL: Record<DocumentRef["type"], string> = {
  SIA_REPORT: "Social Impact Assessment Report",
  SEC_11_NOTIFICATION: "Section 11 Preliminary Notification",
  SEC_19_DECLARATION: "Section 19 Declaration",
  AWARD_ORDER: "Section 23 Award Order",
  RR_SCHEME: "Rehabilitation & Resettlement Scheme",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtSize = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

export function DocumentRepository({ proposal }: { proposal: Proposal }) {
  const spotlight = useSpotlight("document-repository");
  const { verifySignal } = useDemo();
  const { canAct } = useRole();
  const uploadMutation = useUploadDocumentMutation(proposal.id);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<DocumentRef["type"]>("SIA_REPORT");

  const handleUploadClick = () => fileInput.current?.click();

  const handleFileSelected = (file: File | undefined) => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("type", uploadType);
    uploadMutation.mutate(form, {
      onSuccess: () =>
        toast.success("Document uploaded", {
          description: `${file.name} stored and hashed — SHA-256 computed from the actual bytes.`,
        }),
      onError: (err) =>
        toast.error("Upload failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        }),
    });
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <section className={cn("panel", spotlight)}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="label-xs">Document Repository &amp; Integrity Verification</div>
      </div>

      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
        <Select value={uploadType} onValueChange={(v) => setUploadType(v as DocumentRef["type"])}>
          <SelectTrigger className="h-7 w-[220px] rounded-[4px] text-[11.5px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(DOC_TYPE_LABEL) as DocumentRef["type"][]).map((t) => (
              <SelectItem key={t} value={t} className="text-[11.5px]">
                {DOC_TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(() => {
          const button = (
            <button
              type="button"
              disabled={!canAct || uploadMutation.isPending}
              onClick={handleUploadClick}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45",
              )}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              Upload document
            </button>
          );
          if (canAct) return button;
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{button}</span>
              </TooltipTrigger>
              <TooltipContent side="top">{NO_CREDENTIALS_HINT}</TooltipContent>
            </Tooltip>
          );
        })()}
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          onChange={(e) => handleFileSelected(e.target.files?.[0])}
        />
      </div>

      <div className="divide-y divide-border">
        {proposal.documents.length === 0 && (
          <p className="px-4 py-8 text-center text-[12px] text-muted-foreground">
            No statutory documents filed at this stage.
          </p>
        )}
        {proposal.documents.map((doc, i) => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            proposalId={proposal.id}
            autoVerifySignal={i === 0 ? verifySignal : undefined}
          />
        ))}
      </div>

      <div className="border-t border-border bg-muted/40 px-4 py-2 text-[10.5px] leading-snug text-muted-foreground">
        Integrity is a content hash (SHA-256) recomputed from the stored file bytes on every
        verification — not a distributed ledger.
      </div>
    </section>
  );
}

function DocumentCard({
  doc,
  proposalId,
  autoVerifySignal,
}: {
  doc: DocumentRef;
  proposalId: string;
  autoVerifySignal?: number | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const verifyMutation = useVerifyDocumentMutation(proposalId);
  const lastResult = verifyMutation.data;

  const reverify = () => {
    verifyMutation.mutate(doc.id);
  };

  useEffect(() => {
    if (!autoVerifySignal) return;
    setOpen(true);
    reverify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            {doc.verified ? "Hash verified" : "Not yet verified"}
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

          <div>
            <div className="label-xs">Last Verified</div>
            <div className="num mt-0.5 text-[12px]">
              {doc.lastVerifiedAt
                ? new Date(doc.lastVerifiedAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Never"}
            </div>
          </div>

          <button
            type="button"
            onClick={reverify}
            disabled={verifyMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-70"
          >
            {verifyMutation.isPending && <Loader2 className="size-3 animate-spin" />}
            {verifyMutation.isPending ? "Recomputing hash…" : "Re-verify Hash"}
          </button>

          {lastResult && !verifyMutation.isPending && (
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1.5 text-[11.5px] font-medium",
                lastResult.integrityMatch
                  ? "border-status-ok/30 bg-status-ok/10 text-status-ok"
                  : "border-status-critical/30 bg-status-critical/10 text-status-critical",
              )}
            >
              {lastResult.integrityMatch ? (
                <ShieldCheck className="size-3.5" />
              ) : (
                <ShieldAlert className="size-3.5" />
              )}
              {lastResult.integrityMatch
                ? "Integrity confirmed — recomputed hash matches the stored record"
                : "Integrity check FAILED — stored bytes no longer match the recorded hash"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
