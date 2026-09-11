import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { STATES, REQUIRING_BODY_LIST, DISTRICTS_BY_STATE } from "@/data/mockData";
import { ApiError } from "@/lib/api";
import { useRole } from "@/context/RoleContext";
import { useCreateProposalMutation } from "@/hooks/useProposals";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** INTAKE-stage proposal submission — the pre-funding entry point into the RFCTLARR pipeline. */
export function NewProposalDialog() {
  const { states: scopeStates } = useRole();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [requiringBody, setRequiringBody] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [affectedFamilies, setAffectedFamilies] = useState("");
  const create = useCreateProposalMutation();

  // National-scope users (DoLR Secretary) may file for any state; state-scoped
  // roles are restricted to their own assignment, matching the server's check.
  const availableStates = scopeStates ?? STATES;

  const reset = () => {
    setProjectName("");
    setRequiringBody("");
    setState("");
    setDistrict("");
    setAffectedFamilies("");
  };

  const handleSubmit = () => {
    const families = Number(affectedFamilies);
    if (!projectName.trim() || !requiringBody || !state || !district || !affectedFamilies) {
      toast.error(
        "Project name, requiring body, state, district and affected families are required",
      );
      return;
    }
    if (!Number.isInteger(families) || families < 0) {
      toast.error("Affected families must be a non-negative whole number");
      return;
    }
    create.mutate(
      {
        projectName: projectName.trim(),
        requiringBody,
        state,
        district,
        affectedFamilies: families,
      },
      {
        onSuccess: (proposal) => {
          toast.success("Proposal submitted", {
            description: `${proposal.id} registered at INTAKE — no funds committed yet.`,
          });
          reset();
          setOpen(false);
          void navigate({ to: "/proposals/$id", params: { id: proposal.id } });
        },
        onError: (err) => {
          toast.error("Could not submit proposal", {
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
          New Proposal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit New Proposal</DialogTitle>
          <DialogDescription>
            Registers a land acquisition proposal at the INTAKE stage under RFCTLARR Act 2013 —
            before Sec. 11 notification, SIA consent, or any compensation is committed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="projectName">Project name</Label>
            <Input
              id="projectName"
              placeholder="e.g. NH-27 Widening — Package 3"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Requiring body</Label>
            <Select value={requiringBody} onValueChange={setRequiringBody}>
              <SelectTrigger>
                <SelectValue placeholder="Select requiring body" />
              </SelectTrigger>
              <SelectContent>
                {REQUIRING_BODY_LIST.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>State</Label>
              <Select
                value={state}
                onValueChange={(v) => {
                  setState(v);
                  setDistrict("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {availableStates.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
              <Select value={district} onValueChange={setDistrict} disabled={!state}>
                <SelectTrigger>
                  <SelectValue placeholder={state ? "Select district" : "Select a state first"} />
                </SelectTrigger>
                <SelectContent>
                  {(DISTRICTS_BY_STATE[state] ?? []).map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="affectedFamilies">Estimated affected families</Label>
            <Input
              id="affectedFamilies"
              type="number"
              min="0"
              value={affectedFamilies}
              onChange={(e) => setAffectedFamilies(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" disabled={create.isPending} onClick={handleSubmit}>
            {create.isPending && <Loader2 className="size-3.5 animate-spin" />}
            Submit Proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
