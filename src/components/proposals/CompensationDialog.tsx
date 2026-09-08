import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Gavel } from "lucide-react";
import type { Parcel } from "@/data/mockData";
import { formatINRFull } from "@/data/mockData";
import { ApiError } from "@/lib/api";
import { useCalculateCompensationMutation } from "@/hooks/useCompensation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Sec. 26-30 statutory award finalization — persists a CompensationRecord, audit-hashes it, and mocks a PFMS disbursal receipt. */
export function CompensationDialog({
  proposalId,
  parcel,
  disabled,
}: {
  proposalId: string;
  parcel: Parcel;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [circleRate, setCircleRate] = useState("");
  const [avgTopHalfSaleDeeds, setAvgTopHalfSaleDeeds] = useState("");
  const [distanceFromUrbanKm, setDistanceFromUrbanKm] = useState("");
  const [structures, setStructures] = useState("");
  const [trees, setTrees] = useState("");
  const [notificationDate, setNotificationDate] = useState(todayIso());
  const [awardDate, setAwardDate] = useState(todayIso());
  const mutation = useCalculateCompensationMutation(proposalId, parcel.id);

  const handleSubmit = () => {
    mutation.mutate(
      {
        circleRate: Number(circleRate) || undefined,
        avgTopHalfSaleDeeds: Number(avgTopHalfSaleDeeds) || undefined,
        distanceFromUrbanKm: Number(distanceFromUrbanKm) || undefined,
        assetItems: { structures: Number(structures) || 0, trees: Number(trees) || 0 },
        notificationDate: new Date(notificationDate).toISOString(),
        awardDate: new Date(awardDate).toISOString(),
      },
      {
        onSuccess: (record) => {
          toast.success("Statutory award finalized", {
            description: `${parcel.ulpin} — ${formatINRFull(record.totalCompensation)} logged to the Audit Vault, PFMS receipt ${record.pfmsReceipt.pfmsTransactionId}.`,
          });
          setOpen(false);
        },
        onError: (err) => {
          toast.error("Could not calculate compensation", {
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
          disabled={disabled}
          aria-label={`Finalize compensation for ${parcel.ulpin}`}
          title={disabled ? "Requires LAO credentials" : "Finalize statutory award"}
          className="transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Gavel className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalize Statutory Award — {parcel.ulpin}</DialogTitle>
          <DialogDescription>
            Sec. 26-30 RFCTLARR Act 2013. Market value is the highest of the inputs provided; the
            rural multiplier is applied automatically from distance-to-urban bands.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="circleRate">Circle rate (₹/Ha)</Label>
            <Input
              id="circleRate"
              type="number"
              min="0"
              value={circleRate}
              onChange={(e) => setCircleRate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="saleDeeds">Avg. top-50% sale deeds (₹/Ha)</Label>
            <Input
              id="saleDeeds"
              type="number"
              min="0"
              value={avgTopHalfSaleDeeds}
              onChange={(e) => setAvgTopHalfSaleDeeds(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="distance">Distance from urban centre (km)</Label>
            <Input
              id="distance"
              type="number"
              min="0"
              value={distanceFromUrbanKm}
              onChange={(e) => setDistanceFromUrbanKm(e.target.value)}
            />
          </div>
          <div />
          <div className="space-y-1.5">
            <Label htmlFor="structures">Structures value (₹)</Label>
            <Input
              id="structures"
              type="number"
              min="0"
              value={structures}
              onChange={(e) => setStructures(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trees">Trees/crops value (₹)</Label>
            <Input
              id="trees"
              type="number"
              min="0"
              value={trees}
              onChange={(e) => setTrees(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notifDate">SIA notification date</Label>
            <Input
              id="notifDate"
              type="date"
              value={notificationDate}
              onChange={(e) => setNotificationDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="awardDate">Award date</Label>
            <Input
              id="awardDate"
              type="date"
              value={awardDate}
              onChange={(e) => setAwardDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            disabled={mutation.isPending || (!circleRate && !avgTopHalfSaleDeeds)}
            onClick={handleSubmit}
          >
            {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
            Calculate &amp; Finalize
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
