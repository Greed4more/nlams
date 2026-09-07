import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  GeoJSON,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { Layer, LeafletMouseEvent, Polygon as LeafletPolygon } from "leaflet";
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
  Locate,
} from "lucide-react";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point as turfPoint } from "@turf/helpers";
import "leaflet/dist/leaflet.css";
import { formatINRFull } from "@/data/mockData";
import { useParcelsGeoJson, type ParcelFeatureProperties } from "@/hooks/useParcels";
import {
  useWestBengalDistricts,
  useWestBengalBlocks,
  type DistrictFeature,
  type DistrictFeatureProperties,
  type BlockFeature,
  type BlockFeatureProperties,
} from "@/hooks/useAdminBoundaries";
import { useRole } from "@/context/RoleContext";
import {
  MAP_THEMES,
  MAP_THEME_LIST,
  SELECTED_PARCEL_COLOR,
  ADMIN_BOUNDARY_COLORS,
  lulcLayerFor,
  type MapThemeId,
} from "@/lib/mapThemes";
import { wbDistrictDisplayName } from "@/lib/westBengalDistrictNames";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Blocks are only rendered once zoomed in this far — 349 of them at once
 * over all West Bengal is unreadable, and this roughly matches the zoom
 * level at which the real TN Nilam viewer starts showing block/village
 * detail. */
const BLOCK_VISIBLE_ZOOM = 9;
/** Below this zoom, district/block name labels are skipped — otherwise 23
 * district labels (or 349 block labels) overlap into noise. */
const ADMIN_LABEL_ZOOM = 7;

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

type Selection =
  | {
      kind: "parcel";
      properties: ParcelFeatureProperties;
      /** [lat, lng] — averaged from the polygon ring, not a surveyed centroid. */
      centroid: [number, number];
    }
  | { kind: "district"; properties: DistrictFeatureProperties; centroid: [number, number] }
  | { kind: "block"; properties: BlockFeatureProperties; centroid: [number, number] };

/** Bumped on every "zoom to" request so repeated clicks on the same feature still refocus. */
interface FocusRequest {
  bounds: [[number, number], [number, number]];
  nonce: number;
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

/** Same as polygonCentroid but [lng, lat] order, for turf point-in-polygon checks. */
function polygonCentroidLngLat(ring: number[][]): [number, number] {
  const [lat, lng] = polygonCentroid(ring);
  return [lng, lat];
}

/** District/block layers can be Polygon or MultiPolygon — Leaflet's own
 * layer bounds handle both without branching on geometry type. */
function polygonBoundsCentroid(layer: Layer): [number, number] {
  const center = (layer as LeafletPolygon).getBounds().getCenter();
  return [center.lat, center.lng];
}

type ParcelFeature = Feature<Polygon, ParcelFeatureProperties>;

function boundsOf(features: ParcelFeature[]): [[number, number], [number, number]] {
  const lats = features.flatMap((f) => f.geometry.coordinates[0]!.map((c) => c[1]!));
  const lngs = features.flatMap((f) => f.geometry.coordinates[0]!.map((c) => c[0]!));
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];
}

/** Bounds across a mix of Polygon/MultiPolygon geometries — used for the
 * district layer, which boundsOf() (Polygon-only, single-ring) can't handle. */
function boundsOfGeometries(geometries: Geometry[]): [[number, number], [number, number]] {
  const coords: number[][] = [];
  for (const g of geometries) {
    if (g.type === "Polygon") coords.push(...g.coordinates.flat());
    else if (g.type === "MultiPolygon") coords.push(...g.coordinates.flat(2));
  }
  const lats = coords.map((c) => c[1]!);
  const lngs = coords.map((c) => c[0]!);
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];
}

/** The densest proposal cluster — real parcels are only ~100-300m wide, so
 * opening on all 6 states at once zooms out so far they're sub-pixel and
 * unclickable. Open on one real cluster instead, like a real cadastral
 * viewer does after a search — "fit all" is available as an explicit action. */
function defaultCluster(features: ParcelFeature[]): ParcelFeature[] {
  const byProposal = new Map<string, ParcelFeature[]>();
  for (const f of features) {
    const list = byProposal.get(f.properties.proposalId) ?? [];
    list.push(f);
    byProposal.set(f.properties.proposalId, list);
  }
  return [...byProposal.values()].sort((a, b) => b.length - a.length)[0] ?? features;
}

/** Recenters the map once, when geojson first loads or the highlighted parcel changes. */
function FitToData({
  data,
  highlightedUlpin,
  fitAllSignal,
}: {
  data: FeatureCollection<Polygon, ParcelFeatureProperties> | undefined;
  highlightedUlpin?: string | undefined;
  fitAllSignal: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!data || data.features.length === 0) return;
    if (fitAllSignal > 0) {
      map.fitBounds(boundsOf(data.features), { padding: [24, 24] });
      return;
    }
    const target = highlightedUlpin
      ? data.features.find((f) => f.properties.ulpin === highlightedUlpin)
      : undefined;
    if (target) {
      const [lng, lat] = target.geometry.coordinates[0]![0]!;
      map.setView([lat!, lng!], 16);
      return;
    }
    // Individual parcels vary in real-world size, and a proposal's parcels
    // can be spread a few km apart — fitBounds on the whole cluster can
    // still zoom out too far to see any single one. Center on one parcel
    // in the densest cluster at a fixed close zoom instead; "Fit all
    // parcels" is available for the zoomed-out view.
    const cluster = defaultCluster(data.features);
    const [lng, lat] = cluster[0]!.geometry.coordinates[0]![0]!;
    map.setView([lat!, lng!], 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, highlightedUlpin, fitAllSignal]);
  return null;
}

/** Reports the current zoom level up so district/block layers can hide
 * detail that isn't legible at the current scale. */
function ZoomWatcher({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => onZoom(map.getZoom()), [map, onZoom]);
  return null;
}

/** Flies to `request.bounds` whenever its `nonce` changes — driven by
 * clicking a district/block feature or a "zoom to" button, both of which
 * only have Leaflet layer bounds (not a live map instance) to work with. */
function FocusOnRequest({ request }: { request: FocusRequest | null }) {
  const map = useMap();
  useEffect(() => {
    if (!request) return;
    map.fitBounds(request.bounds, { padding: [24, 24] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.nonce]);
  return null;
}

export function SpatialMapContainer({ onParcelClick, highlightedUlpin }: SpatialMapContainerProps) {
  const { data, isLoading } = useParcelsGeoJson();
  const { data: districtsData } = useWestBengalDistricts();
  const { data: blocksData } = useWestBengalBlocks();
  const { person } = useRole();
  const [themeId, setThemeId] = useState<MapThemeId>("nlams");
  const [panelOpen, setPanelOpen] = useState(true);
  const [showCadastral, setShowCadastral] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showDistricts, setShowDistricts] = useState(true);
  const [showBlocks, setShowBlocks] = useState(true);
  const [showBhuvanAdmin, setShowBhuvanAdmin] = useState(false);
  const [showLulc, setShowLulc] = useState(false);
  const [basemap, setBasemap] = useState<(typeof BASEMAPS)[number]["value"]>("satellite");
  const [selected, setSelected] = useState<Selection | null>(null);
  const [fitAllSignal, setFitAllSignal] = useState(0);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [zoom, setZoom] = useState(5);

  const theme = MAP_THEMES[themeId];
  const geojson = data as FeatureCollection<Polygon, ParcelFeatureProperties> | undefined;
  const lulcLayer = selected?.kind === "parcel" ? lulcLayerFor(selected.properties.state) : null;
  const blocksVisible = showBlocks && zoom >= BLOCK_VISIBLE_ZOOM;
  const adminLabelsVisible = zoom >= ADMIN_LABEL_ZOOM;

  useEffect(() => {
    if (!highlightedUlpin || !geojson) return;
    const match = geojson.features.find((f) => f.properties.ulpin === highlightedUlpin);
    if (match) {
      setSelected({
        kind: "parcel",
        properties: match.properties,
        centroid: polygonCentroid(match.geometry.coordinates[0]!),
      });
    }
  }, [highlightedUlpin, geojson]);

  const selectParcel = (feature: Feature<Geometry, ParcelFeatureProperties>) => {
    if (feature.geometry.type !== "Polygon") return;
    const centroid = polygonCentroid(feature.geometry.coordinates[0]!);
    setSelected({ kind: "parcel", properties: feature.properties, centroid });
    onParcelClick?.(feature.properties);
  };

  /** Both admin layers can hold Polygon or MultiPolygon geometry, so bounds
   * (from the Leaflet layer itself, not the raw ring coordinates) are the
   * only reliable way to get a centroid/focus target for either shape. */
  const focusOn = (layer: Layer) => {
    const bounds = (layer as LeafletPolygon).getBounds();
    const center = bounds.getCenter();
    setFocusRequest({
      bounds: [
        [bounds.getSouth(), bounds.getWest()],
        [bounds.getNorth(), bounds.getEast()],
      ],
      nonce: Date.now(),
    });
    return [center.lat, center.lng] as [number, number];
  };

  const selectDistrict = (feature: DistrictFeature, layer: Layer, fly: boolean) => {
    const centroid = fly ? focusOn(layer) : polygonBoundsCentroid(layer);
    setSelected({ kind: "district", properties: feature.properties, centroid });
  };

  const selectBlock = (feature: BlockFeature, layer: Layer, fly: boolean) => {
    const centroid = fly ? focusOn(layer) : polygonBoundsCentroid(layer);
    setSelected({ kind: "block", properties: feature.properties, centroid });
  };

  /** Used by the block info panel's "back to district" link, which only has
   * the district's name (not its feature/layer) to work from. */
  const jumpToDistrict = (distName: string) => {
    const feature = districtsData?.features.find((f) => f.properties.distName === distName);
    if (!feature) return;
    const bounds = boundsOfGeometries([feature.geometry]);
    setFocusRequest({ bounds, nonce: Date.now() });
    setSelected({
      kind: "district",
      properties: feature.properties,
      centroid: [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2],
    });
  };

  const styleFor = (feature: Feature<Geometry, ParcelFeatureProperties> | undefined) => {
    const p = feature?.properties;
    const active =
      p &&
      ((selected?.kind === "parcel" && selected.properties.ulpin === p.ulpin) ||
        highlightedUlpin === p.ulpin);
    return {
      color: active ? SELECTED_PARCEL_COLOR : theme.parcelStroke,
      weight: active ? 3.5 : 1.5,
      fillColor: active ? SELECTED_PARCEL_COLOR : theme.parcelStroke,
      fillOpacity: active ? 0.35 : 0.08,
    };
  };

  const districtStyleFor = (feature: Feature<Geometry, DistrictFeatureProperties> | undefined) => {
    const active =
      selected?.kind === "district" &&
      selected.properties.distName === feature?.properties.distName;
    return {
      color: ADMIN_BOUNDARY_COLORS.district,
      weight: active ? 4 : 2,
      fillColor: ADMIN_BOUNDARY_COLORS.district,
      fillOpacity: active ? 0.12 : 0.02,
    };
  };

  const blockStyleFor = (feature: Feature<Geometry, BlockFeatureProperties> | undefined) => {
    const active =
      selected?.kind === "block" && selected.properties.blockName === feature?.properties.blockName;
    return {
      color: ADMIN_BOUNDARY_COLORS.block,
      weight: active ? 3.5 : 1.25,
      fillColor: ADMIN_BOUNDARY_COLORS.block,
      fillOpacity: active ? 0.15 : 0.02,
    };
  };

  const onEachFeature = (feature: Feature<Geometry, ParcelFeatureProperties>, layer: Layer) => {
    layer.on("click", (() => selectParcel(feature)) as (e: LeafletMouseEvent) => void);
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

  const onEachDistrict = (feature: Feature<Geometry, DistrictFeatureProperties>, layer: Layer) => {
    layer.on("click", (() => selectDistrict(feature as DistrictFeature, layer, true)) as (
      e: LeafletMouseEvent,
    ) => void);
    if (adminLabelsVisible) {
      layer.bindTooltip(
        `<span style="color:#ffffff;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,0.85)">${wbDistrictDisplayName(feature.properties.distName)}</span>`,
        {
          permanent: true,
          direction: "center",
          className: "border-none bg-transparent shadow-none !p-0",
        },
      );
    }
  };

  const onEachBlock = (feature: Feature<Geometry, BlockFeatureProperties>, layer: Layer) => {
    layer.on("click", (() => selectBlock(feature as BlockFeature, layer, true)) as (
      e: LeafletMouseEvent,
    ) => void);
    if (adminLabelsVisible) {
      layer.bindTooltip(
        `<span style="color:${ADMIN_BOUNDARY_COLORS.block};font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,0.6)">${feature.properties.blockName}</span>`,
        {
          permanent: true,
          direction: "center",
          className: "border-none bg-transparent shadow-none !p-0",
        },
      );
    }
  };

  // Force GeoJSON re-render when toggles that affect style/tooltips change.
  const geojsonKey = useMemo(
    () =>
      `${showLabels}-${themeId}-${selected?.kind}-${selected?.kind === "parcel" ? selected.properties.ulpin : ""}-${highlightedUlpin}`,
    [showLabels, themeId, selected, highlightedUlpin],
  );
  const districtsKey = useMemo(
    () =>
      `${adminLabelsVisible}-${selected?.kind === "district" ? selected.properties.distName : ""}`,
    [adminLabelsVisible, selected],
  );
  const blocksKey = useMemo(
    () =>
      `${adminLabelsVisible}-${blocksVisible}-${selected?.kind === "block" ? selected.properties.blockName : ""}`,
    [adminLabelsVisible, blocksVisible, selected],
  );

  /** WB parcels whose centroid falls inside the given block — computed lazily
   * (only for the currently-open block panel), not precomputed for all 349
   * blocks up front. */
  const parcelsInBlock = (block: BlockFeature): ParcelFeature[] => {
    if (!geojson) return [];
    return geojson.features.filter((f) => {
      if (f.properties.district !== block.properties.districtName) return false;
      const [lng, lat] = polygonCentroidLngLat(f.geometry.coordinates[0]!);
      return booleanPointInPolygon(turfPoint([lng, lat]), block.geometry);
    });
  };

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

        {showDistricts && districtsData && (
          <GeoJSON
            key={`districts-${districtsKey}`}
            data={districtsData}
            style={districtStyleFor as (feature?: Feature<Geometry>) => object}
            onEachFeature={onEachDistrict as (feature: Feature<Geometry>, layer: Layer) => void}
          />
        )}

        {blocksVisible && blocksData && (
          <GeoJSON
            key={`blocks-${blocksKey}`}
            data={blocksData}
            style={blockStyleFor as (feature?: Feature<Geometry>) => object}
            onEachFeature={onEachBlock as (feature: Feature<Geometry>, layer: Layer) => void}
          />
        )}

        {showCadastral && geojson && (
          <GeoJSON key={geojsonKey} data={geojson} style={styleFor} onEachFeature={onEachFeature} />
        )}

        <FitToData data={geojson} highlightedUlpin={highlightedUlpin} fitAllSignal={fitAllSignal} />
        <FocusOnRequest request={focusRequest} />
        <ZoomWatcher onZoom={setZoom} />
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
        <div className="panel absolute left-3 top-14 z-[1000] w-[252px] p-3">
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
            <div className="label-xs">West Bengal — District &amp; Block</div>
            <div className="mt-2 space-y-2">
              <LayerRow
                label="District Boundaries"
                checked={showDistricts}
                onChange={setShowDistricts}
              />
              <LayerRow
                label={
                  blocksVisible || !showBlocks ? "Block Boundaries" : "Block Boundaries — zoom in"
                }
                checked={showBlocks}
                onChange={setShowBlocks}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!districtsData || districtsData.features.length === 0) return;
                const bounds = boundsOfGeometries(districtsData.features.map((f) => f.geometry));
                setFocusRequest({ bounds, nonce: Date.now() });
              }}
              disabled={!districtsData}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Locate className="size-3.5" />
              Zoom to West Bengal
            </button>
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

      {/* Zoom-out escape hatch — individual parcels are ~100-300m wide, so
          the default view opens on one real cluster, not all of India. */}
      <button
        type="button"
        onClick={() => setFitAllSignal((n) => n + 1)}
        className="panel absolute bottom-3 left-3 z-[1000] px-3 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted"
      >
        Fit all parcels
      </button>

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
        <div className="mt-1 flex items-center gap-2">
          <span
            className="size-2.5 rounded-[2px]"
            style={{ backgroundColor: ADMIN_BOUNDARY_COLORS.district }}
          />
          <span className="text-[11px] text-muted-foreground">District boundary</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span
            className="size-2.5 rounded-[2px]"
            style={{ backgroundColor: ADMIN_BOUNDARY_COLORS.block }}
          />
          <span className="text-[11px] text-muted-foreground">Block boundary</span>
        </div>
      </div>

      {/* Selection info panel — parcel, district, or block */}
      {selected && (
        <aside className="absolute inset-y-0 right-0 z-[1000] w-[340px] overflow-y-auto border-l border-border bg-card p-4 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="label-xs">
                {selected.kind === "parcel"
                  ? "Land Parcel Information"
                  : selected.kind === "district"
                    ? "District"
                    : "Block"}
              </div>
              <div className="num mt-1 text-[11px] text-muted-foreground">
                {selected.centroid[0].toFixed(6)}, {selected.centroid[1].toFixed(6)}
              </div>
            </div>
            <button
              type="button"
              aria-label="Close panel"
              onClick={() => setSelected(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          {selected.kind === "parcel" && (
            <>
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
            </>
          )}

          {selected.kind === "district" &&
            (() => {
              const distName = selected.properties.distName;
              const blocksInDistrict =
                blocksData?.features.filter((f) => f.properties.districtName === distName) ?? [];
              const parcelsInDistrict =
                geojson?.features.filter((f) => f.properties.district === distName) ?? [];
              const proposalCount = new Set(parcelsInDistrict.map((f) => f.properties.proposalId))
                .size;
              return (
                <>
                  <div className="mt-3">
                    <InfoBox label="District" value={wbDistrictDisplayName(distName)} />
                  </div>
                  <dl className="mt-4 space-y-2.5 text-[12.5px]">
                    <Row label="State" value="West Bengal" />
                    <Row label="CD Blocks" value={String(blocksInDistrict.length)} mono />
                    <Row label="Seeded Proposals" value={String(proposalCount)} mono />
                    <Row label="Seeded Parcels" value={String(parcelsInDistrict.length)} mono />
                  </dl>
                  {blocksInDistrict.length > 0 && (
                    <p className="mt-3 text-[11px] text-muted-foreground">
                      Zoom in (or enable Block Boundaries) to see this district's{" "}
                      {blocksInDistrict.length} CD blocks.
                    </p>
                  )}
                </>
              );
            })()}

          {selected.kind === "block" &&
            (() => {
              const parcelsHere = (() => {
                const feature = blocksData?.features.find(
                  (f) =>
                    f.properties.blockName === selected.properties.blockName &&
                    f.properties.districtName === selected.properties.districtName,
                );
                return feature ? parcelsInBlock(feature) : [];
              })();
              return (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <InfoBox label="Block" value={selected.properties.blockName} />
                    <InfoBox
                      label="District"
                      value={wbDistrictDisplayName(selected.properties.districtName)}
                    />
                  </div>
                  <dl className="mt-4 space-y-2.5 text-[12.5px]">
                    <Row label="State" value="West Bengal" />
                    <Row label="Seeded Parcels" value={String(parcelsHere.length)} mono />
                  </dl>
                  <button
                    type="button"
                    onClick={() => jumpToDistrict(selected.properties.districtName)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Locate className="size-3.5" />
                    Back to {wbDistrictDisplayName(selected.properties.districtName)}
                  </button>
                </>
              );
            })()}
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
