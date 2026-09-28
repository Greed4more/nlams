import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, FileText, Printer } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useProposalQuery } from "@/hooks/useProposals";
import { STAGE_ORDER, formatINRFull } from "@/data/mockData";
import type { Proposal } from "@/data/mockData";
import { fileNumberOf } from "@/lib/fileNumber";
import {
  STAGE_EN,
  downloadProposalDossier,
  hectaresToAcres,
  openProposalDossier,
} from "@/lib/proposalDossier";

export const Route = createFileRoute("/dossier/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Proposal Dossier ${params.id} — BHUMITRA` },
      {
        name: "description",
        content: `Downloadable statutory proposal dossier for ${params.id}.`,
      },
    ],
  }),
  component: ProposalDossierPage,
});

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-dotted border-border pb-2">
      <div className="text-[10px] uppercase tracking-[0.09em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[13px] font-semibold text-foreground">{value}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mt-8 border-b border-border pb-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </h2>
  );
}

function DossierDocument({ proposal }: { proposal: Proposal }) {
  const totalAreaHa = proposal.parcels.reduce((s, p) => s + p.areaHa, 0);
  const currentIdx = STAGE_ORDER.indexOf(proposal.currentStage);

  return (
    <article className="mx-auto max-w-[900px] bg-white p-10 text-foreground shadow-sm print:max-w-none print:p-2 print:shadow-none">
      <header className="flex items-start justify-between gap-4 border-b-[3px] border-double border-foreground/70 pb-4">
        <div>
          <div className="font-serif text-[17px] font-bold leading-tight">BHUMITRA · भूमित्र</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            National Land Acquisition &amp; Management System · Department of Land Resources
          </div>
          <div className="text-[11px] text-muted-foreground">
            RFCTLARR Act, 2013 — Statutory Acquisition Proposal Record
          </div>
        </div>
        <div className="text-right text-[11px] text-muted-foreground">
          <div>
            File No. <strong className="text-foreground">{fileNumberOf(proposal)}</strong>
          </div>
          <div className="num">{proposal.id}</div>
          <div className="mt-1 inline-block border border-foreground/70 px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] text-foreground">
            {STAGE_EN[proposal.currentStage].toUpperCase()}
          </div>
        </div>
      </header>

      <SectionTitle>1 · Project Particulars</SectionTitle>
      <h3 className="mt-2 text-[15px] font-semibold">{proposal.projectName}</h3>
      <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        <Field label="Requiring Body" value={proposal.requiringBody} />
        <Field label="State / District" value={`${proposal.state} · ${proposal.district}`} />
        <Field label="Date Initiated" value={fmtDate(proposal.initiatedAt)} />
        <Field label="Stage Entered" value={fmtDate(proposal.stageEnteredAt)} />
        <Field
          label="Total Area Notified"
          value={`${proposal.totalAreaHa.toFixed(2)} Ha · ${hectaresToAcres(totalAreaHa).toFixed(2)} Acres`}
        />
        <Field label="Affected Families" value={String(proposal.affectedFamilies)} />
      </div>

      <SectionTitle>2 · RFCTLARR Workflow Position</SectionTitle>
      <table className="mt-2 w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-muted/60">
            {["#", "Stage", "Code", "Status"].map((h) => (
              <th
                key={h}
                className="border border-border px-2 py-1.5 text-left text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STAGE_ORDER.map((stage, i) => (
            <tr key={stage}>
              <td className="num border border-border px-2 py-1.5">{i + 1}</td>
              <td className="border border-border px-2 py-1.5">{STAGE_EN[stage]}</td>
              <td className="border border-border px-2 py-1.5 text-muted-foreground">{stage}</td>
              <td
                className={
                  "border border-border px-2 py-1.5 font-semibold " +
                  (i < currentIdx
                    ? "text-status-ok"
                    : i === currentIdx
                      ? "text-status-warn"
                      : "text-muted-foreground")
                }
              >
                {i < currentIdx ? "Completed" : i === currentIdx ? "In progress" : "Pending"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionTitle>3 · Land Parcels Notified</SectionTitle>
      <div className="overflow-x-auto">
        <table className="mt-2 w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-muted/60">
              {[
                "ULPIN",
                "Khasra / Survey No.",
                "Record Term",
                "Area (Ha)",
                "Area (Acres)",
                "Zone",
                "Owner",
                "Assessed",
                "Disbursed",
              ].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap border border-border px-2 py-1.5 text-left text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {proposal.parcels.map((p) => (
              <tr key={p.ulpin}>
                <td className="num border border-border px-2 py-1.5 font-mono text-[11px]">
                  {p.ulpin}
                </td>
                <td className="num border border-border px-2 py-1.5 font-mono text-[11px]">
                  {p.khasraNo}
                </td>
                <td className="border border-border px-2 py-1.5">{p.vernacularTerm.standard}</td>
                <td className="num border border-border px-2 py-1.5 text-right">
                  {p.areaHa.toFixed(2)}
                </td>
                <td className="num border border-border px-2 py-1.5 text-right">
                  {hectaresToAcres(p.areaHa).toFixed(2)}
                </td>
                <td className="border border-border px-2 py-1.5">
                  {p.classification === "URBAN" ? "Urban" : "Rural"}
                </td>
                <td className="border border-border px-2 py-1.5">
                  {p.ownerName}
                  {p.coOwners > 0 ? ` (+${p.coOwners})` : ""}
                </td>
                <td className="num border border-border px-2 py-1.5 text-right">
                  {formatINRFull(p.compensationAssessed)}
                </td>
                <td className="num border border-border px-2 py-1.5 text-right">
                  {formatINRFull(p.compensationDisbursed)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/60 font-semibold">
              <td className="border border-border px-2 py-1.5" colSpan={3}>
                Total ({proposal.parcels.length} parcels)
              </td>
              <td className="num border border-border px-2 py-1.5 text-right">
                {totalAreaHa.toFixed(2)}
              </td>
              <td className="num border border-border px-2 py-1.5 text-right">
                {hectaresToAcres(totalAreaHa).toFixed(2)}
              </td>
              <td className="border border-border px-2 py-1.5" colSpan={2}>
                {proposal.affectedFamilies} families affected
              </td>
              <td className="num border border-border px-2 py-1.5 text-right">
                {formatINRFull(proposal.compensation.assessed)}
              </td>
              <td className="num border border-border px-2 py-1.5 text-right">
                {formatINRFull(proposal.compensation.disbursed)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <SectionTitle>4 · Compensation Summary</SectionTitle>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(
          [
            ["Assessed", proposal.compensation.assessed],
            ["Disbursed", proposal.compensation.disbursed],
            ["Pending", proposal.compensation.pending],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="border border-border bg-muted/30 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
              {label}
            </div>
            <div className="num mt-0.5 text-[16px] font-bold">{formatINRFull(value)}</div>
          </div>
        ))}
      </div>

      <SectionTitle>5 · Document Register</SectionTitle>
      <table className="mt-2 w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-muted/60">
            {["Document", "Type", "Filed On", "Size", "Integrity"].map((h) => (
              <th
                key={h}
                className="border border-border px-2 py-1.5 text-left text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {proposal.documents.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="border border-border px-2 py-4 text-center text-muted-foreground"
              >
                No statutory document is filed at this stage of the workflow.
              </td>
            </tr>
          )}
          {proposal.documents.map((d) => (
            <tr key={d.id}>
              <td className="border border-border px-2 py-1.5">{d.name}</td>
              <td className="border border-border px-2 py-1.5">{d.type.replaceAll("_", " ")}</td>
              <td className="num border border-border px-2 py-1.5">{fmtDate(d.uploadedAt)}</td>
              <td className="num border border-border px-2 py-1.5 text-right">{d.sizeKb} KB</td>
              <td className="border border-border px-2 py-1.5">
                {d.verified ? "Integrity verified" : "Not yet verified"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionTitle>6 · Certification</SectionTitle>
      <p className="mt-2 border border-border bg-muted/20 px-3 py-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
        This dossier is generated from the BHUMITRA register. Document integrity is anchored to the
        SHA-256 content checksums recorded in the BHUMITRA Cryptographic Audit Vault ledger. Figures
        are statutory assessments under the Right to Fair Compensation and Transparency in Land
        Acquisition, Rehabilitation and Resettlement Act, 2013 and are subject to award proceedings.
      </p>

      <footer className="mt-8 border-t border-border pt-2.5 text-[10.5px] text-muted-foreground">
        Generated {new Date().toLocaleString("en-IN")} · Record {proposal.id} · This is a
        system-generated document and does not require a physical signature.
      </footer>
    </article>
  );
}

function ProposalDossierPage() {
  const { id } = Route.useParams();
  const { data: proposal, isLoading } = useProposalQuery(id);

  return (
    <AppShell breadcrumb={["Home", "Proposals", id, "Dossier"]}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link
          to="/proposals/$id"
          params={{ id }}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to proposal
        </Link>
        {proposal && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openProposalDossier(proposal)}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              <FileText className="size-3.5" />
              Open in new tab
            </button>
            <button
              type="button"
              onClick={() => downloadProposalDossier(proposal)}
              className="inline-flex items-center gap-1.5 rounded-[4px] bg-status-info px-2.5 py-1.5 text-[11.5px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Download className="size-3.5" />
              Download document
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Printer className="size-3.5" />
              Print / Save as PDF
            </button>
          </div>
        )}
      </div>

      {isLoading && <div className="shimmer h-[520px] w-full" />}
      {!isLoading && !proposal && (
        <div className="panel p-6 text-center text-[13px] text-muted-foreground">
          No proposal record found against this identifier.
        </div>
      )}
      {proposal && <DossierDocument proposal={proposal} />}
    </AppShell>
  );
}
