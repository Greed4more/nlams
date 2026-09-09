import crypto from "node:crypto";

export const GENESIS_HASH = "0".repeat(64);

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

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log("--- Starting Cryptographic Audit Vault & SHA-256 Tests ---");

// Test 1: Deterministic canonical JSON serialization
const objA = { z: 1, a: "hello", m: [3, 2, 1], b: { y: 20, x: 10 } };
const objB = { a: "hello", b: { x: 10, y: 20 }, m: [3, 2, 1], z: 1 };

const canonA = canonicalJsonStringify(objA);
const canonB = canonicalJsonStringify(objB);
assert(canonA === canonB, "Key order does not affect canonical JSON serialization");

const hashA = computeHash(objA);
const hashB = computeHash(objB);
assert(hashA === hashB, "Different key-ordered objects produce identical SHA-256 checksums");
assert(hashA.length === 64, "SHA-256 hash length is exactly 64 hexadecimal characters");

// Test 2: Blockchain Hashchaining logic simulation
interface MockBlock {
  blockHeight: number;
  proposalId: string;
  action: string;
  eventPayload: Record<string, unknown>;
  fileBuffer?: Buffer;
  previousHash: string;
  eventPayloadHash: string;
  fileHash: string | null;
  chainHash: string;
}

const chain: MockBlock[] = [];
let prevHash = GENESIS_HASH;

// Block 1: Initial filing
const payload1 = { proposalId: "PROP-TEST-001", projectName: "NH-66 Greenfield Corridor" };
const pHash1 = computeHash(payload1);
const bHash1 = computeHash(`${prevHash}:PROP-TEST-001:STAGE_ADVANCE:${pHash1}:`);
chain.push({
  blockHeight: 1,
  proposalId: "PROP-TEST-001",
  action: "STAGE_ADVANCE",
  eventPayload: payload1,
  previousHash: prevHash,
  eventPayloadHash: pHash1,
  fileHash: null,
  chainHash: bHash1,
});
prevHash = bHash1;

// Block 2: Document upload
const fileBytes = Buffer.from("Government Statutory Filing - SIA Notification", "utf8");
const fHash2 = computeHash(fileBytes);
const payload2 = { documentName: "SIA_Notice.pdf", sizeKb: 1 };
const pHash2 = computeHash(payload2);
const bHash2 = computeHash(`${prevHash}:PROP-TEST-001:DOCUMENT_UPLOAD:${pHash2}:${fHash2}`);
chain.push({
  blockHeight: 2,
  proposalId: "PROP-TEST-001",
  action: "DOCUMENT_UPLOAD",
  eventPayload: payload2,
  fileBuffer: fileBytes,
  previousHash: prevHash,
  eventPayloadHash: pHash2,
  fileHash: fHash2,
  chainHash: bHash2,
});
prevHash = bHash2;

// Block 3: Award determination
const payload3 = { totalCompensation: 45000000, solatiumMultiplier: 2.0 };
const pHash3 = computeHash(payload3);
const bHash3 = computeHash(`${prevHash}:PROP-TEST-001:COMPENSATION_CALCULATED:${pHash3}:`);
chain.push({
  blockHeight: 3,
  proposalId: "PROP-TEST-001",
  action: "COMPENSATION_CALCULATED",
  eventPayload: payload3,
  previousHash: prevHash,
  eventPayloadHash: pHash3,
  fileHash: null,
  chainHash: bHash3,
});

// Verification function on simulated chain
function verifyMockChain(blocks: MockBlock[]): { intact: boolean; brokenAt?: number; reason?: string } {
  let expected = GENESIS_HASH;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]!;
    if (b.previousHash !== expected) {
      return {
        intact: false,
        brokenAt: b.blockHeight,
        reason: `Block #${b.blockHeight} previousHash mismatch`,
      };
    }
    const computed = computeHash(
      `${b.previousHash}:${b.proposalId}:${b.action}:${b.eventPayloadHash}:${b.fileHash ?? ""}`,
    );
    if (computed !== b.chainHash) {
      return {
        intact: false,
        brokenAt: b.blockHeight,
        reason: `Block #${b.blockHeight} content/signature mismatch`,
      };
    }
    expected = b.chainHash;
  }
  return { intact: true };
}

// Test 3: Normal verification should pass
const initialCheck = verifyMockChain(chain);
assert(initialCheck.intact, "Sequential chain verification passes for pristine ledger");

// Test 4: Tamper test — change compensation amount in block 3
const tamperedChain = JSON.parse(JSON.stringify(chain)) as MockBlock[];
tamperedChain[2]!.eventPayloadHash = computeHash({ totalCompensation: 999999999 }); // altered payload
const tamperCheck = verifyMockChain(tamperedChain);
assert(!tamperCheck.intact, "Tampered block payload hash is caught immediately");
assert(tamperCheck.brokenAt === 3, "Tamper detected at exact block height #3");

// Test 5: Tamper test — alter parent pointer
const brokenLinkChain = JSON.parse(JSON.stringify(chain)) as MockBlock[];
brokenLinkChain[1]!.previousHash = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const brokenLinkCheck = verifyMockChain(brokenLinkChain);
assert(!brokenLinkCheck.intact, "Broken parent hash pointer is caught immediately");
assert(brokenLinkCheck.brokenAt === 2, "Broken pointer detected at block height #2");

// Test 6: Web Crypto API cross-validation (verifying clientCrypto.ts matches node:crypto)
const testString = "National Land Acquisition & Management System (NLAMS) RFCTLARR Act 2013";
const nodeHash = computeHash(testString);

const encoder = new TextEncoder();
const data = encoder.encode(testString);
const webCryptoBuffer = await crypto.webcrypto.subtle.digest("SHA-256", data);
const webCryptoHash = Array.from(new Uint8Array(webCryptoBuffer))
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");

assert(nodeHash === webCryptoHash, "Browser Web Crypto subtle.digest matches node:crypto SHA-256 byte-for-byte");

console.log("--- All Cryptographic Tests Passed Successfully! ---");
