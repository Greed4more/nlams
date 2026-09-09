import { useState } from "react";
import {
  History,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Link2,
  Copy,
  Check,
  Eye,
  Hash,
  FileCheck2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { STAGE_LABELS, type RfctlarrStage } from "@/data/mockData";
import { useAuditLogQuery, type AuditLogEntry } from "@/hooks/useProposals";
import { useVerifyAuditChainMutation } from "@/hooks/useAudit";
import { verifyBlockClientSide, GENESIS_HASH } from "@/lib/clientCrypto";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ACTION_LABEL: Record<string, string> = {
  STAGE_ADVANCE: "Stage advanced",
  DOCUMENT_UPLOAD: "Document uploaded & hashed",
  DOCUMENT_VERIFY: "Document integrity verified",
  COMPENSATION_CALCULATED: "Compensation award finalized",
  GRIEVANCE_SUBMITTED: "Grievance ticket submitted",
  GRIEVANCE_RESOLVED: "Grievance ticket resolved",
  RISK_SCORED: "Litigation risk re-scored",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

function truncateHash(hash: string | null | undefined, head = 8, tail = 6): string {
  if (!hash) return "—";
  if (hash === GENESIS_HASH) return "0000...0000 (GENESIS)";
  if (hash.length <= head + tail) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

function CopyChip({
  value,
  label,
  monospace = true,
  className,
}: {
  value: string;
  label: string;
  monospace?: boolean;
  className?: string | undefined;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard?.writeText(value);
    setCopied(true);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "group inline-flex items-center gap-1 rounded-[4px] border border-border bg-muted/40 px-1.5 py-0.5 text-[10.5px] transition-colors hover:bg-muted",
            monospace && "font-mono",
            className,
          )}
        >
          <span>{truncateHash(value)}</span>
          {copied ? (
            <Check className="size-2.5 text-status-ok" />
          ) : (
            <Copy className="size-2.5 opacity-40 group-hover:opacity-100" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="font-mono text-[11px] max-w-xs break-all">
        {value} (Click to copy)
      </TooltipContent>
    </Tooltip>
  );
}

export function AuditTrail({ proposalId }: { proposalId: string }) {
  const { data, isLoading } = useAuditLogQuery(proposalId);
  const verifyChain = useVerifyAuditChainMutation();
  const [inspectingBlock, setInspectingBlock] = useState<AuditLogEntry | null>(null);
  const [clientVerification, setClientVerification] = useState<{
    matches: boolean;
    recomputedHash: string;
  } | null>(null);
  const [isVerifyingBlock, setIsVerifyingBlock] = useState(false);

  const handleInspectBlock = async (entry: AuditLogEntry) => {
    setInspectingBlock(entry);
    setIsVerifyingBlock(true);
    try {
      const result = await verifyBlockClientSide({
        previousHash: entry.previousHash,
        proposalId,
        action: entry.action,
        eventPayloadHash: entry.eventPayloadHash,
        fileHash: entry.fileHash,
        chainHash: entry.chainHash,
      });
      setClientVerification(result);
    } catch {
      setClientVerification(null);
    } finally {
      setIsVerifyingBlock(false);
    }
  };

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" />
          <div>
            <div className="label-xs">Cryptographic Audit Vault · Hash Chain Ledger</div>
            <div className="text-[11px] text-muted-foreground">
              SHA-256 chained transaction blocks under RFCTLARR Act 2013
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {verifyChain.data && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-1 text-[11px] font-semibold",
                verifyChain.data.chainIntact
                  ? "border-status-ok/30 bg-status-ok/10 text-status-ok"
                  : "border-status-critical/30 bg-status-critical/10 text-status-critical",
              )}
            >
              {verifyChain.data.chainIntact ? (
                <ShieldCheck className="size-3.5" />
              ) : (
                <ShieldAlert className="size-3.5" />
              )}
              {verifyChain.data.chainIntact
                ? `Ledger Intact (${verifyChain.data.verifiedBlocks ?? verifyChain.data.totalRecords} blocks)`
                : "Tamper Detected"}
            </span>
          )}

          <button
            type="button"
            disabled={verifyChain.isPending}
            onClick={() => {
              verifyChain.mutate(undefined, {
                onSuccess: (res) => {
                  if (res.chainIntact) {
                    toast.success("Cryptographic hash chain intact", {
                      description: `Verified ${res.verifiedBlocks ?? res.totalRecords} blocks from genesis hash with zero discrepancies.`,
                    });
                  } else {
                    toast.error("Tampering detected in ledger", {
                      description: res.reason ?? "Chain hash mismatch found.",
                    });
                  }
                },
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            title="Traverses the append-only ledger and independently validates every block hash"
          >
            {verifyChain.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="size-3.5 text-status-info" />
            )}
            Verify Chain Integrity
          </button>
        </div>
      </div>

      <div className="divide-y divide-border">
        {isLoading && (
          <div className="space-y-3 p-4">
            <div className="shimmer h-8 w-full" />
            <div className="shimmer h-8 w-full" />
          </div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">
            <Hash className="mx-auto mb-1.5 size-5 opacity-40" />
            No transaction blocks recorded against this proposal yet.
          </div>
        )}

        {data?.map((entry) => {
          const isGenesisChild = entry.previousHash === GENESIS_HASH;
          return (
            <div
              key={entry.id}
              className="group relative flex flex-col gap-2.5 px-4 py-3 transition-colors hover:bg-muted/30"
            >
              {/* Block header & meta */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="num font-mono rounded-[4px] bg-navy/10 px-1.5 py-0.5 text-[11px] font-bold text-navy">
                    Block #{String(entry.blockHeight).padStart(3, "0")}
                  </span>
                  <span className="text-[13px] font-medium text-foreground">
                    {ACTION_LABEL[entry.action] ?? entry.action}
                  </span>
                  {entry.fromStage && entry.toStage && (
                    <span className="text-[11px] text-muted-foreground">
                      ({STAGE_LABELS[entry.fromStage as RfctlarrStage]} →{" "}
                      {STAGE_LABELS[entry.toStage as RfctlarrStage]})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="num text-[11px] text-muted-foreground">
                    {fmt(entry.createdAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleInspectBlock(entry)}
                    className="inline-flex items-center gap-1 rounded-[4px] border border-border bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Eye className="size-3" />
                    Inspect Proof
                  </button>
                </div>
              </div>

              {/* Cryptographic Linkage Row */}
              <div className="flex flex-wrap items-center gap-2 rounded-[4px] bg-muted/20 p-2 text-[11px]">
                {/* Parent Hash */}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Parent:</span>
                  {entry.previousHash ? (
                    <CopyChip
                      value={entry.previousHash}
                      label="Previous Block Hash"
                      className={isGenesisChild ? "border-navy/30 bg-navy/5 text-navy" : undefined}
                    />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>

                <Link2 className="size-3 text-muted-foreground/60 shrink-0" />

                {/* Current Block Hash */}
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">Block Hash:</span>
                  {entry.chainHash ? (
                    <CopyChip
                      value={entry.chainHash}
                      label="Current Block Hash"
                      className="border-status-info/30 bg-status-info/5 text-status-info font-bold"
                    />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>

                {/* Payload Checksum */}
                {entry.eventPayloadHash && (
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-muted-foreground">Payload SHA-256:</span>
                    <CopyChip value={entry.eventPayloadHash} label="Payload Checksum" />
                  </div>
                )}

                {/* File Checksum */}
                {entry.fileHash && (
                  <div className="flex items-center gap-1">
                    <FileCheck2 className="size-3 text-status-ok" />
                    <span className="text-muted-foreground">File SHA-256:</span>
                    <CopyChip
                      value={entry.fileHash}
                      label="File Checksum"
                      className="border-status-ok/30 bg-status-ok/5 text-status-ok"
                    />
                  </div>
                )}
              </div>

              {/* Actor note */}
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>Signed by:</span>
                <span className="font-medium text-foreground">
                  {entry.actor ? `${entry.actor.name} (${entry.actor.role})` : "System Automated Action"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Block Inspector Modal */}
      {inspectingBlock && (
        <Dialog open={!!inspectingBlock} onOpenChange={(open) => !open && setInspectingBlock(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[16px]">
                <Hash className="size-4 text-navy" />
                Cryptographic Block Inspection · Block #{String(inspectingBlock.blockHeight).padStart(3, "0")}
              </DialogTitle>
              <DialogDescription className="text-[12px]">
                Mathematical proof and SHA-256 hash chaining under RFCTLARR Act 2013 audit vault.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 text-[12px]">
              {/* Formula explanation */}
              <div className="rounded-[4px] border border-border bg-muted/40 p-2.5">
                <div className="font-semibold text-foreground text-[11.5px]">Hash Formula:</div>
                <code className="mt-1 block font-mono text-[11px] text-navy break-all">
                  chainHash = SHA-256(previousHash : proposalId : action : eventPayloadHash : fileHash)
                </code>
              </div>

              {/* Verification check result */}
              <div className="flex items-center justify-between rounded-[4px] border border-border p-2.5">
                <div>
                  <div className="font-medium text-foreground">Client-side Independent Web Crypto Proof:</div>
                  <div className="text-[11px] text-muted-foreground">
                    Recomputed directly in your browser using standard Web Crypto API.
                  </div>
                </div>
                {isVerifyingBlock ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : clientVerification?.matches ? (
                  <span className="inline-flex items-center gap-1 rounded-[4px] border border-status-ok/30 bg-status-ok/10 px-2 py-0.5 text-[11.5px] font-semibold text-status-ok">
                    <CheckCircle2 className="size-3.5" />
                    PASS (Verified)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-[4px] border border-status-critical/30 bg-status-critical/10 px-2 py-0.5 text-[11.5px] font-semibold text-status-critical">
                    <XCircle className="size-3.5" />
                    MISMATCH
                  </span>
                )}
              </div>

              {/* Hash parameters breakdown */}
              <div className="space-y-2 rounded-[4px] border border-border p-2.5 font-mono text-[11px]">
                <div>
                  <span className="text-muted-foreground">previousHash:</span>
                  <div className="mt-0.5 break-all text-foreground select-all bg-muted/30 p-1 rounded">
                    {inspectingBlock.previousHash ?? GENESIS_HASH}
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground">eventPayloadHash:</span>
                  <div className="mt-0.5 break-all text-foreground select-all bg-muted/30 p-1 rounded">
                    {inspectingBlock.eventPayloadHash ?? "—"}
                  </div>
                </div>

                {inspectingBlock.fileHash && (
                  <div>
                    <span className="text-muted-foreground">fileHash (Attached Document):</span>
                    <div className="mt-0.5 break-all text-status-ok select-all bg-muted/30 p-1 rounded">
                      {inspectingBlock.fileHash}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-muted-foreground font-semibold">chainHash (Block Signature):</span>
                  <div className="mt-0.5 break-all text-status-info font-bold select-all bg-status-info/5 p-1 rounded border border-status-info/20">
                    {inspectingBlock.chainHash}
                  </div>
                </div>
              </div>

              {/* Raw payload */}
              {inspectingBlock.metadata && (
                <div>
                  <div className="mb-1 text-[11.5px] font-semibold text-foreground">
                    Canonical Event Payload (Input Data):
                  </div>
                  <pre className="max-h-36 overflow-auto rounded-[4px] border border-border bg-muted/20 p-2 font-mono text-[10.5px] select-all">
                    {JSON.stringify(inspectingBlock.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
