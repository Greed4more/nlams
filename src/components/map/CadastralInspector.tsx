import type { ReactNode } from "react";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { Link } from "@tanstack/react-router";
import { Calculator, FileText, Locate, X } from "lucide-react";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point as turfPoint } from "@turf/helpers";
import { formatINRFull } from "@/data/mockData";
import type { BlockFeatureProperties } from "@/hooks/useAdminBoundaries";
import type { ParcelFeatureProperties } from "@/hooks/useParcels";
import { districtDisplayName } from "@/lib/westBengalDistrictNames";
import { cn } from "@/lib/utils";
import {
  PAYMENT_TONE_CLASS,
  PARCEL_STATUS_LABEL,
  paymentState,
  splitKhasra,
  statusFor,
  statusTone,
  toAcres,
  type Selection,
} from "./cadastral";

interface CadastralInspectorProps {
  selection: Selection;
  stateCode: string;
  onClose: () => void;
  onJumpToDistrict: (districtName: string) => void;
  /** Seeded ULPIN parcels for the district/block summary panels. */
  geojson: FeatureCollection<Polygon, ParcelFeatureProperties> | undefined;
  blocksData: FeatureCollection<Polygon | MultiPolygon, BlockFeatureProperties> | undefined;
}

/**
 * Right-hand "Cadastral Record & Land Title" inspector. Renders complete
 * parcel intelligence for the selected plot (seeded ULPIN parcel or the
 * Banglarbhumi fabric record) and compact roll-ups for district/block clicks.
 */
export function CadastralInspector({
  selection,
  stateCode,
  onClose,
  onJumpToDistrict,
  geojson,
  blocksData,
}: CadastralInspectorProps) {
  return (
    <aside className="absolute inset-y-0 right-0 z-[1000] flex w-[360px] max-w-[88vw] flex-col border-l border-border bg-card shadow-2xl">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="label-xs">Cadastral Record &amp; Land Title</div>
        <button
          type="button"
          aria-label="Close inspector"
          onClick={onClose}
          className="grid size-7 place-items-center rounded-[4px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {selection.kind === "parcel" && <ParcelRecord selection={selection} />}
        {selection.kind === "wbParcel" && <WbParcelRecord selection={selection} />}
        {selection.kind === "district" && (
          <DistrictRecord
            selection={selection}
            stateCode={stateCode}
            geojson={geojson}
            blocksData={blocksData}
          />
        )}
        {selection.kind === "block" && (
          <BlockRecord
            selection={selection}
            stateCode={stateCode}
            geojson={geojson}
            blocksData={blocksData}
            onJumpToDistrict={onJumpToDistrict}
          />
        )}
      </div>
    </aside>
  );
}

function ParcelRecord({ selection }: { selection: Extract<Selection, { kind: "parcel" }> }) {
  const p = selection.properties;
  const status = statusFor(p.ulpin);
  const { survey, subDivision } = splitKhasra(p.khasraNo);
  const pay = paymentState(p.compensationAssessed, p.compensationDisbursed);
  const pending = Math.max(0, p.compensationAssessed - p.compensationDisbursed);

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[22px] font-semibold leading-tight tracking-tight text-navy">
            Survey No. {survey}
            {subDivision ? `/${subDivision}` : ""}
          </h2>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            {p.district} · {p.state}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-[3px] border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em]",
            statusTone(status),
          )}
          title="Acquisition status for this parcel"
        >
          {PARCEL_STATUS_LABEL[status]}
        </span>
      </div>

      <div className="mt-3 rounded-[5px] border border-border bg-muted/40 px-3 py-2 text-[11px] leading-snug text-muted-foreground">
        Acquisition proceedings are recorded against proposal{" "}
        <span className="num font-medium text-foreground">{p.proposalId}</span> — {p.projectName}.
      </div>

      <Section title="Hissa Sub-divisions & Ownership">
        <p className="text-[11px] leading-snug text-muted-foreground">
          {subDivision
            ? `Hissa ${subDivision} is carved out of Survey No. ${survey}.`
            : `No separate Hissa sub-divisions are recorded for Survey No. ${survey}.`}{" "}
          Owner details are carried from the revenue register (demo dataset).
        </p>
        <Row label="Registered Owner" value={p.ownerName} />
        <Row label="Co-owners" value={String(p.coOwners)} mono />
        <Row label="Hissa / Sub-division" value={subDivision ?? "—"} mono />
      </Section>

      <Section title="Cadastral Identifiers & Location">
        <Row label="ULPIN" value={p.ulpin} mono />
        <Row label="Cadastral ID" value={p.khasraNo} mono />
        <Row
          label="Total Extent"
          value={`${p.areaHa.toFixed(2)} Ha (${toAcres(p.areaHa).toFixed(2)} ac)`}
          mono
        />
        <Row label="Land Classification" value={p.classification === "URBAN" ? "Urban" : "Rural"} />
        <Row label="District" value={p.district} />
        <Row label="State" value={p.state} />
        <Row label="Acquisition Case" value={p.proposalId} mono />
      </Section>

      <Section title="Compensation & Financial Status">
        <div className="grid grid-cols-2 gap-2">
          <InfoBox
            label="Assessed Amount"
            value={formatINRFull(p.compensationAssessed)}
            tone="value"
          />
          <InfoBox label="Disbursed" value={formatINRFull(p.compensationDisbursed)} tone="value" />
        </div>
        <Row label="Pending" value={formatINRFull(pending)} mono />
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] text-muted-foreground">Payment Status</span>
          <span
            className={cn(
              "rounded-[3px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]",
              PAYMENT_TONE_CLASS[pay.tone],
            )}
          >
            {pay.label}
          </span>
        </div>
      </Section>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
        <Link
          to="/calculator"
          search={{ ulpin: p.ulpin }}
          className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Calculator className="size-3.5" />
          Compensation Calculator
        </Link>
        <Link
          to="/proposals/$id"
          params={{ id: p.proposalId }}
          className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted"
        >
          <FileText className="size-3.5" />
          Documents &amp; Audit Trail
        </Link>
      </div>
    </>
  );
}

function WbParcelRecord({ selection }: { selection: Extract<Selection, { kind: "wbParcel" }> }) {
  const p = selection.properties;
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[22px] font-semibold leading-tight tracking-tight text-navy">
            Plot No. {p.plot}
          </h2>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            {p.mouza} · {selection.district}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-[3px] border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em]",
            p.real
              ? "border-status-ok/30 bg-status-ok/10 text-status-ok"
              : "border-status-warn/30 bg-status-warn/10 text-status-warn",
          )}
        >
          {p.real ? "Captured Record" : "Demo Plot"}
        </span>
      </div>

      <Section title="Hissa Sub-divisions & Ownership">
        <Row label="Khatian" value={p.khatianNo ? `${p.khatianType} ${p.khatianNo}` : "—"} mono />
        <Row label="Ownership Type" value={p.ownershipType || "—"} />
        <Row label="Owners on Record" value={String(p.ownerCount)} mono />
        <Row label="Tenancy" value={p.tenancyStatus || "—"} />
        <Row label="Mutation" value={p.mutationStatus || "—"} />
        <Row label="RoR Status" value={p.rorStatus || "—"} />
        <Row label="Encumbrance" value={p.encumbranceStatus || "—"} />
        <Row label="Litigation" value={p.litigationStatus || "—"} />
      </Section>

      <Section title="Cadastral Identifiers & Location">
        <Row label="Parcel ID" value={p.id} mono />
        <Row label="Plot No" value={p.plot} mono />
        <Row label="Revenue Village (Mouza)" value={p.mouza || "—"} />
        <Row label="Block (Taluk)" value={p.block || "—"} />
        <Row label="District" value={selection.district} />
        <Row
          label="Total Extent"
          value={
            p.areaSqm > 0
              ? `${p.areaSqm.toLocaleString()} m² (${toAcres(p.areaSqm / 10_000).toFixed(2)} ac)`
              : "Not recorded (synthetic demo)"
          }
          mono
        />
        <Row label="Land Classification" value={p.landClassification || "—"} />
        <Row label="Current Use" value={p.currentLandUse || "—"} />
        {p.cropType && <Row label="Crop" value={`${p.cropType} · ${p.croppingIntensity || "—"}`} />}
        <Row
          label="Irrigation"
          value={
            p.irrigationSource
              ? `${p.irrigationStatus} (${p.irrigationSource})`
              : p.irrigationStatus || "—"
          }
        />
        <Row label="Government Land" value={p.governmentLand ? "Yes" : "No"} />
      </Section>

      <Section title="Compensation & Financial Status">
        <div className="rounded-[5px] border border-border bg-muted/40 px-3 py-2 text-[11px] leading-snug text-muted-foreground">
          This Banglarbhumi fabric record is not linked to a BHUMITRA acquisition case, so no
          compensation has been assessed against it. Field verification:{" "}
          <span className="font-medium text-foreground">{p.fieldVerificationStatus || "—"}</span>
          {p.lastVerifiedDate ? ` (${p.lastVerifiedDate})` : ""}.
        </div>
      </Section>

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-snug text-muted-foreground">
        Demo cadastral fabric — NOT an authoritative land record. See the layers panel for the full
        dataset disclaimer.
      </p>
    </>
  );
}

function DistrictRecord({
  selection,
  stateCode,
  geojson,
  blocksData,
}: {
  selection: Extract<Selection, { kind: "district" }>;
  stateCode: string;
  geojson: CadastralInspectorProps["geojson"];
  blocksData: CadastralInspectorProps["blocksData"];
}) {
  const distName = selection.properties.distName;
  const blocksInDistrict =
    blocksData?.features.filter((f) => f.properties.districtName === distName) ?? [];
  const parcelsInDistrict =
    geojson?.features.filter((f) => f.properties.district === distName) ?? [];
  const proposalCount = new Set(parcelsInDistrict.map((f) => f.properties.proposalId)).size;

  return (
    <>
      <h2 className="text-[20px] font-semibold leading-tight tracking-tight text-navy">
        {districtDisplayName(distName, stateCode)}
      </h2>
      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
        {selection.properties.state} · District
      </p>
      <Section title="District Roll-up">
        <Row label="CD Blocks" value={String(blocksInDistrict.length)} mono />
        <Row label="Seeded Proposals" value={String(proposalCount)} mono />
        <Row label="Seeded Parcels" value={String(parcelsInDistrict.length)} mono />
      </Section>
      {blocksInDistrict.length > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Zoom in (or enable Block Boundaries) to see this district&apos;s {blocksInDistrict.length}{" "}
          CD blocks.
        </p>
      )}
    </>
  );
}

function BlockRecord({
  selection,
  stateCode,
  geojson,
  blocksData,
  onJumpToDistrict,
}: {
  selection: Extract<Selection, { kind: "block" }>;
  stateCode: string;
  geojson: CadastralInspectorProps["geojson"];
  blocksData: CadastralInspectorProps["blocksData"];
  onJumpToDistrict: (districtName: string) => void;
}) {
  const feature = blocksData?.features.find(
    (f) =>
      f.properties.blockName === selection.properties.blockName &&
      f.properties.districtName === selection.properties.districtName,
  );
  const parcelsHere =
    feature && geojson
      ? geojson.features.filter((f) => {
          if (f.properties.district !== feature.properties.districtName) return false;
          const ring = f.geometry.coordinates[0]!;
          const pts = ring.slice(0, -1);
          const lat = pts.reduce((s, p) => s + p[1]!, 0) / pts.length;
          const lng = pts.reduce((s, p) => s + p[0]!, 0) / pts.length;
          return booleanPointInPolygon(turfPoint([lng, lat]), feature.geometry);
        })
      : [];

  return (
    <>
      <h2 className="text-[20px] font-semibold leading-tight tracking-tight text-navy">
        {selection.properties.blockName}
      </h2>
      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
        {districtDisplayName(selection.properties.districtName, stateCode)} · CD Block
      </p>
      <Section title="Block Roll-up">
        <Row label="State" value={selection.properties.state} />
        <Row label="Seeded Parcels" value={String(parcelsHere.length)} mono />
      </Section>
      <button
        type="button"
        onClick={() => onJumpToDistrict(selection.properties.districtName)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted"
      >
        <Locate className="size-3.5" />
        Back to {districtDisplayName(selection.properties.districtName, stateCode)}
      </button>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4 border-t border-border pt-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
      <dt className="shrink-0 text-[11px] text-muted-foreground">{label}</dt>
      <dd className={cn("text-right text-[12px]", mono && "num font-mono text-[11.5px]")}>
        {value}
      </dd>
    </div>
  );
}

function InfoBox({ label, value, tone }: { label: string; value: string; tone?: "value" }) {
  return (
    <div className="rounded-[4px] border border-border bg-muted/40 px-2.5 py-1.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "truncate text-[12px] font-medium text-foreground",
          tone === "value" && "num text-[13px] font-semibold",
        )}
      >
        {value}
      </div>
    </div>
  );
}
