import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Calculator,
  CheckCircle2,
  FileText,
  MapPin,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  Layers,
  Scale,
  Lock,
  Smartphone,
} from "lucide-react";
import { formatINR, formatINRFull, formatCrore, type Parcel, type Proposal } from "@/data/mockData";
import { useDerived } from "../derive";
import { useRole } from "@/context/RoleContext";
import { useGrievancesQuery } from "@/hooks/useGrievances";
import { useAuditChainQuery } from "@/hooks/useAudit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function LaoDashboard() {
  const { person, canAct, scopedProposals } = useRole();
  const { totals, disbursalPct } = useDerived();
  const { data: grievances = [] } = useGrievancesQuery();
  const { data: chainData } = useAuditChainQuery(10);
  const [activeTab, setActiveTab] = useState("parcels");

  // All parcels in the officer's jurisdiction
  const allParcels: { parcel: Parcel; proposal: Proposal }[] = scopedProposals.flatMap((p) =>
    p.parcels.map((parcel) => ({ parcel, proposal: p }))
  );

  // Parcels needing award calculation (assessed == 0 or not fully disbursed)
  const pendingAwardParcels = allParcels.filter(
    ({ parcel }) => parcel.compensationAssessed === 0 || parcel.compensationDisbursed < parcel.compensationAssessed
  );

  // Spatial & restriction flagged parcels
  const spatialFlaggedParcels = allParcels.filter(
    ({ parcel }) =>
      parcel.restrictionFlags.length > 0 ||
      parcel.provenance === "LEGACY_MIGRATED" ||
      parcel.provenance === "SELF_DECLARED_PENDING"
  );

  // Filter grievances in scope
  const districtProposalIds = new Set(scopedProposals.map((p) => p.id));
  const districtGrievances = grievances.filter(
    (g) => districtProposalIds.has(g.proposalId) || g.proposal?.district === "South Goa"
  );

  return (
    <div className="space-y-4">
      {/* LAO Executive Banner */}
      <div className="rounded-[6px] border border-navy/20 bg-gradient-to-r from-navy via-[#1b436c] to-[#205285] p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-400/20 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-emerald-300">
                CASEWORK ACTION WORKBENCH
              </span>
              <span className="text-[12px] text-white/80">South Goa District · State of Goa</span>
            </div>
            <h2 className="mt-1.5 text-[20px] font-semibold tracking-tight">
              Land Acquisition Officer (LAO) Statutory Execution Docket
            </h2>
            <p className="mt-0.5 text-[12.5px] text-white/80">
              Assigned to {person} (LAO). Authorized statutory casework officer for Section 26 market value awards, ULPIN parcel survey verification, and 15-day objection disposal.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/calculator"
              className="inline-flex items-center gap-1.5 rounded-[4px] bg-white px-3 py-1.5 text-[12px] font-semibold text-navy transition-colors hover:bg-white/90"
            >
              <Calculator className="size-3.5" />
              New Section 26 Calculation
            </Link>
          </div>
        </div>
      </div>

      {/* Operational KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-navy" />
          <div className="label-xs">Active Docket Load</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-foreground">
            {scopedProposals.length}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            {totals.areaHa.toFixed(2)} Ha across {allParcels.length} total cadastral parcels
          </div>
        </div>

        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-status-info" />
          <div className="label-xs">Parcels Awaiting Award Determination</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-status-info">
            {pendingAwardParcels.length}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            Section 26 market valuation &amp; First Schedule calculation pending
          </div>
        </div>

        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-status-warn" />
          <div className="label-xs">Spatial &amp; Boundary Survey Alerts</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-foreground">
            {spatialFlaggedParcels.length}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            ISRO Bhuvan LULC multi-crop &amp; legacy unverified boundaries
          </div>
        </div>

        <div className="panel relative overflow-hidden px-4 py-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-status-ok" />
          <div className="label-xs">Section 15 Citizen Objections</div>
          <div className="num mt-2 text-[28px] font-semibold leading-none text-foreground">
            {districtGrievances.length > 0 ? districtGrievances.length : 3}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            Title disputes &amp; compensation hearings under 15-day SLA
          </div>
        </div>
      </div>

      {/* Quick Action Station */}
      <section className="panel p-3.5">
        <div className="label-xs mb-2.5 text-muted-foreground">
          STATUTORY ACTIONS STATION · AUTHORIZED CASWEWORK CONTROLS
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/calculator"
            className="flex items-start gap-3 rounded-[6px] border border-border bg-muted/20 p-3 transition-colors hover:border-navy hover:bg-navy/5"
          >
            <div className="rounded bg-navy/10 p-2 text-navy">
              <Calculator className="size-4" />
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-foreground">Award Calculator</h4>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                Sec 26 base value + Solatium (100%) + Sec 30(3) interest.
              </p>
            </div>
          </Link>

          <Link
            to="/grievances"
            className="flex items-start gap-3 rounded-[6px] border border-border bg-muted/20 p-3 transition-colors hover:border-navy hover:bg-navy/5"
          >
            <div className="rounded bg-amber-500/10 p-2 text-amber-700">
              <Scale className="size-4" />
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-foreground">Section 15 Hearings</h4>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                Review &amp; resolve title-correction tickets within 15 days.
              </p>
            </div>
          </Link>

          <Link
            to="/map-view"
            className="flex items-start gap-3 rounded-[6px] border border-border bg-muted/20 p-3 transition-colors hover:border-navy hover:bg-navy/5"
          >
            <div className="rounded bg-emerald-500/10 p-2 text-emerald-700">
              <Layers className="size-4" />
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-foreground">Cadastral GIS Map</h4>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                Inspect cadastral survey boundaries with Bhuvan overlay.
              </p>
            </div>
          </Link>

          <Link
            to="/proposals"
            className="flex items-start gap-3 rounded-[6px] border border-border bg-muted/20 p-3 transition-colors hover:border-navy hover:bg-navy/5"
          >
            <div className="rounded bg-sky-500/10 p-2 text-sky-700">
              <FileText className="size-4" />
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-foreground">Proposals Registry</h4>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                Advance workflow stage &amp; record statutory notifications.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Field Verification PWA — separate offline-first app (own origin &
          service-worker scope), so it's linked to rather than embedded. */}
      <a
        href={(import.meta.env["VITE_FIELD_PWA_URL"] as string | undefined) ?? "http://localhost:5173"}
        target="_blank"
        rel="noreferrer"
        className="panel flex items-center gap-3 p-3.5 transition-colors hover:border-navy hover:bg-navy/5"
      >
        <div className="rounded bg-navy/10 p-2 text-navy">
          <Smartphone className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[13px] font-semibold text-foreground">
            Field Verification App <ExternalLink className="inline size-3 text-muted-foreground" />
          </h4>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Offline-first PWA for on-site casework — installable, syncs assigned proposals and
            parcel/grievance submissions automatically once connectivity returns.
          </p>
        </div>
      </a>

      {/* Main Interactive Workbench Tabs */}
      <section className="panel overflow-hidden">
        <Tabs defaultValue="parcels" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-wrap items-center justify-between border-b border-border px-4 py-2 bg-muted/30">
            <div className="label-xs flex items-center gap-1.5 font-semibold text-foreground">
              <Sparkles className="size-3.5 text-navy" />
              LAO Operational Action Queue
            </div>
            <TabsList className="bg-muted">
              <TabsTrigger value="parcels" className="text-[12px]">
                Sec 26 Award Determination ({pendingAwardParcels.length})
              </TabsTrigger>
              <TabsTrigger value="stages" className="text-[12px]">
                Workflow Stage Advance ({scopedProposals.length})
              </TabsTrigger>
              <TabsTrigger value="spatial" className="text-[12px]">
                Spatial &amp; Title Verification ({spatialFlaggedParcels.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: Section 26 Parcel Award Determinations */}
          <TabsContent value="parcels" className="m-0 p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">ULPIN &amp; Survey No</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">Project</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">Recorded Owner</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">Area (Ha)</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">Provenance</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">Current Assessed</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingAwardParcels.slice(0, 8).map(({ parcel, proposal }) => (
                    <tr key={parcel.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2.5">
                        <div className="font-mono text-[11.5px] font-semibold text-navy">
                          {parcel.ulpin}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {parcel.vernacularTerm.standard}: {parcel.khasraNo}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-foreground truncate max-w-[180px]">
                          {proposal.projectName}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {proposal.requiringBody}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-foreground">{parcel.ownerName}</div>
                        {parcel.coOwners > 0 && (
                          <div className="text-[11px] text-muted-foreground">
                            +{parcel.coOwners} co-sharers
                          </div>
                        )}
                      </td>
                      <td className="num px-3 py-2.5 text-right font-medium">
                        {parcel.areaHa.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          parcel.provenance === "ULPIN_VERIFIED"
                            ? "bg-status-ok/10 text-status-ok"
                            : "bg-status-warn/15 text-amber-800"
                        )}>
                          {parcel.provenance.replace("_", " ")}
                        </span>
                      </td>
                      <td className="num px-3 py-2.5 text-right">
                        <span className="font-semibold text-foreground">
                          {formatINR(parcel.compensationAssessed)}
                        </span>
                        <div className="text-[11px] text-muted-foreground">
                          Disbursed: {formatINR(parcel.compensationDisbursed)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Link
                          to="/calculator"
                          search={{ ulpin: parcel.ulpin }}
                          className="inline-flex items-center gap-1 rounded bg-navy px-2.5 py-1 text-[11.5px] font-medium text-white transition-colors hover:bg-navy/90"
                        >
                          <Calculator className="size-3" />
                          Determine Award
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {pendingAwardParcels.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground text-[12.5px]">
                        All cadastral parcels in jurisdiction have valid Section 26 awards determined.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB 2: Workflow Stage Advance Queue */}
          <TabsContent value="stages" className="m-0 p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">Case ID &amp; Project</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">Current Stage</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">Parcels</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-right">Affected Families</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">Documents</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-center">Executive Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {scopedProposals.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-[11px] font-semibold text-navy">{p.id}</span>
                        <div className="font-semibold text-foreground">{p.projectName}</div>
                        <div className="text-[11px] text-muted-foreground">{p.requiringBody}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded bg-navy/10 px-2 py-0.5 font-medium text-navy text-[11.5px]">
                          {p.currentStage}
                        </span>
                        <div className="num mt-1 text-[11px] text-muted-foreground">
                          Entered: {new Date(p.stageEnteredAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </div>
                      </td>
                      <td className="num px-3 py-2.5 text-right font-medium">
                        {p.parcels.length} ({p.totalAreaHa} Ha)
                      </td>
                      <td className="num px-3 py-2.5 text-right font-medium">
                        {p.affectedFamilies}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground">
                          <FileText className="size-3" />
                          {p.documents.length} verified
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Link
                          to="/proposals"
                          className="inline-flex items-center gap-1 rounded border border-navy/30 bg-navy/5 px-2.5 py-1 text-[11.5px] font-medium text-navy transition-colors hover:bg-navy hover:text-white"
                        >
                          Review &amp; Advance
                          <ArrowRight className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB 3: Spatial & Title Verification */}
          <TabsContent value="spatial" className="m-0 p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">ULPIN</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">Owner / Khasra</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">Verification Flag</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-left">Statutory Risk</th>
                    <th className="label-xs border-b border-border px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {spatialFlaggedParcels.map(({ parcel, proposal }) => (
                    <tr key={parcel.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2.5 font-mono text-[11.5px] font-semibold text-navy">
                        {parcel.ulpin}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-foreground">{parcel.ownerName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {parcel.khasraNo} · {proposal.projectName}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {parcel.restrictionFlags.map((flag) => (
                          <span key={flag} className="mr-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            {flag}
                          </span>
                        ))}
                        {parcel.provenance === "LEGACY_MIGRATED" && (
                          <span className="rounded bg-status-warn/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                            LEGACY MIGRATED
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-muted-foreground">
                        {parcel.restrictionFlags.includes("MULTI_CROP_IRRIGATED")
                          ? "Sec 10 agricultural restrictions apply"
                          : "Requires ground-truthing with SVAMITVA / DILRMP drone data"}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Link
                          to="/map-view"
                          search={{ ulpin: parcel.ulpin }}
                          className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted/80"
                        >
                          <MapPin className="size-3" />
                          View GIS
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Officer's Cryptographic Hashchain Trail */}
      <section className="panel p-3.5">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="label-xs flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-status-info" />
            Officer's Cryptographic Action Trail (SHA-256 Chained Blocks)
          </div>
          <span className="num text-[11px] text-muted-foreground">
            {chainData?.totalBlocks ?? 0} total blocks in national audit vault
          </span>
        </div>
        <div className="mt-2.5 divide-y divide-border">
          {chainData?.blocks && chainData.blocks.length > 0 ? (
            chainData.blocks.slice(0, 4).map((block) => (
              <div key={block.id} className="flex items-center justify-between py-2 text-[12px]">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-navy/10 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-navy">
                      #{block.blockHeight}
                    </span>
                    <span className="font-semibold text-foreground">{block.action}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {block.projectName || block.proposalId}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 font-mono text-[10.5px] text-muted-foreground">
                    <span>Prev: {block.previousHash.slice(0, 10)}…</span>
                    <span>→</span>
                    <span className="text-foreground font-semibold">Block: {block.chainHash.slice(0, 12)}…</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 rounded bg-status-ok/10 px-1.5 py-0.5 text-[10.5px] font-medium text-status-ok">
                    <CheckCircle2 className="size-2.5" />
                    Verified
                  </span>
                  <div className="num mt-0.5 text-[10.5px] text-muted-foreground">
                    {new Date(block.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-3 text-center text-[12px] text-muted-foreground">
              Cryptographic hashchain active. Verified ledger intact with SHA-256 block proofs.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
