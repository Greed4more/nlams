import type { DocumentRef, Parcel, Proposal } from "@prisma/client";

type ProposalWithRelations = Proposal & { parcels: Parcel[]; documents: DocumentRef[] };

export function serializeParcel(p: Parcel) {
  return {
    id: p.id,
    ulpin: p.ulpin,
    provenance: p.provenance,
    restrictionFlags: p.restrictionFlags,
    khasraNo: p.khasraNo,
    vernacularTerm: p.vernacularTerm,
    areaHa: p.areaHa,
    classification: p.classification,
    ownerName: p.ownerName,
    coOwners: p.coOwners,
    compensationAssessed: p.compensationAssessed,
    compensationDisbursed: p.compensationDisbursed,
  };
}

/** Document metadata only — never ships the raw file bytes over this endpoint. */
export function serializeDocument(d: DocumentRef) {
  return {
    id: d.id,
    name: d.name,
    type: d.type,
    uploadedAt: d.uploadedAt.toISOString(),
    sizeKb: d.sizeKb,
    sha256: d.sha256,
    verified: d.lastVerifiedAt != null,
    lastVerifiedAt: d.lastVerifiedAt?.toISOString() ?? null,
  };
}

export function serializeProposal(p: ProposalWithRelations) {
  const parcelAssessed = p.parcels.reduce((s, x) => s + x.compensationAssessed, 0);
  const disbursed = p.parcels.reduce((s, x) => s + x.compensationDisbursed, 0);
  const totalAreaHa = p.parcels.reduce((s, x) => s + x.areaHa, 0);

  return {
    id: p.id,
    projectName: p.projectName,
    requiringBody: p.requiringBody,
    state: p.state,
    district: p.district,
    currentStage: p.currentStage,
    stageEnteredAt: p.stageEnteredAt.toISOString(),
    initiatedAt: p.initiatedAt.toISOString(),
    totalAreaHa: Number(totalAreaHa.toFixed(2)),
    affectedFamilies: p.affectedFamilies,
    parcels: p.parcels.map(serializeParcel),
    documents: p.documents.map(serializeDocument),
    compensation: {
      assessed: parcelAssessed,
      disbursed,
      pending: parcelAssessed - disbursed,
    },
  };
}
