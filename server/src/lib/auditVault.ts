import crypto from "crypto";
import { Prisma, type AuditAction, type RfctlarrStage } from "@prisma/client";
import { prisma } from "../db.js";

/** First block in the chain has no predecessor — matches Bhumitra's genesis hash. */
const GENESIS_HASH = "0".repeat(64);

type Db = Prisma.TransactionClient | typeof prisma;

export function computeHash(data: Buffer | string | Record<string, unknown>): string {
  const hash = crypto.createHash("sha256");
  if (Buffer.isBuffer(data)) hash.update(data);
  else if (typeof data === "object") hash.update(JSON.stringify(data));
  else hash.update(String(data));
  return hash.digest("hex");
}

/**
 * Cryptographic Audit Vault — ported from Bhumitra's audit_vault.service.js.
 * Every entry chains onto the previous one's `chainHash`, so the whole
 * `audit_logs` table forms a single tamper-evident, append-only ledger
 * (not just per-proposal). Pass the active transaction client (`tx`) when
 * called from inside a `prisma.$transaction(async (tx) => ...)` block so the
 * chain lookup + insert stay atomic with whatever else that transaction does.
 */
export async function addAuditEntry(
  db: Db,
  params: {
    proposalId: string;
    userId?: string | null;
    action: AuditAction;
    fromStage?: RfctlarrStage | null;
    toStage?: RfctlarrStage | null;
    fileBuffer?: Buffer | null;
    eventPayload?: Record<string, unknown>;
  },
) {
  const lastEntry = await db.auditLog.findFirst({ orderBy: { createdAt: "desc" } });
  const previousHash = lastEntry?.chainHash ?? GENESIS_HASH;

  const fileHash = params.fileBuffer ? computeHash(params.fileBuffer) : null;
  const eventPayloadHash = computeHash(params.eventPayload ?? {});
  const chainHash = computeHash(
    `${previousHash}:${params.proposalId}:${params.action}:${eventPayloadHash}:${fileHash ?? ""}`,
  );

  return db.auditLog.create({
    data: {
      proposalId: params.proposalId,
      userId: params.userId ?? null,
      action: params.action,
      fromStage: params.fromStage ?? null,
      toStage: params.toStage ?? null,
      metadata: (params.eventPayload as Prisma.InputJsonValue | undefined) ?? undefined,
      fileHash,
      eventPayloadHash,
      previousHash,
      chainHash,
    },
  });
}

export interface ChainVerification {
  chainIntact: boolean;
  totalRecords: number;
  brokenRecordId?: string;
  brokenAtIndex?: number;
  reason?: string;
}

/** Walks the full audit_logs table in insertion order and recomputes every hash. */
export async function verifyChainIntegrity(): Promise<ChainVerification> {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "asc" } });
  if (logs.length === 0) {
    return { chainIntact: true, totalRecords: 0 };
  }

  let expectedPrevious = GENESIS_HASH;
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]!;
    // Entries written before the Audit Vault existed have no hash fields —
    // they can't be verified, but they also can't break the chain: skip them
    // without advancing `expectedPrevious`.
    if (log.chainHash == null) continue;

    if (log.previousHash !== expectedPrevious) {
      return {
        chainIntact: false,
        totalRecords: logs.length,
        brokenAtIndex: i,
        brokenRecordId: log.id,
        reason: "Stored previousHash does not match the prior record's chainHash.",
      };
    }
    const recomputed = computeHash(
      `${log.previousHash}:${log.proposalId}:${log.action}:${log.eventPayloadHash}:${log.fileHash ?? ""}`,
    );
    if (recomputed !== log.chainHash) {
      return {
        chainIntact: false,
        totalRecords: logs.length,
        brokenAtIndex: i,
        brokenRecordId: log.id,
        reason: "Chain hash mismatch — record was tampered with.",
      };
    }
    expectedPrevious = log.chainHash;
  }

  return { chainIntact: true, totalRecords: logs.length };
}
