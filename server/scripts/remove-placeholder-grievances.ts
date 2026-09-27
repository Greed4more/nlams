import "dotenv/config";
import { PrismaClient } from "@prisma/client";

/**
 * One-off cleanup for placeholder/test grievance tickets left in a demo
 * database (e.g. a "Hello World" ticket created while smoke-testing the
 * submit flow). Safer than a full re-seed when the register already holds
 * real demo data:
 *
 *   cd server && npx tsx scripts/remove-placeholder-grievances.ts
 *
 * Matches only obviously non-statutory text — nothing resembling a real
 * title-correction ticket is touched.
 */
const prisma = new PrismaClient();

const PLACEHOLDER_PATTERNS = [
  "hello world",
  "test ticket",
  "testing 123",
  "asdf",
  "lorem ipsum",
];

async function main() {
  const result = await prisma.grievanceTicket.deleteMany({
    where: {
      OR: PLACEHOLDER_PATTERNS.flatMap((needle) => [
        { issueCategory: { contains: needle, mode: "insensitive" as const } },
        { description: { contains: needle, mode: "insensitive" as const } },
      ]),
    },
  });

  if (result.count === 0) {
    console.log("No placeholder grievance tickets found — nothing to delete.");
    return;
  }
  console.log(`Deleted ${result.count} placeholder grievance ticket(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
