import { Router, type RequestHandler } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireNlamsUser } from "../middleware/auth.js";
import { serializeDocument } from "../lib/serialize.js";
import { sha256Hex } from "../lib/hash.js";
import { proposalScopeWhere } from "../lib/scope.js";

export const documentsRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const DOC_TYPES = [
  "SIA_REPORT",
  "SEC_11_NOTIFICATION",
  "SEC_19_DECLARATION",
  "AWARD_ORDER",
  "RR_SCHEME",
] as const;

const uploadBody = z.object({ type: z.enum(DOC_TYPES) });

documentsRouter.use(requireNlamsUser);

/** POST /api/proposals/:proposalId/documents — multipart upload, field name "file". */
documentsRouter.post(
  "/proposals/:proposalId/documents",
  // @types/multer pulls in a separate @types/express@5 copy, which doesn't
  // structurally match the express@4 RequestHandler used elsewhere — cast at
  // the boundary rather than fighting the transitive types package version.
  upload.single("file") as unknown as RequestHandler,
  async (req, res) => {
    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.proposalId, ...proposalScopeWhere(req.nlamsUser!) },
    });
    if (!proposal) {
      res.status(404).json({ error: "Proposal not found" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Missing file" });
      return;
    }
    const parsed = uploadBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Missing or invalid document type" });
      return;
    }

    const sha256 = sha256Hex(req.file.buffer);
    const created = await prisma.$transaction(async (tx) => {
      const doc = await tx.documentRef.create({
        data: {
          proposalId: proposal.id,
          name: req.file!.originalname,
          type: parsed.data.type,
          sizeKb: Math.max(1, Math.round(req.file!.size / 1024)),
          sha256,
          fileData: Uint8Array.from(req.file!.buffer),
          contentType: req.file!.mimetype || "application/octet-stream",
          lastVerifiedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          proposalId: proposal.id,
          userId: req.nlamsUser!.id,
          action: "DOCUMENT_UPLOAD",
          metadata: { documentId: doc.id, name: doc.name, sha256 },
        },
      });
      return doc;
    });

    res.status(201).json(serializeDocument(created));
  },
);

/** POST /api/documents/:id/verify — recomputes SHA-256 over the stored bytes and compares. */
documentsRouter.post("/documents/:id/verify", async (req, res) => {
  const doc = await prisma.documentRef.findFirst({
    where: { id: req.params.id, proposal: proposalScopeWhere(req.nlamsUser!) },
  });
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const recomputed = sha256Hex(Buffer.from(doc.fileData));
  const matches = recomputed === doc.sha256;

  const updated = await prisma.$transaction(async (tx) => {
    const d = matches
      ? await tx.documentRef.update({ where: { id: doc.id }, data: { lastVerifiedAt: new Date() } })
      : doc;
    await tx.auditLog.create({
      data: {
        proposalId: doc.proposalId,
        userId: req.nlamsUser!.id,
        action: "DOCUMENT_VERIFY",
        metadata: { documentId: doc.id, matches, recomputedSha256: recomputed },
      },
    });
    return d;
  });

  res.json({ ...serializeDocument(updated), integrityMatch: matches });
});

/** GET /api/documents/:id/download — streams the stored bytes back. */
documentsRouter.get("/documents/:id/download", async (req, res) => {
  const doc = await prisma.documentRef.findFirst({
    where: { id: req.params.id, proposal: proposalScopeWhere(req.nlamsUser!) },
  });
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.setHeader("Content-Type", doc.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${doc.name}"`);
  res.send(Buffer.from(doc.fileData));
});
