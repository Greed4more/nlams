import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useRole } from "@/context/RoleContext";
import { useSubmitGrievanceMutation } from "@/hooks/useGrievances";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SubmitGrievanceDialog() {
  const { scopedProposals } = useRole();
  const [open, setOpen] = useState(false);
  const [proposalId, setProposalId] = useState("");
  const [issueCategory, setIssueCategory] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const submit = useSubmitGrievanceMutation();

  const reset = () => {
    setProposalId("");
    setIssueCategory("");
    setDescription("");
    setEvidenceUrl("");
  };

  const handleSubmit = () => {
    if (!proposalId || !issueCategory || !description) {
      toast.error("Proposal, issue category, and description are required");
      return;
    }
    submit.mutate(
      { proposalId, issueCategory, description, evidenceUrl: evidenceUrl || undefined },
      {
        onSuccess: () => {
          toast.success("Grievance ticket submitted", {
            description: "15-day statutory SLA clock started.",
          });
          reset();
          setOpen(false);
        },
        onError: (err) => {
          toast.error("Could not submit grievance", {
            description: err instanceof ApiError ? err.message : "Unknown error",
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-3.5" />
          Submit Grievance
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Grievance Ticket</DialogTitle>
          <DialogDescription>
            15-day statutory SLA for title/parcel correction tickets.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Proposal</Label>
            <Select value={proposalId} onValueChange={setProposalId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a proposal" />
              </SelectTrigger>
              <SelectContent>
                {scopedProposals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.id} — {p.projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="issueCategory">Issue category</Label>
            <Input
              id="issueCategory"
              placeholder="e.g. Unverified boundary, ownership dispute"
              value={issueCategory}
              onChange={(e) => setIssueCategory(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="evidenceUrl">Evidence URL (optional)</Label>
            <Input
              id="evidenceUrl"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" disabled={submit.isPending} onClick={handleSubmit}>
            {submit.isPending && <Loader2 className="size-3.5 animate-spin" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
