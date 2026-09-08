import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireNlamsUser } from "../middleware/auth.js";
import { proposalScopeWhere } from "../lib/scope.js";
import { canAct } from "../lib/stages.js";
import { addAuditEntry } from "../lib/auditVault.js";

export const grievancesRouter = Router();

grievancesRouter.use(requireNlamsUser);

const GRIEVANCE_SLA_DAYS = 15;

const submitBody = z.object({
  proposalId: z.string(),
  parcelId: z.string().optional(),
  issueCategory: z.string().min(1),
  description: z.string().min(1),
  evidenceUrl: z.string().url().optional(),
});

/** POST /api/grievances — submit a land-title/parcel correction ticket, 15-day statutory SLA. */
grievancesRouter.post("/", async (req, res) => {
  const user = req.nlamsUser!;
  const parsed = submitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid grievance input", details: parsed.error.flatten() });
    return;
  }

  const proposal = await prisma.proposal.findFirst({
    where: { id: parsed.data.proposalId, ...proposalScopeWhere(user) },
  });
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  if (parsed.data.parcelId) {
    const parcel = await prisma.parcel.findFirst({
      where: { id: parsed.data.parcelId, proposalId: proposal.id },
    });
    if (!parcel) {
      res.status(404).json({ error: "Parcel not found on this proposal" });
      return;
    }
  }

  const slaDeadline = new Date(Date.now() + GRIEVANCE_SLA_DAYS * 24 * 60 * 60 * 1000);

  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.grievanceTicket.create({
      data: {
        proposalId: proposal.id,
        parcelId: parsed.data.parcelId ?? null,
        submittedByUserId: user.id,
        issueCategory: parsed.data.issueCategory,
        description: parsed.data.description,
        evidenceUrl: parsed.data.evidenceUrl ?? null,
        slaDeadline,
      },
    });
    await addAuditEntry(tx, {
      proposalId: proposal.id,
      userId: user.id,
      action: "GRIEVANCE_SUBMITTED",
      eventPayload: { grievanceId: created.id, issueCategory: created.issueCategory },
    });
    return created;
  });

  res.status(201).json(ticket);
});

/** GET /api/grievances — list grievances in the caller's state scope. */
grievancesRouter.get("/", async (req, res) => {
  const tickets = await prisma.grievanceTicket.findMany({
    where: { proposal: proposalScopeWhere(req.nlamsUser!) },
    include: { proposal: { select: { projectName: true, state: true, district: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(tickets);
});

/** GET /api/grievances/:id — ticket detail with a computed SLA-breach flag. */
grievancesRouter.get("/:id", async (req, res) => {
  const ticket = await prisma.grievanceTicket.findFirst({
    where: { id: req.params.id, proposal: proposalScopeWhere(req.nlamsUser!) },
    include: { submittedBy: { select: { name: true, role: true } } },
  });
  if (!ticket) {
    res.status(404).json({ error: "Grievance ticket not found" });
    return;
  }
  const slaBreached =
    new Date() > ticket.slaDeadline && ticket.status !== "RESOLVED" && ticket.status !== "REJECTED";
  res.json({ ...ticket, slaBreached });
});

const resolveBody = z.object({
  status: z.enum(["UNDER_REVIEW", "FIELD_VERIFICATION", "RESOLVED", "REJECTED"]),
  updatedProvenance: z
    .enum(["ULPIN_VERIFIED", "SVAMITVA_DIGITISED", "LEGACY_MIGRATED", "SELF_DECLARED_PENDING"])
    .optional(),
});

/** PATCH /api/grievances/:id/resolve — authorized officer resolve/reject; updates linked parcel provenance. */
grievancesRouter.patch("/:id/resolve", async (req, res) => {
  const user = req.nlamsUser!;
  if (!canAct(user.role)) {
    res.status(403).json({ error: "This role cannot execute statutory actions" });
    return;
  }

  const ticket = await prisma.grievanceTicket.findFirst({
    where: { id: req.params.id, proposal: proposalScopeWhere(user) },
  });
  if (!ticket) {
    res.status(404).json({ error: "Grievance ticket not found" });
    return;
  }

  const parsed = resolveBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid resolution input", details: parsed.error.flatten() });
    return;
  }

  const { status, updatedProvenance } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const updatedTicket = await tx.grievanceTicket.update({
      where: { id: ticket.id },
      data: {
        status,
        resolvedAt: status === "RESOLVED" || status === "REJECTED" ? new Date() : null,
      },
    });

    let updatedParcel = null;
    if (status === "RESOLVED" && ticket.parcelId && updatedProvenance) {
      updatedParcel = await tx.parcel.update({
        where: { id: ticket.parcelId },
        data: { provenance: updatedProvenance },
      });
    }

    await addAuditEntry(tx, {
      proposalId: ticket.proposalId,
      userId: user.id,
      action: "GRIEVANCE_RESOLVED",
      eventPayload: { grievanceId: ticket.id, status },
    });

    return { ticket: updatedTicket, parcel: updatedParcel };
  });

  res.json(result);
});
