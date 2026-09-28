import { STAGE_ORDER, formatINRFull } from "@/data/mockData";
import type { Proposal, RfctlarrStage } from "@/data/mockData";
import { fileNumberOf } from "@/lib/fileNumber";

/**
 * Proposal dossier generator — renders the complete statutory record for an
 * acquisition proposal as a self-contained document (styled HTML) so officers
 * can read it in full, download it as a file, or print it to PDF. The on-screen
 * /dossier/$id route renders the same content; this module is the downloadable
 * artefact and the single source of truth for its layout.
 */

export const STAGE_EN: Record<RfctlarrStage, string> = {
  INTAKE: "Intake",
  SIA: "Social Impact Assessment",
  SIA_APPRAISAL: "SIA Appraisal (Expert Group)",
  SEC_11: "Sec. 11 Preliminary Notification",
  SEC_19: "Sec. 19 Declaration",
  AWARD: "Sec. 23 Award",
  RR_COMPLETE: "R&R Complete",
};

const HECTARES_TO_ACRES = 2.47105;

export const hectaresToAcres = (ha: number) => ha * HECTARES_TO_ACRES;

const esc = (value: unknown): string =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtDateTime = (date: Date) =>
  date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function workflowTable(proposal: Proposal): string {
  const currentIdx = STAGE_ORDER.indexOf(proposal.currentStage);
  return STAGE_ORDER.map((stage, i) => {
    const status = i < currentIdx ? "Completed" : i === currentIdx ? "In progress" : "Pending";
    return `<tr>
      <td class="num">${i + 1}</td>
      <td>${esc(STAGE_EN[stage])}</td>
      <td>${esc(stage)}</td>
      <td class="${i < currentIdx ? "ok" : i === currentIdx ? "current" : "muted"}">${status}</td>
    </tr>`;
  }).join("");
}

function parcelRows(proposal: Proposal): string {
  return proposal.parcels
    .map(
      (p) => `<tr>
      <td class="num">${esc(p.ulpin)}</td>
      <td class="num">${esc(p.khasraNo)}</td>
      <td>${esc(p.vernacularTerm.standard)}</td>
      <td class="num right">${p.areaHa.toFixed(2)}</td>
      <td class="num right">${hectaresToAcres(p.areaHa).toFixed(2)}</td>
      <td>${p.classification === "URBAN" ? "Urban" : "Rural"}</td>
      <td>${esc(p.ownerName)}${p.coOwners > 0 ? ` (+${p.coOwners})` : ""}</td>
      <td class="num right">${esc(formatINRFull(p.compensationAssessed))}</td>
      <td class="num right">${esc(formatINRFull(p.compensationDisbursed))}</td>
    </tr>`,
    )
    .join("");
}

function documentRows(proposal: Proposal): string {
  if (proposal.documents.length === 0) {
    return `<tr><td colspan="5" class="muted center">No statutory document is filed at this stage of the workflow.</td></tr>`;
  }
  return proposal.documents
    .map(
      (d) => `<tr>
      <td>${esc(d.name)}</td>
      <td>${esc(d.type.replaceAll("_", " "))}</td>
      <td class="num">${fmtDate(d.uploadedAt)}</td>
      <td class="num right">${d.sizeKb} KB</td>
      <td>${d.verified ? "Integrity verified" : "Not yet verified"}</td>
    </tr>`,
    )
    .join("");
}

export function buildProposalDossierHtml(proposal: Proposal): string {
  const generatedAt = fmtDateTime(new Date());
  const totalAreaHa = proposal.parcels.reduce((s, p) => s + p.areaHa, 0);
  const currentStage = STAGE_EN[proposal.currentStage];

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Proposal Dossier — ${esc(proposal.id)} — ${esc(proposal.projectName)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f4f1ea; color: #1f1a14; font: 13px/1.55 "Segoe UI", Roboto, Arial, sans-serif; }
  .sheet { max-width: 900px; margin: 24px auto; background: #fff; padding: 40px 48px; box-shadow: 0 1px 3px rgba(0,0,0,.15); }
  .crest { display: flex; justify-content: space-between; gap: 16px; border-bottom: 3px double #1f1a14; padding-bottom: 14px; }
  .crest h1 { margin: 0; font-size: 17px; letter-spacing: .05em; }
  .crest .sub { font-size: 11px; color: #5a5145; margin-top: 2px; }
  .stamp { text-align: right; font-size: 10.5px; color: #5a5145; }
  .stamp .tag { display: inline-block; margin-top: 4px; border: 1px solid #1f1a14; padding: 2px 8px; font-weight: 700; letter-spacing: .08em; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .12em; color: #6b5f4d; margin: 28px 0 8px; border-bottom: 1px solid #d9d2c4; padding-bottom: 4px; }
  h3 { font-size: 15px; margin: 4px 0 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; background: #f2eee5; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #6b5f4d; padding: 6px 8px; border: 1px solid #ddd6c8; }
  td { padding: 6px 8px; border: 1px solid #e3ddd1; vertical-align: top; }
  .num { font-variant-numeric: tabular-nums; }
  .right { text-align: right; }
  .center { text-align: center; }
  .muted { color: #7c7263; }
  .ok { color: #0b6b39; font-weight: 600; }
  .current { color: #8a5a00; font-weight: 700; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 24px; }
  .field { border-bottom: 1px dotted #cfc7b8; padding: 6px 0; }
  .field .k { font-size: 10px; text-transform: uppercase; letter-spacing: .09em; color: #6b5f4d; }
  .field .v { font-size: 13px; font-weight: 600; margin-top: 2px; }
  .kpi { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 6px; }
  .kpi div { border: 1px solid #ddd6c8; background: #faf8f3; padding: 10px 12px; }
  .kpi .k { font-size: 10px; text-transform: uppercase; letter-spacing: .09em; color: #6b5f4d; }
  .kpi .v { font-size: 16px; font-weight: 700; margin-top: 3px; }
  tfoot td { font-weight: 700; background: #f2eee5; }
  footer { margin-top: 32px; border-top: 1px solid #d9d2c4; padding-top: 10px; font-size: 10.5px; color: #6b5f4d; }
  .notice { background: #fbf7ef; border: 1px solid #e6ddc9; padding: 10px 12px; font-size: 11.5px; color: #5a5145; }
  @media print { body { background: #fff; } .sheet { margin: 0; box-shadow: none; padding: 24px 28px; max-width: none; } }
</style>
</head>
<body>
<div class="sheet">
  <header class="crest">
    <div>
      <h1>BHUMITRA · भूमित्र</h1>
      <div class="sub">National Land Acquisition &amp; Management System · Department of Land Resources</div>
      <div class="sub">RFCTLARR Act, 2013 — Statutory Acquisition Proposal Record</div>
    </div>
    <div class="stamp">
      <div>File No. <strong>${esc(fileNumberOf(proposal))}</strong></div>
      <div class="num">${esc(proposal.id)}</div>
      <div class="tag">${esc(currentStage).toUpperCase()}</div>
    </div>
  </header>

  <h2>1 · Project Particulars</h2>
  <h3>${esc(proposal.projectName)}</h3>
  <div class="grid">
    <div class="field"><div class="k">Requiring Body</div><div class="v">${esc(proposal.requiringBody)}</div></div>
    <div class="field"><div class="k">State / District</div><div class="v">${esc(proposal.state)} · ${esc(proposal.district)}</div></div>
    <div class="field"><div class="k">Date Initiated</div><div class="v">${fmtDate(proposal.initiatedAt)}</div></div>
    <div class="field"><div class="k">Stage Entered</div><div class="v">${fmtDate(proposal.stageEnteredAt)}</div></div>
    <div class="field"><div class="k">Total Area Notified</div><div class="v">${proposal.totalAreaHa.toFixed(2)} Ha · ${hectaresToAcres(totalAreaHa).toFixed(2)} Acres</div></div>
    <div class="field"><div class="k">Affected Families</div><div class="v">${proposal.affectedFamilies}</div></div>
  </div>

  <h2>2 · RFCTLARR Workflow Position</h2>
  <table>
    <thead><tr><th>#</th><th>Stage</th><th>Code</th><th>Status</th></tr></thead>
    <tbody>${workflowTable(proposal)}</tbody>
  </table>

  <h2>3 · Land Parcels Notified</h2>
  <table>
    <thead><tr><th>ULPIN</th><th>Khasra / Survey No.</th><th>Record Term</th><th class="right">Area (Ha)</th><th class="right">Area (Acres)</th><th>Zone</th><th>Owner</th><th class="right">Assessed</th><th class="right">Disbursed</th></tr></thead>
    <tbody>${parcelRows(proposal)}</tbody>
    <tfoot>
      <tr>
        <td colspan="3">Total (${proposal.parcels.length} parcels)</td>
        <td class="num right">${proposal.parcels.reduce((s, p) => s + p.areaHa, 0).toFixed(2)}</td>
        <td class="num right">${hectaresToAcres(totalAreaHa).toFixed(2)}</td>
        <td colspan="2">${proposal.affectedFamilies} families affected</td>
        <td class="num right">${esc(formatINRFull(proposal.compensation.assessed))}</td>
        <td class="num right">${esc(formatINRFull(proposal.compensation.disbursed))}</td>
      </tr>
    </tfoot>
  </table>

  <h2>4 · Compensation Summary</h2>
  <div class="kpi">
    <div><div class="k">Assessed</div><div class="v">${esc(formatINRFull(proposal.compensation.assessed))}</div></div>
    <div><div class="k">Disbursed</div><div class="v">${esc(formatINRFull(proposal.compensation.disbursed))}</div></div>
    <div><div class="k">Pending</div><div class="v">${esc(formatINRFull(proposal.compensation.pending))}</div></div>
  </div>

  <h2>5 · Document Register</h2>
  <table>
    <thead><tr><th>Document</th><th>Type</th><th>Filed On</th><th class="right">Size</th><th>Integrity</th></tr></thead>
    <tbody>${documentRows(proposal)}</tbody>
  </table>

  <h2>6 · Certification</h2>
  <div class="notice">
    This dossier is generated from the BHUMITRA register. Document integrity is anchored to the
    SHA-256 content checksums recorded in the BHUMITRA Cryptographic Audit Vault ledger. Figures
    are statutory assessments under the Right to Fair Compensation and Transparency in Land
    Acquisition, Rehabilitation and Resettlement Act, 2013 and are subject to award proceedings.
  </div>

  <footer>
    Generated ${generatedAt} · Record ${esc(proposal.id)} · This is a system-generated document and does not require a physical signature.
  </footer>
</div>
</body>
</html>`;
}

export function openProposalDossier(proposal: Proposal) {
  const blob = new Blob([buildProposalDossierHtml(proposal)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function downloadProposalDossier(proposal: Proposal) {
  const blob = new Blob([buildProposalDossierHtml(proposal)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${proposal.id}-proposal-dossier.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4_000);
}
