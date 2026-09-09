import crypto from "crypto";
import { Prisma, type AuditAction, type RfctlarrStage } from "@prisma/client";
import { prisma } from "../db.js";

export const GENESIS_HASH = "0".repeat(64);

type Db = Prisma.TransactionClient | typeof prisma;

/** Recursively sorts object keys for deterministic canonical JSON serialization. */
export function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalJsonStringify).join(",")}]`;
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const entries = keys.map(
    (k) => `${JSON.stringify(k)}:${canonicalJsonStringify((obj as Record<string, unknown>)[k])}`,
  );
  return `{${entries.join(",")}}`;
}

export function computeHash(data: Buffer | string | Record<string, unknown>): string {
  const hash = crypto.createHash("sha256");
  if (Buffer.isBuffer(data)) hash.update(data);
  else if (typeof data === "object") hash.update(canonicalJsonStringify(data));
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
    createdAt?: Date;
  },
) {
  // Ordered by `id` (Prisma's cuid is monotonically increasing per insertion),
  // not `createdAt` — that field is caller-supplied (seed data backdates it),
  // so two events can share a timestamp and break tie-resolution.
  const lastEntry = await db.auditLog.findFirst({ orderBy: { id: "desc" } });
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
      ...(params.createdAt ? { createdAt: params.createdAt } : {}),
    },
  });
}

export interface ChainVerification {
  chainIntact: boolean;
  totalRecords: number;
  verifiedBlocks: number;
  genesisHash: string;
  headHash: string | null;
  brokenRecordId?: string;
  brokenAtIndex?: number;
  reason?: string;
}

/** Walks the full audit_logs table in insertion order and recomputes every hash. */
export async function verifyChainIntegrity(): Promise<ChainVerification> {
  const logs = await prisma.auditLog.findMany({ orderBy: { id: "asc" } });
  if (logs.length === 0) {
    return {
      chainIntact: true,
      totalRecords: 0,
      verifiedBlocks: 0,
      genesisHash: GENESIS_HASH,
      headHash: null,
    };
  }

  let expectedPrevious = GENESIS_HASH;
  let verifiedCount = 0;
  let headHash: string | null = null;

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
        verifiedBlocks: verifiedCount,
        genesisHash: GENESIS_HASH,
        headHash,
        brokenAtIndex: i,
        brokenRecordId: log.id,
        reason: `Block #${i + 1} previousHash (${log.previousHash?.slice(0, 16)}...) does not match expected parent hash (${expectedPrevious.slice(0, 16)}...).`,
      };
    }
    const recomputed = computeHash(
      `${log.previousHash}:${log.proposalId}:${log.action}:${log.eventPayloadHash}:${log.fileHash ?? ""}`,
    );
    if (recomputed !== log.chainHash) {
      return {
        chainIntact: false,
        totalRecords: logs.length,
        verifiedBlocks: verifiedCount,
        genesisHash: GENESIS_HASH,
        headHash,
        brokenAtIndex: i,
        brokenRecordId: log.id,
        reason: `Block #${i + 1} chainHash mismatch (${log.chainHash.slice(0, 16)}... vs calculated ${recomputed.slice(0, 16)}...) — record data or payload was tampered with.`,
      };
    }
    expectedPrevious = log.chainHash;
    headHash = log.chainHash;
    verifiedCount++;
  }

  return {
    chainIntact: true,
    totalRecords: logs.length,
    verifiedBlocks: verifiedCount,
    genesisHash: GENESIS_HASH,
    headHash,
  };
}
