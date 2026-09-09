/**
 * Browser-native Web Crypto utility for SHA-256 checksums and blockchain proof verification.
 * Standard Web Crypto API (SubtleCrypto) is available in all modern browsers and requires
 * no external heavy cryptographic dependencies.
 */

export const GENESIS_HASH = "0".repeat(64);

/** Converts an ArrayBuffer to a 64-character lowercase hex string. */
function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  const hexCodes: string[] = [];
  for (let i = 0; i < byteArray.length; i++) {
    const code = byteArray[i]!;
    hexCodes.push(code.toString(16).padStart(2, "0"));
  }
  return hexCodes.join("");
}

/** Computes the SHA-256 checksum of an uploaded file or Blob using browser Web Crypto. */
export async function computeFileSha256(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return bufferToHex(hashBuffer);
}

/** Computes the SHA-256 hash of a string using browser Web Crypto. */
export async function computeTextSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hashBuffer);
}

/** Deterministic canonical JSON serialization with sorted keys. */
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

/** Computes the SHA-256 checksum of an arbitrary JSON payload. */
export async function computePayloadSha256(payload: unknown): Promise<string> {
  const canonical = canonicalJsonStringify(payload ?? {});
  return computeTextSha256(canonical);
}

export interface BlockHashVerificationParams {
  previousHash: string | null;
  proposalId: string;
  action: string;
  eventPayloadHash: string | null;
  fileHash: string | null;
  chainHash: string | null;
}

/**
 * Independently verifies a block's hash client-side:
 * chainHash = SHA-256(previousHash : proposalId : action : eventPayloadHash : fileHash)
 */
export async function verifyBlockClientSide(
  block: BlockHashVerificationParams,
): Promise<{ matches: boolean; recomputedHash: string }> {
  const prev = block.previousHash ?? GENESIS_HASH;
  const payloadHash = block.eventPayloadHash ?? "";
  const fileHash = block.fileHash ?? "";
  const rawInput = `${prev}:${block.proposalId}:${block.action}:${payloadHash}:${fileHash}`;
  const recomputedHash = await computeTextSha256(rawInput);
  return {
    matches: recomputedHash === block.chainHash,
    recomputedHash,
  };
}
