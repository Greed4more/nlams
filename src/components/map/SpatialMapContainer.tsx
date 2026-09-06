import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, WMSTileLayer, GeoJSON, useMap } from "react-leaflet";
import type { Layer, LeafletMouseEvent } from "leaflet";
import type { Feature, FeatureCollection, Geometry, Polygon } from "geojson";
import { Link } from "@tanstack/react-router";
import {
  X,
  Loader2,
  Landmark,
  Calculator,
  FileText,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import { formatINRFull } from "@/data/mockData";
import { useParcelsGeoJson, type ParcelFeatureProperties } from "@/hooks/useParcels";
import { useRole } from "@/context/RoleContext";
import {
  MAP_THEMES,
  MAP_THEME_LIST,
  SELECTED_PARCEL_COLOR,
  lulcLayerFor,
  type MapThemeId,
} from "@/lib/mapThemes";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ParcelStatus = "ACQUIRED" | "UNDER_AWARD" | "DISPUTED" | "NOTIFIED";

export const PARCEL_STATUS_COLOR: Record<ParcelStatus, string> = {
  ACQUIRED: "#1a9c5c",
  UNDER_AWARD: "#2563eb",
  DISPUTED: "#dc2626",
  NOTIFIED: "#d97706",
};

const STATUS_LABEL: Record<ParcelStatus, string> = {
  ACQUIRED: "Acquired",
  UNDER_AWARD: "Under Award",
  DISPUTED: "Disputed",
  NOTIFIED: "Notified",
};

/**
 * ISRO Bhuvan public WMS (bhuvan-vec1.nrsc.gov.in) — no API key required.
 * Verified layers: basemap:INDIA_STATE, basemap:INDIA_DIST, and the
 * per-state *_LULC (land use / land cover) layers used below.
 */
const BHUVAN_WMS_URL = "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms";
const BHUVAN_ADMIN_LAYERS = "basemap:INDIA_STATE,basemap:INDIA_DIST";

const BASEMAPS = [
  { value: "satellite", label: "Satellite (Esri)" },
  { value: "osm", label: "OpenStreetMap" },
] as const;

export interface SpatialMapContainerProps {
  onParcelClick?: (parcel: ParcelFeatureProperties) => void;
  highlightedUlpin?: string | undefined;
}

interface Selection {
  properties: ParcelFeatureProperties;
  /** [lat, lng] — averaged from the polygon ring, not a surveyed centroid. */
  centroid: [number, number];
}

const statusFor = (ulpin: string): ParcelStatus => {
  const codes: ParcelStatus[] = ["ACQUIRED", "UNDER_AWARD", "DISPUTED", "NOTIFIED"];
  const sum = [...ulpin].reduce((s, c) => s + c.charCodeAt(0), 0);
  return codes[sum % codes.length]!;
};

/** khasraNo is generated as "<survey>/<sub-division>" — split it back apart. */
function splitKhasra(khasraNo: string): { survey: string; subDivision: string | null } {
  const [survey, sub] = khasraNo.split("/");
  return { survey: survey ?? khasraNo, subDivision: sub ?? null };
}

function polygonCentroid(ring: number[][]): [number, number] {
  const pts = ring.slice(0, -1); // drop the closing duplicate point
  const lat = pts.reduce((s, p) => s + p[1]!, 0) / pts.length;
  const lng = pts.reduce((s, p) => s + p[0]!, 0) / pts.length;
  return [lat, lng];
}

/** Recenters the map once, when geojson first loads or the highlighted parcel changes. */
function FitToData({
  data,
  highlightedUlpin,
}: {
  data: FeatureCollection<Polygon, ParcelFeatureProperties> | undefined;
  highlightedUlpin?: string | undefined;
}) {
  const map = useMap();
  useEffect(() => {
    if (!data || data.features.length === 0) return;
    const target = highlightedUlpin
      ? data.features.find((f) => f.properties.ulpin === highlightedUlpin)
      : undefined;
    if (target) {
      const [lng, lat] = target.geometry.coordinates[0]![0]!;
      map.setView([lat!, lng!], 15);
      return;
    }
    const lats = data.features.flatMap((f) => f.geometry.coordinates[0]!.map((c) => c[1]!));
    const lngs = data.features.flatMap((f) => f.geometry.coordinates[0]!.map((c) => c[0]!));
    map.fitBounds([
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, highlightedUlpin]);
  return null;
}

export function SpatialMapContainer({ onParcelClick, highlightedUlpin }: SpatialMapContainerProps) {
  const { data, isLoading } = useParcelsGeoJson();
  const { person } = useRole();
  const [themeId, setThemeId] = useState<MapThemeId>("nlams");
  const [panelOpen, setPanelOpen] = useState(true);
  const [showCadastral, setShowCadastral] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showBhuvanAdmin, setShowBhuvanAdmin] = useState(false);
  const [showLulc, setShowLulc] = useState(false);
  const [basemap, setBasemap] = useState<(typeof BASEMAPS)[number]["value"]>("satellite");
  const [selected, setSelected] = useState<Selection | null>(null);

  const theme = MAP_THEMES[themeId];
  const geojson = data as FeatureCollection<Polygon, ParcelFeatureProperties> | undefined;
  const lulcLayer = selected ? lulcLayerFor(selected.properties.state) : null;

  useEffect(() => {
    if (!highlightedUlpin || !geojson) return;
    const match = geojson.features.find((f) => f.properties.ulpin === highlightedUlpin);
    if (match) {
      setSelected({
        properties: match.properties,
        centroid: polygonCentroid(match.geometry.coordinates[0]!),
      });
    }
  }, [highlightedUlpin, geojson]);

  const select = (feature: Feature<Geometry, ParcelFeatureProperties>) => {
    if (feature.geometry.type !== "Polygon") return;
    const centroid = polygonCentroid(feature.geometry.coordinates[0]!);
    setSelected({ properties: feature.properties, centroid });
    onParcelClick?.(feature.properties);
  };

  const styleFor = (feature: Feature<Geometry, ParcelFeatureProperties> | undefined) => {
    const p = feature?.properties;
    const active = p && (selected?.properties.ulpin === p.ulpin || highlightedUlpin === p.ulpin);
    return {
      color: active ? SELECTED_PARCEL_COLOR : theme.parcelStroke,
      weight: active ? 3.5 : 1.5,
      fillColor: active ? SELECTED_PARCEL_COLOR : theme.parcelStroke,
      fillOpacity: active ? 0.35 : 0.08,
    };
  };

  const onEachFeature = (feature: Feature<Geometry, ParcelFeatureProperties>, layer: Layer) => {
    layer.on("click", (() => select(feature)) as (e: LeafletMouseEvent) => void);
    if (showLabels) {
      const { survey } = splitKhasra(feature.properties.khasraNo);
      layer.bindTooltip(
        `<span style="color:${theme.labelColor};font-weight:700">${survey}</span>`,
        {
          permanent: true,
          direction: "center",
          className: "num border-none bg-transparent shadow-none !p-0",
        },
      );
    }
  };

  // Force GeoJSON re-render when toggles that affect style/tooltips change.
  const geojsonKey = useMemo(
    () => `${showLabels}-${themeId}-${selected?.properties.ulpin}-${highlightedUlpin}`,
    [showLabels, themeId, selected, highlightedUlpin],
  );

  return (
    <div className="panel relative h-[calc(100vh-190px)] min-h-[560px] overflow-hidden">
      {/* Portal-style header strip */}
      <div
        className="absolute inset-x-0 top-0 z-[1001] flex items-center justify-between gap-3 px-4 py-2.5 shadow-sm"
        style={{ background: theme.accent, color: theme.accentForeground }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-[6px] bg-white/15">
            <Landmark className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold leading-tight">
              {theme.portalTitle}
            </div>
            <div className="truncate text-[10px] opacity-80">{theme.portalSubtitle}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-[11.5px] opacity-90 sm:inline">{person}</span>
          <button
            type="button"
            aria-label="Toggle layers panel"
            onClick={() => setPanelOpen((o) => !o)}
            className="grid size-7 place-items-center rounded-[4px] bg-white/10 transition-colors hover:bg-white/20"
          >
            {panelOpen ? (
              <PanelRightClose className="size-4" />
            ) : (
              <PanelRightOpen className="size-4" />
            )}
          </button>
        </div>
      </div>

      <MapContainer
        center={[22.5, 79]}
        zoom={5}
        scrollWheelZoom
        className="size-full"
        style={{ background: "#0b1220" }}
      >
        {basemap === "osm" ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution="Tiles &copy; Esri — Esri, DigitalGlobe, GeoEye, Earthstar Geographics"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {showBhuvanAdmin && (
          <WMSTileLayer
            url={BHUVAN_WMS_URL}
            params={{
              layers: BHUVAN_ADMIN_LAYERS,
              format: "image/png",
              transparent: true,
              version: "1.1.1",
            }}
            attribution="Boundaries &copy; ISRO Bhuvan (NRSC)"
          />
        )}

        {showLulc && lulcLayer && (
          <WMSTileLayer
            key={lulcLayer}
            url={BHUVAN_WMS_URL}
            params={{ layers: lulcLayer, format: "image/png", transparent: true, version: "1.1.1" }}
            attribution="Land Use / Land Cover &copy; ISRO Bhuvan (NRSC)"
          />
        )}

        {showCadastral && geojson && (
          <GeoJSON key={geojsonKey} data={geojson} style={styleFor} onEachFeature={onEachFeature} />
        )}

        <FitToData data={geojson} highlightedUlpin={highlightedUlpin} />
      </MapContainer>

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-background/40">
          <div className="flex items-center gap-2 rounded-[6px] bg-card px-3 py-2 text-[12.5px] shadow">
            <Loader2 className="size-4 animate-spin" />
            Loading cadastral parcels…
          </div>
        </div>
      )}

      {/* Layers and Tools panel */}
      {panelOpen && (
        <div className="panel absolute right-3 top-14 z-[1000] w-[252px] p-3">
          <div className="label-xs">Portal Style</div>
          <RadioGroup
            value={themeId}
            onValueChange={(v) => setThemeId(v as MapThemeId)}
            className="mt-2 gap-1.5"
          >
            {MAP_THEME_LIST.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <RadioGroupItem id={`theme-${t.id}`} value={t.id} className="size-3.5" />
                <Label htmlFor={`theme-${t.id}`} className="text-[11.5px] font-normal">
                  {t.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="mt-3 border-t border-border pt-3">
            <div className="label-xs">Layers and Tools</div>
            <div className="mt-2 space-y-2">
              <LayerRow
                label="Cadastral Polygons"
                checked={showCadastral}
                onChange={setShowCadastral}
              />
              <LayerRow
                label="Survey Number Labels"
                checked={showLabels}
                onChange={setShowLabels}
              />
              <LayerRow
                label="Admin Boundaries (Bhuvan)"
                checked={showBhuvanAdmin}
                onChange={setShowBhuvanAdmin}
              />
              <LayerRow
                label={
                  lulcLayer ? "Land Use / Land Cover" : "Land Use / Land Cover — select a parcel"
                }
                checked={showLulc}
                onChange={setShowLulc}
                disabled={!lulcLayer}
              />
            </div>
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <div className="label-xs">Basemap</div>
            <RadioGroup
              value={basemap}
              onValueChange={(v) => setBasemap(v as typeof basemap)}
              className="mt-2 gap-1.5"
            >
              {BASEMAPS.map((b) => (
                <div key={b.value} className="flex items-center gap-2">
                  <RadioGroupItem id={`bm-${b.value}`} value={b.value} className="size-3.5" />
                  <Label htmlFor={`bm-${b.value}`} className="text-[11.5px] font-normal">
                    {b.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="panel absolute bottom-3 right-3 z-[1000] px-3 py-2">
        <div className="label-xs">Selection</div>
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className="size-2.5 rounded-[2px]"
            style={{ backgroundColor: SELECTED_PARCEL_COLOR }}
          />
          <span className="text-[11px] text-muted-foreground">Selected parcel</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span
            className="size-2.5 rounded-[2px]"
            style={{ backgroundColor: theme.parcelStroke }}
          />
          <span className="text-[11px] text-muted-foreground">Cadastral outline</span>
        </div>
      </div>

      {/* Land Parcel Information panel */}
      {selected && (
        <aside className="absolute inset-y-0 right-0 z-[1000] w-[340px] overflow-y-auto border-l border-border bg-card p-4 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="label-xs">Land Parcel Information</div>
              <div className="num mt-1 text-[11px] text-muted-foreground">
                {selected.centroid[0].toFixed(6)}, {selected.centroid[1].toFixed(6)}
              </div>
            </div>
            <button
              type="button"
              aria-label="Close parcel panel"
              onClick={() => setSelected(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <InfoBox label="State" value={selected.properties.state} />
            <InfoBox label="District" value={selected.properties.district} />
          </div>
          <div className="mt-2">
            <InfoBox
              label="Proposal"
              value={`${selected.properties.proposalId} — ${selected.properties.projectName}`}
            />
          </div>

          <dl className="mt-4 space-y-2.5 text-[12.5px]">
            <Row label="ULPIN" value={selected.properties.ulpin} mono />
            {(() => {
              const { survey, subDivision } = splitKhasra(selected.properties.khasraNo);
              return (
                <>
                  <Row label="Survey Number" value={survey} mono />
                  <Row label="Sub Division" value={subDivision ?? "—"} mono />
                </>
              );
            })()}
            <Row label="Area" value={`${selected.properties.areaHa.toFixed(2)} Ha`} mono />
            <Row
              label="Zone"
              value={selected.properties.classification === "URBAN" ? "Urban" : "Rural"}
            />
            <Row
              label="Owner"
              value={
                selected.properties.coOwners > 0
                  ? `${selected.properties.ownerName} (+${selected.properties.coOwners} co-owners)`
                  : selected.properties.ownerName
              }
            />
            <Row label="Status" value={STATUS_LABEL[statusFor(selected.properties.ulpin)]} />
            <Row
              label="Assessed"
              value={formatINRFull(selected.properties.compensationAssessed)}
              mono
            />
            <Row
              label="Disbursed"
              value={formatINRFull(selected.properties.compensationDisbursed)}
              mono
            />
          </dl>

          <div className="mt-4 border-t border-border pt-3">
            <div className="label-xs mb-2">Records</div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/calculator"
                search={{ ulpin: selected.properties.ulpin }}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Calculator className="size-3.5" />
                Compensation
              </Link>
              <Link
                to="/proposals/$id"
                params={{ id: selected.properties.proposalId }}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <FileText className="size-3.5" />
                Documents &amp; Audit Trail
              </Link>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

function LayerRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const id = `layer-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className={cn("flex items-center justify-between gap-2", disabled && "opacity-50")}>
      <Label htmlFor={id} className="text-[11.5px] font-normal">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-border bg-muted/40 px-2.5 py-1.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="truncate text-[12px] font-medium text-foreground">{value}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
      <dt className="shrink-0 text-[11px] text-muted-foreground">{label}</dt>
      <dd className={cn("text-right", mono && "num font-mono text-[12px]")}>{value}</dd>
    </div>
  );
}
