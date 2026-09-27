/**
 * Government file-number style reference derived deterministically from a
 * proposal record — mirrors the DoLR file numbering convention
 * (`F.No. <section>/<file>/<year>-LA`) without needing a database column.
 */
export function fileNumberOf(proposal: { id: string; initiatedAt: string }): string {
  const num = Number(proposal.id.replace(/\D/g, "")) || 1;
  const year = new Date(proposal.initiatedAt).getFullYear();
  const section = (num % 30) + 3;
  const file = String(((num * 7) % 90) + 1).padStart(2, "0");
  return `F.No. ${section}/${file}/${year}-LA`;
}
