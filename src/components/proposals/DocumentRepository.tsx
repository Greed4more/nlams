import { useEffect, useRef, useState } from "react";
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ChevronDown,
  ChevronRight,
  Upload,
  SearchCheck,
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

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;

    const form = new FormData();
    form.append("file", file);
    form.append("type", uploadType);
    uploadMutation.mutate(form, {
      onSuccess: () => {
        toast.success("Document uploaded", {
          description: `${file.name} stored securely · content hash recorded in the audit vault.`,
        });
      },
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
        Integrity is guaranteed via SHA-256 content checksums linked directly into the BHUMITRA
        Cryptographic Audit Vault ledger.
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
  const verifyMutation = useVerifyDocumentMutation(proposalId);
  const lastResult = verifyMutation.data;
  const verifyFileInput = useRef<HTMLInputElement>(null);

  const verifyStored = () => {
    verifyMutation.mutate({ documentId: doc.id, form: new FormData() });
  };

  const verifyPickedFile = (file: File | undefined) => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    verifyMutation.mutate({ documentId: doc.id, form });
    if (verifyFileInput.current) verifyFileInput.current.value = "";
  };

  useEffect(() => {
    if (!autoVerifySignal) return;
    setOpen(true);
    verifyStored();
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
            {doc.verified ? "Integrity verified" : "Not yet verified"}
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => verifyFileInput.current?.click()}
              disabled={verifyMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-70"
            >
              {verifyMutation.isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <SearchCheck className="size-3.5" />
              )}
              {verifyMutation.isPending ? "Checking integrity…" : "Check document integrity"}
            </button>

            <button
              type="button"
              onClick={verifyStored}
              disabled={verifyMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-70"
            >
              Verify stored copy
            </button>

            <input
              ref={verifyFileInput}
              type="file"
              className="hidden"
              accept="*/*"
              onChange={(e) => verifyPickedFile(e.target.files?.[0])}
            />
          </div>

          <p className="text-[10.5px] leading-snug text-muted-foreground">
            Pick the original document to re-check it byte-for-byte against the hash recorded in the
            server database.
          </p>

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
                ? "Integrity confirmed — the document matches the record stored in the database"
                : "Integrity check FAILED — the document does not match the stored record"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
