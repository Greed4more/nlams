import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Gavel } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  useResolveGrievanceMutation,
  type GrievanceTicket,
  type GrievanceStatus,
} from "@/hooks/useGrievances";
import type { ParcelProvenance } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS: { value: Exclude<GrievanceStatus, "SUBMITTED">; label: string }[] = [
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "FIELD_VERIFICATION", label: "Field verification" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "REJECTED", label: "Rejected" },
];

const PROVENANCE_OPTIONS: { value: ParcelProvenance; label: string }[] = [
  { value: "ULPIN_VERIFIED", label: "ULPIN verified" },
  { value: "SVAMITVA_DIGITISED", label: "SVAMITVA digitised" },
];

export function ResolveGrievanceDialog({ ticket }: { ticket: GrievanceTicket }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Exclude<GrievanceStatus, "SUBMITTED"> | "">("");
  const [provenance, setProvenance] = useState<ParcelProvenance | "">("");
  const resolve = useResolveGrievanceMutation(ticket.id);

  const handleSubmit = () => {
    if (!status) {
      toast.error("Choose a resolution status");
      return;
    }
    resolve.mutate(
      { status, ...(status === "RESOLVED" && provenance ? { updatedProvenance: provenance } : {}) },
      {
        onSuccess: () => {
          toast.success(`Ticket ${status === "RESOLVED" ? "resolved" : status.toLowerCase()}`);
          setOpen(false);
          setStatus("");
          setProvenance("");
        },
        onError: (err) => {
          toast.error("Could not update ticket", {
            description: err instanceof ApiError ? err.message : "Unknown error",
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-[4px] border border-border px-2 py-1 text-[11px] font-medium text-foreground/80 transition-colors hover:bg-muted"
        >
          <Gavel className="size-3.5" />
          Resolve
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve Grievance {ticket.id}</DialogTitle>
          <DialogDescription>{ticket.issueCategory}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as Exclude<GrievanceStatus, "SUBMITTED">)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {status === "RESOLVED" && ticket.parcelId && (
            <div className="space-y-1.5">
              <Label>Updated parcel provenance (optional)</Label>
              <Select
                value={provenance}
                onValueChange={(v) => setProvenance(v as ParcelProvenance)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No change" />
                </SelectTrigger>
                <SelectContent>
                  {PROVENANCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" disabled={resolve.isPending} onClick={handleSubmit}>
            {resolve.isPending && <Loader2 className="size-3.5 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
