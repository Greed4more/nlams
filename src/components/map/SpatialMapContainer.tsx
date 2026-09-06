import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, WMSTileLayer, GeoJSON, useMap } from "react-leaflet";
import type { Layer, LeafletMouseEvent } from "leaflet";
import type { Feature, FeatureCollection, Geometry, Polygon } from "geojson";
import { X, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { formatINRFull } from "@/data/mockData";
import { useParcelsGeoJson, type ParcelFeatureProperties } from "@/hooks/useParcels";
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
 * Verified layers: basemap:INDIA_STATE, basemap:INDIA_DIST.
 */
const BHUVAN_WMS_URL = "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms";
const BHUVAN_LAYERS = "basemap:INDIA_STATE,basemap:INDIA_DIST";

const BASEMAPS = [
  { value: "osm", label: "OpenStreetMap" },
  { value: "satellite", label: "Satellite (Esri)" },
] as const;

export interface SpatialMapContainerProps {
  onParcelClick?: (parcel: ParcelFeatureProperties) => void;
  highlightedUlpin?: string | undefined;
}

const statusFor = (ulpin: string): ParcelStatus => {
  const codes: ParcelStatus[] = ["ACQUIRED", "UNDER_AWARD", "DISPUTED", "NOTIFIED"];
  const sum = [...ulpin].reduce((s, c) => s + c.charCodeAt(0), 0);
  return codes[sum % codes.length]!;
};

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
  const [showCadastral, setShowCadastral] = useState(true);
  const [showUlpinLabels, setShowUlpinLabels] = useState(true);
  const [showBhuvanAdmin, setShowBhuvanAdmin] = useState(false);
  const [basemap, setBasemap] = useState<(typeof BASEMAPS)[number]["value"]>("osm");
  const [selected, setSelected] = useState<ParcelFeatureProperties | null>(null);

  const geojson = data as FeatureCollection<Polygon, ParcelFeatureProperties> | undefined;

  useEffect(() => {
    if (!highlightedUlpin || !geojson) return;
    const match = geojson.features.find((f) => f.properties.ulpin === highlightedUlpin);
    if (match) setSelected(match.properties);
  }, [highlightedUlpin, geojson]);

  const select = (p: ParcelFeatureProperties) => {
    setSelected(p);
    onParcelClick?.(p);
  };

  const styleFor = (feature: Feature<Geometry, ParcelFeatureProperties> | undefined) => {
    const p = feature?.properties;
    const status = p ? statusFor(p.ulpin) : "ACQUIRED";
    const active = p && (selected?.ulpin === p.ulpin || highlightedUlpin === p.ulpin);
    return {
      color: "#0f2942",
      weight: active ? 3 : 1.25,
      fillColor: PARCEL_STATUS_COLOR[status],
      fillOpacity: active ? 0.55 : 0.28,
    };
  };

  const onEachFeature = (feature: Feature<Geometry, ParcelFeatureProperties>, layer: Layer) => {
    layer.on("click", (() => select(feature.properties)) as (e: LeafletMouseEvent) => void);
    if (showUlpinLabels) {
      layer.bindTooltip(feature.properties.ulpin, {
        sticky: true,
        className: "num font-mono text-[10.5px]",
      });
    }
  };

  // Force GeoJSON re-render when toggles that affect style/tooltips change.
  const geojsonKey = useMemo(
    () => `${showUlpinLabels}-${selected?.ulpin}-${highlightedUlpin}`,
    [showUlpinLabels, selected, highlightedUlpin],
  );

  return (
    <div className="panel relative h-[calc(100vh-190px)] min-h-[520px] overflow-hidden">
      <MapContainer
        center={[22.5, 79]}
        zoom={5}
        scrollWheelZoom
        className="size-full"
        style={{ background: "#eef1f4" }}
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
              layers: BHUVAN_LAYERS,
              format: "image/png",
              transparent: true,
              version: "1.1.1",
            }}
            attribution="Boundaries &copy; ISRO Bhuvan (NRSC)"
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

      {/* Control panel */}
      <div className="panel absolute right-3 top-3 z-[1000] w-[248px] p-3">
        <div className="label-xs">Layers</div>
        <div className="mt-2 space-y-2">
          <LayerRow
            label="Cadastral Polygons"
            checked={showCadastral}
            onChange={setShowCadastral}
          />
          <LayerRow label="ULPIN Labels" checked={showUlpinLabels} onChange={setShowUlpinLabels} />
          <LayerRow
            label="ISRO Bhuvan Admin Boundaries"
            checked={showBhuvanAdmin}
            onChange={setShowBhuvanAdmin}
          />
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

      {/* Legend */}
      <div className="panel absolute bottom-3 right-3 z-[1000] px-3 py-2">
        <div className="label-xs">Parcel Status</div>
        <div className="mt-1.5 space-y-1">
          {(Object.keys(STATUS_LABEL) as ParcelStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-[2px]"
                style={{ backgroundColor: PARCEL_STATUS_COLOR[s], opacity: 0.75 }}
              />
              <span className="text-[11px] text-muted-foreground">{STATUS_LABEL[s]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Side panel */}
      {selected && (
        <aside className="absolute inset-y-0 right-0 z-[1000] w-[320px] border-l border-border bg-card p-4 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="label-xs">Parcel Record</div>
              <div className="num mt-1 font-mono text-[13px] font-semibold">{selected.ulpin}</div>
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

          <dl className="mt-4 space-y-2.5 text-[12.5px]">
            <Row label="Khasra / Survey No." value={selected.khasraNo} mono />
            <Row label="Proposal" value={`${selected.proposalId} — ${selected.projectName}`} />
            <Row label="Area" value={`${selected.areaHa.toFixed(2)} Ha`} mono />
            <Row label="Zone" value={selected.classification === "URBAN" ? "Urban" : "Rural"} />
            <Row
              label="Owner"
              value={
                selected.coOwners > 0
                  ? `${selected.ownerName} (+${selected.coOwners} co-owners)`
                  : selected.ownerName
              }
            />
            <Row label="Status" value={STATUS_LABEL[statusFor(selected.ulpin)]} />
            <Row label="Assessed" value={formatINRFull(selected.compensationAssessed)} mono />
            <Row label="Disbursed" value={formatINRFull(selected.compensationDisbursed)} mono />
          </dl>
        </aside>
      )}
    </div>
  );
}

function LayerRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = `layer-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={id} className="text-[11.5px] font-normal">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
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
