import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  WMSTileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { canvas } from "leaflet";
import type { Layer, LeafletMouseEvent, Polygon as LeafletPolygon } from "leaflet";
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from "geojson";
import {
  Check,
  Loader2,
  Map as MapIcon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCcw,
  Satellite,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point as turfPoint } from "@turf/helpers";
import "leaflet/dist/leaflet.css";
import { STATE_LIST } from "@/data/mockData";
import { useParcelsGeoJson, type ParcelFeatureProperties } from "@/hooks/useParcels";
import {
  useStateBoundary,
  useDistricts,
  useBlocks,
  type DistrictFeature,
  type DistrictFeatureProperties,
  type BlockFeature,
  type BlockFeatureProperties,
} from "@/hooks/useAdminBoundaries";
import {
  useWbParcelManifest,
  useWbParcelDistrict,
  type WbParcelFeatureProperties,
} from "@/hooks/useWbParcels";
import { useRole } from "@/context/RoleContext";
import {
  SELECTED_PARCEL_COLOR,
  ADMIN_BOUNDARY_COLORS,
  WB_PARCEL_FABRIC_COLORS,
  lulcLayerFor,
} from "@/lib/mapThemes";
import { districtDisplayName } from "@/lib/westBengalDistrictNames";
import { CadastralInspector } from "./CadastralInspector";
import { PARCEL_STATUS_LABEL, statusFor, splitKhasra, type Selection } from "./cadastral";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Blocks are only rendered once zoomed in this far — 349 of them at once
 * over all West Bengal is unreadable, and this roughly matches the zoom
 * level at which the real TN Nilam viewer starts showing block/village
 * detail. */
const BLOCK_VISIBLE_ZOOM = 9;
/** Below this zoom, district/block name labels are skipped — otherwise 23
 * district labels (or 349 block labels) overlap into noise. */
const ADMIN_LABEL_ZOOM = 7;
/** Survey numbers are only pinned onto the map at this zoom; below it the
 * canvas stays clean and hovering a plot reveals its details instead. */
const PARCEL_LABEL_ZOOM = 15;
/** Block/taluk names only help while looking at sub-district scale — beyond
 * this zoom the parcel survey numbers take over, or the canvas drowns in
 * overlapping labels. */
const BLOCK_LABEL_MAX_ZOOM = 12;
/** Hover tooltips on the (potentially thousands of) WB fabric parcels are
 * only bound once the officer is zoomed in far enough to target one. */
const WB_PARCEL_TOOLTIP_ZOOM = 14;

/** Bright cadastral blue reads clearly over satellite imagery. */
const CADASTRAL_PARCEL_COLOR = "#3b82f6";

const ALL = "__all__";

type Basemap = "satellite" | "osm";

const BASEMAPS: { value: Basemap; label: string }[] = [
  { value: "satellite", label: "Satellite Imagery" },
  { value: "osm", label: "OpenStreetMap" },
];

/** ISRO Bhuvan public WMS (bhuvan-vec1.nrsc.gov.in) — no API key required.
 * Verified layers: basemap:INDIA_STATE, basemap:INDIA_DIST, and the
 * per-state *_LULC (land use / land cover) layers used below. */
const BHUVAN_WMS_URL = "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms";
const BHUVAN_ADMIN_LAYERS = "basemap:INDIA_STATE,basemap:INDIA_DIST";

/** Human-readable labels for the wb_parcels manifest's `status` field. */
const WB_DISTRICT_STATUS_LABEL: Record<string, string> = {
  CURRENT_23_DISTRICT: "current district",
  CURRENT_PARENT_MINUS_PROPOSED_CARVEOUT: "current, minus proposed carve-out",
  PROPOSED_DISTRICT_2026_BUDGET: "proposed — 2026 budget",
  PROPOSED_REVENUE_DISTRICT_VIEW: "proposed revenue-district view",
};

/** Cascading cadastral filter state — every field except `query` uses the
 * `ALL` sentinel for "not filtered". */
interface CadastralFilters {
  query: string;
  proposalId: string;
  district: string;
  taluk: string;
  village: string;
  classification: string;
  status: string;
}

const EMPTY_FILTERS: CadastralFilters = {
  query: "",
  proposalId: ALL,
  district: ALL,
  taluk: ALL,
  village: ALL,
  classification: ALL,
  status: ALL,
};

/** Bumped on every "zoom to" request so repeated clicks on the same feature still refocus. */
interface FocusRequest {
  bounds: [[number, number], [number, number]];
  nonce: number;
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

/** Recenters the map when geojson first loads, the state view changes or the
 * highlighted parcel changes. */
function FitToData({
  data,
  focusState,
  highlightedUlpin,
  fitAllSignal,
  onZoom,
}: {
  data: FeatureCollection<Polygon, ParcelFeatureProperties> | undefined;
  focusState: string;
  highlightedUlpin?: string | undefined;
  fitAllSignal: number;
  onZoom: (zoom: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!data || data.features.length === 0) return;
    const candidates = data.features.filter((f) => f.properties.state === focusState);
    if (candidates.length === 0) return;
    // Programmatic fits can land before the map has finished opening, when
    // Leaflet coalesces the zoom/move events — read the zoom back directly.
    const syncZoom = () => onZoom(map.getZoom());
    if (fitAllSignal > 0) {
      map.fitBounds(boundsOf(candidates), { padding: [24, 24] });
      map.once("moveend", syncZoom);
      syncZoom();
      return;
    }
    if (highlightedUlpin) {
      // A specific ULPIN was requested (e.g. a "View on map" link) — if it
      // isn't in this dataset, say so rather than silently jumping to an
      // unrelated parcel, which used to look like the map "zoomed to the
      // wrong place" for a parcel/proposal that doesn't exist here.
      const target = data.features.find((f) => f.properties.ulpin === highlightedUlpin);
      if (target) {
        const [lng, lat] = target.geometry.coordinates[0]![0]!;
        map.setView([lat!, lng!], 16);
        map.once("moveend", syncZoom);
        syncZoom();
      } else {
        toast.error(`Parcel ${highlightedUlpin} not found on this map`);
      }
      return;
    }
    // Individual parcels vary in real-world size, and a proposal's parcels
    // can be spread a few km apart — fitBounds on the whole cluster can
    // still zoom out too far to see any single one. Center on one parcel
    // in the densest cluster at a fixed close zoom instead; "Fit all
    // parcels" is available for the zoomed-out view.
    const cluster = defaultCluster(candidates);
    const [lng, lat] = cluster[0]!.geometry.coordinates[0]![0]!;
    map.setView([lat!, lng!], 16);
    map.once("moveend", syncZoom);
    syncZoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, focusState, highlightedUlpin, fitAllSignal, onZoom]);
  return null;
}

/** WB parcels use a dedicated Canvas renderer (thousands of polygons per
 * district) in its own pane with an explicit z-index above the shared
 * default overlay pane (z-index 400). Without this, whichever renderer
 * happens to mount second — the wb_parcels static file usually beats the
 * authenticated /api/parcels/geojson call — wins the stacking order, which
 * would otherwise make district/block clicks silently swallow wb parcel
 * clicks (or vice versa) depending on network timing. */
const WB_PARCELS_PANE = "wbParcels";
function WbParcelsPaneSetup() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane(WB_PARCELS_PANE)) {
      const pane = map.createPane(WB_PARCELS_PANE);
      pane.style.zIndex = "410";
    }
  }, [map]);
  return null;
}

/** Reports the current zoom level up so district/block layers can hide
 * detail that isn't legible at the current scale. Listens for `moveend` as
 * well as `zoomend` — the initial programmatic fit fires `moveend` reliably
 * even when the opening zoom animation coalesces the zoom events. */
function ZoomWatcher({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
    moveend: () => onZoom(map.getZoom()),
  });
  useEffect(() => onZoom(map.getZoom()), [map, onZoom]);
  return null;
}

/** Flies to `request.bounds` whenever its `nonce` changes — driven by
 * clicking a district/block feature or a "zoom to" button, both of which
 * only have Leaflet layer bounds (not a live map instance) to work with. */
function FocusOnRequest({
  request,
  onZoom,
}: {
  request: FocusRequest | null;
  onZoom: (zoom: number) => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!request) return;
    map.fitBounds(request.bounds, { padding: [24, 24] });
    const syncZoom = () => onZoom(map.getZoom());
    map.once("moveend", syncZoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.nonce]);
  return null;
}

export interface SpatialMapContainerProps {
  onParcelClick?: (parcel: ParcelFeatureProperties) => void;
  highlightedUlpin?: string | undefined;
}

export function SpatialMapContainer({ onParcelClick, highlightedUlpin }: SpatialMapContainerProps) {
  const { data, isLoading } = useParcelsGeoJson();
  const { activeState, setActiveState, stateOptions } = useRole();
  /** Falls back to the last concrete state when the header region view is
   * "all states" — the canvas always needs one state's boundaries loaded. */
  const [localStateCode, setLocalStateCode] = useState("WB");
  const activeStateCode = useMemo(
    () => (activeState ? (STATE_LIST.find((s) => s.name === activeState)?.code ?? null) : null),
    [activeState],
  );
  const stateCode = activeStateCode ?? localStateCode;
  const stateName = STATE_LIST.find((s) => s.code === stateCode)?.name ?? stateCode;
  const { data: stateBoundaryData } = useStateBoundary(stateCode);
  const { data: districtsData } = useDistricts(stateCode);
  const { data: blocksData } = useBlocks(stateCode);

  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState<CadastralFilters>(EMPTY_FILTERS);
  const [showCadastral, setShowCadastral] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showStateBoundary, setShowStateBoundary] = useState(true);
  const [showDistricts, setShowDistricts] = useState(true);
  const [showBlocks, setShowBlocks] = useState(true);
  const [showBhuvanAdmin, setShowBhuvanAdmin] = useState(false);
  const [showLulc, setShowLulc] = useState(false);
  const [basemap, setBasemap] = useState<Basemap>("satellite");
  const [selected, setSelected] = useState<Selection | null>(null);
  const [fitAllSignal, setFitAllSignal] = useState(0);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [zoom, setZoom] = useState(8);
  const [showWbParcels, setShowWbParcels] = useState(false);
  const [wbParcelDistrictSlug, setWbParcelDistrictSlug] = useState<string | null>(null);

  const geojson = data as FeatureCollection<Polygon, ParcelFeatureProperties> | undefined;
  const lulcLayer = selected?.kind === "parcel" ? lulcLayerFor(selected.properties.state) : null;
  const blocksVisible = showBlocks && zoom >= BLOCK_VISIBLE_ZOOM;
  const adminLabelsVisible = zoom >= ADMIN_LABEL_ZOOM;
  const blockLabelsVisible = adminLabelsVisible && zoom <= BLOCK_LABEL_MAX_ZOOM;
  const parcelLabelsPermanent = showLabels && zoom >= PARCEL_LABEL_ZOOM;
  const wbTooltipsVisible = zoom >= WB_PARCEL_TOOLTIP_ZOOM;

  /** BHUMITRA West Bengal 28-district target-state parcel demo — see
   * public/geo/wb_parcels. Opt-in and WB-only: 28 districts x up to ~9.5k
   * parcels each is too much to fetch or render at once. */
  const { data: wbManifest } = useWbParcelManifest();
  const wbParcelsEnabled = stateCode === "WB" && showWbParcels;
  const { data: wbParcelData, isLoading: wbParcelsLoading } = useWbParcelDistrict(
    wbParcelsEnabled ? wbParcelDistrictSlug : null,
  );
  const wbCanvasRenderer = useMemo(() => canvas({ padding: 0.5, pane: WB_PARCELS_PANE }), []);

  /** Default the state view to the first parcel's state once records load —
   * a scoped officer opens straight onto their own state instead of WB. */
  const autoStateDone = useRef(false);
  useEffect(() => {
    if (autoStateDone.current || !geojson?.features.length) return;
    autoStateDone.current = true;
    const first = geojson.features[0]!.properties.state;
    const code = STATE_LIST.find((s) => s.name === first)?.code;
    if (code && !activeState) setLocalStateCode((cur) => (cur === "WB" ? code : cur));
  }, [geojson, activeState]);

  /** Any region change — from the header switcher or the sidebar State
   * filter — invalidates the district/taluk/village cascade. */
  const prevStateCode = useRef(stateCode);
  useEffect(() => {
    if (prevStateCode.current === stateCode) return;
    prevStateCode.current = stateCode;
    setSelected(null);
    setFilters(EMPTY_FILTERS);
    setWbParcelDistrictSlug(null);
    setShowWbParcels(false);
  }, [stateCode]);

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

  /** Fly to a newly-selected WB parcel-fabric district once its geometry
   * loads — fires once per slug, not on every re-render/refetch. */
  const wbFittedSlug = useRef<string | null>(null);
  useEffect(() => {
    if (!wbParcelDistrictSlug || !wbParcelData || wbParcelData.features.length === 0) return;
    if (wbFittedSlug.current === wbParcelDistrictSlug) return;
    wbFittedSlug.current = wbParcelDistrictSlug;
    setFocusRequest({
      bounds: boundsOfGeometries(wbParcelData.features.map((f) => f.geometry)),
      nonce: Date.now(),
    });
  }, [wbParcelDistrictSlug, wbParcelData]);

  /** Which CD block contains each seeded parcel — computed once per state so
   * the Taluk filter and roll-ups can work off real boundaries. */
  const parcelBlockByUlpin = useMemo(() => {
    const map = new Map<string, string>();
    if (!geojson || !blocksData?.features.length) return map;
    const blocks = blocksData.features;
    for (const f of geojson.features) {
      const p = f.properties;
      if (p.state !== stateName) continue;
      const [lng, lat] = polygonCentroidLngLat(f.geometry.coordinates[0]!);
      const pt = turfPoint([lng, lat]);
      const block = blocks.find((b) => booleanPointInPolygon(pt, b.geometry));
      if (block) map.set(p.ulpin, block.properties.blockName);
    }
    return map;
  }, [geojson, blocksData, stateName]);

  const seedDistricts = useMemo(() => {
    const set = new Set<string>();
    for (const f of geojson?.features ?? []) {
      if (f.properties.state === stateName) set.add(f.properties.district);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [geojson, stateName]);

  const proposalOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of geojson?.features ?? []) {
      if (f.properties.state === stateName)
        map.set(f.properties.proposalId, f.properties.projectName);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [geojson, stateName]);

  const districtOptions = useMemo(() => {
    const seedNames = new Set(seedDistricts);
    const seed = seedDistricts.map((d) => ({ value: d, label: d }));
    const fabric =
      stateCode === "WB"
        ? (wbManifest ?? [])
            .filter((m) => !seedNames.has(m.district))
            .map((m) => ({ value: `wb:${m.slug}`, label: `${m.district} · cadastral fabric` }))
        : [];
    return [{ value: ALL, label: "All districts" }, ...seed, ...fabric];
  }, [seedDistricts, stateCode, wbManifest]);

  const talukOptions = useMemo(() => {
    const values = new Set<string>();
    if (wbParcelData) {
      for (const f of wbParcelData.features) {
        if (f.properties.block) values.add(f.properties.block);
      }
    } else {
      for (const f of geojson?.features ?? []) {
        const p = f.properties;
        if (p.state !== stateName) continue;
        if (filters.district !== ALL && p.district !== filters.district) continue;
        const block = parcelBlockByUlpin.get(p.ulpin);
        if (block) values.add(block);
      }
    }
    return [
      { value: ALL, label: "All taluks" },
      ...[...values].sort((a, b) => a.localeCompare(b)).map((v) => ({ value: v, label: v })),
    ];
  }, [wbParcelData, geojson, stateName, filters.district, parcelBlockByUlpin]);

  const villageOptions = useMemo(() => {
    const values = new Set<string>();
    for (const f of wbParcelData?.features ?? []) {
      const p = f.properties;
      if (filters.taluk !== ALL && p.block !== filters.taluk) continue;
      if (p.mouza) values.add(p.mouza);
    }
    return [
      { value: ALL, label: "All revenue villages" },
      ...[...values].sort((a, b) => a.localeCompare(b)).map((v) => ({ value: v, label: v })),
    ];
  }, [wbParcelData, filters.taluk]);

  /** Seeded ULPIN parcels matching the cascading filters. */
  const filteredGeojson = useMemo(() => {
    if (!geojson) return undefined;
    const needle = filters.query.trim().toLowerCase();
    const features = geojson.features.filter((f) => {
      const p = f.properties;
      if (p.state !== stateName) return false;
      if (needle) {
        const hit = [p.ulpin, p.khasraNo, p.projectName, p.ownerName].some((v) =>
          v.toLowerCase().includes(needle),
        );
        if (!hit) return false;
      }
      if (filters.proposalId !== ALL && p.proposalId !== filters.proposalId) return false;
      if (filters.district !== ALL && p.district !== filters.district) return false;
      if (filters.taluk !== ALL && parcelBlockByUlpin.get(p.ulpin) !== filters.taluk) return false;
      if (filters.village !== ALL) return false;
      if (filters.classification !== ALL && p.classification !== filters.classification)
        return false;
      if (filters.status !== ALL && statusFor(p.ulpin) !== filters.status) return false;
      return true;
    });
    return { ...geojson, features };
  }, [geojson, stateName, filters, parcelBlockByUlpin]);

  /** Banglarbhumi fabric matching the village/taluk/search filters. */
  const filteredWbParcelData = useMemo(() => {
    if (!wbParcelData) return undefined;
    const needle = filters.query.trim().toLowerCase();
    const features = wbParcelData.features.filter((f) => {
      const p = f.properties;
      if (needle) {
        const hit = [p.id, p.plot, p.khatianNo, p.mouza, p.block].some((v) =>
          v.toLowerCase().includes(needle),
        );
        if (!hit) return false;
      }
      if (filters.taluk !== ALL && p.block !== filters.taluk) return false;
      if (filters.village !== ALL && p.mouza !== filters.village) return false;
      return true;
    });
    return { ...wbParcelData, features };
  }, [wbParcelData, filters.query, filters.taluk, filters.village]);

  const seedParcelCount = filteredGeojson?.features.length ?? 0;
  const wbParcelCount = filteredWbParcelData?.features.length ?? 0;
  const filterSignature = `${filters.query}|${filters.proposalId}|${filters.district}|${filters.taluk}|${filters.village}|${filters.classification}|${filters.status}`;

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

  /** wb_parcels geometry is Polygon or MultiPolygon (the real Banglarbhumi
   * captures are MultiPolygon) — the layer's own bounds center is the only
   * centroid that works for both. */
  const selectWbParcel = (
    feature: Feature<Polygon | MultiPolygon, WbParcelFeatureProperties>,
    layer: Layer,
  ) => {
    const centroid = polygonBoundsCentroid(layer);
    const district =
      wbManifest?.find((m) => m.slug === wbParcelDistrictSlug)?.district ??
      wbParcelDistrictSlug ??
      "";
    setSelected({ kind: "wbParcel", properties: feature.properties, district, centroid });
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
      color: active ? SELECTED_PARCEL_COLOR : CADASTRAL_PARCEL_COLOR,
      weight: active ? 3.5 : 1.5,
      fillColor: active ? SELECTED_PARCEL_COLOR : CADASTRAL_PARCEL_COLOR,
      fillOpacity: active ? 0.35 : 0.1,
    };
  };

  const stateStyleFor = () => ({
    color: ADMIN_BOUNDARY_COLORS.state,
    weight: 2.5,
    fillOpacity: 0,
    dashArray: "6 4",
  });

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

  const hoverTipClass =
    "!rounded-[6px] !border !border-border !bg-card !px-2.5 !py-1.5 !text-foreground !shadow-lg";

  const onEachFeature = (feature: Feature<Geometry, ParcelFeatureProperties>, layer: Layer) => {
    layer.on("click", (() => selectParcel(feature)) as (e: LeafletMouseEvent) => void);
    const p = feature.properties;
    const { survey, subDivision } = splitKhasra(p.khasraNo);
    if (parcelLabelsPermanent) {
      // Zoomed in far enough that a sparse pinned survey number helps rather
      // than clutters — hover details remain available on click.
      layer.bindTooltip(
        `<span style="color:#ffffff;font-weight:600;font-size:10px;text-shadow:0 1px 3px rgba(0,0,0,0.9)">${survey}${subDivision ? `/${subDivision}` : ""}</span>`,
        {
          permanent: true,
          direction: "center",
          className: "map-plain-label",
        },
      );
    } else {
      layer.bindTooltip(
        `<div style="font-family:Inter,sans-serif;font-size:11px;line-height:1.4;color:#0f2942;min-width:150px">
          <div style="font-weight:700">Survey No. ${survey}${subDivision ? `/${subDivision}` : ""}</div>
          <div style="color:#475569">ULPIN ${p.ulpin}</div>
          <div style="color:#475569">${p.areaHa.toFixed(2)} Ha · ${p.classification === "URBAN" ? "Urban" : "Rural"}</div>
          <div style="color:#475569">Owner: ${p.ownerName}${p.coOwners > 0 ? ` +${p.coOwners}` : ""}</div>
        </div>`,
        { sticky: true, direction: "top", opacity: 1, className: hoverTipClass },
      );
    }
  };

  const onEachDistrict = (feature: Feature<Geometry, DistrictFeatureProperties>, layer: Layer) => {
    layer.on("click", (() => selectDistrict(feature as DistrictFeature, layer, true)) as (
      e: LeafletMouseEvent,
    ) => void);
    if (adminLabelsVisible) {
      layer.bindTooltip(
        `<span style="color:#ffffff;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,0.85)">${districtDisplayName(feature.properties.distName, stateCode)}</span>`,
        {
          permanent: true,
          direction: "center",
          className: "map-plain-label",
        },
      );
    }
  };

  const onEachBlock = (feature: Feature<Geometry, BlockFeatureProperties>, layer: Layer) => {
    layer.on("click", (() => selectBlock(feature as BlockFeature, layer, true)) as (
      e: LeafletMouseEvent,
    ) => void);
    if (blockLabelsVisible) {
      layer.bindTooltip(
        `<span style="color:${ADMIN_BOUNDARY_COLORS.block};font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,0.6)">${feature.properties.blockName}</span>`,
        {
          permanent: true,
          direction: "center",
          className: "map-plain-label",
        },
      );
    }
  };

  const wbParcelStyleFor = (feature: Feature<Geometry, WbParcelFeatureProperties> | undefined) => {
    const p = feature?.properties;
    const active = selected?.kind === "wbParcel" && selected.properties.id === p?.id;
    const base = p?.real ? WB_PARCEL_FABRIC_COLORS.real : WB_PARCEL_FABRIC_COLORS.synthetic;
    return {
      color: active ? SELECTED_PARCEL_COLOR : base,
      weight: active ? 3 : 1,
      fillColor: active ? SELECTED_PARCEL_COLOR : base,
      fillOpacity: active ? 0.3 : p?.real ? 0.18 : 0.06,
    };
  };

  /** Fabric parcels run into the thousands per district — hover details are
   * bound only once zoomed past WB_PARCEL_TOOLTIP_ZOOM. */
  const onEachWbParcel = (feature: Feature<Geometry, WbParcelFeatureProperties>, layer: Layer) => {
    layer.on("click", (() =>
      selectWbParcel(
        feature as Feature<Polygon | MultiPolygon, WbParcelFeatureProperties>,
        layer,
      )) as (e: LeafletMouseEvent) => void);
    if (wbTooltipsVisible) {
      const p = feature.properties;
      layer.bindTooltip(
        `<div style="font-family:Inter,sans-serif;font-size:11px;line-height:1.4;color:#0f2942;min-width:140px">
          <div style="font-weight:700">Plot ${p.plot}</div>
          <div style="color:#475569">Mouza ${p.mouza || "—"} · Block ${p.block || "—"}</div>
          <div style="color:#475569">${
            p.areaSqm > 0 ? `${p.areaSqm.toLocaleString()} m²` : "Area not recorded"
          } · Kathian ${p.khatianNo || "—"}</div>
        </div>`,
        { sticky: true, direction: "top", opacity: 1, className: hoverTipClass },
      );
    }
  };

  // Force GeoJSON to remount whenever the rendered feature set changes —
  // react-leaflet v5's GeoJSON only reacts to `style` prop updates, never to
  // a changed `data` prop, so the data identity must live in the key.
  const geojsonKey = useMemo(
    () =>
      `${stateName}-${filterSignature}-${parcelLabelsPermanent}-${selected?.kind === "parcel" ? selected.properties.ulpin : ""}-${highlightedUlpin}`,
    [stateName, filterSignature, parcelLabelsPermanent, selected, highlightedUlpin],
  );
  const districtsKey = useMemo(
    () =>
      `${stateCode}-${adminLabelsVisible}-${selected?.kind === "district" ? selected.properties.distName : ""}`,
    [stateCode, adminLabelsVisible, selected],
  );
  const blocksKey = useMemo(
    () =>
      `${stateCode}-${blockLabelsVisible}-${blocksVisible}-${selected?.kind === "block" ? selected.properties.blockName : ""}`,
    [stateCode, blockLabelsVisible, blocksVisible, selected],
  );
  const wbParcelsKey = useMemo(
    () =>
      `${wbParcelDistrictSlug}-${wbTooltipsVisible}-${selected?.kind === "wbParcel" ? selected.properties.id : ""}-${filters.query}|${filters.taluk}|${filters.village}`,
    [
      wbParcelDistrictSlug,
      wbTooltipsVisible,
      selected,
      filters.query,
      filters.taluk,
      filters.village,
    ],
  );

  const changeState = useCallback(
    (code: string) => {
      setLocalStateCode(code);
      setActiveState(STATE_LIST.find((s) => s.code === code)?.name ?? null);
    },
    [setActiveState],
  );

  const changeDistrict = (value: string) => {
    if (value === ALL) {
      setFilters((f) => ({ ...f, district: ALL, taluk: ALL, village: ALL }));
      setWbParcelDistrictSlug(null);
      setShowWbParcels(false);
      return;
    }
    if (value.startsWith("wb:")) {
      const slug = value.slice(3);
      const name = wbManifest?.find((m) => m.slug === slug)?.district ?? slug;
      setWbParcelDistrictSlug(slug);
      setShowWbParcels(true);
      setFilters((f) => ({ ...f, district: name, taluk: ALL, village: ALL }));
      return;
    }
    setWbParcelDistrictSlug(null);
    setShowWbParcels(false);
    setFilters((f) => ({ ...f, district: value, taluk: ALL, village: ALL }));
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setWbParcelDistrictSlug(null);
    setShowWbParcels(false);
  };

  const fitToState = () => {
    const source = districtsData?.features.length
      ? districtsData.features
      : stateBoundaryData?.features;
    if (!source || source.length === 0) return;
    setFocusRequest({
      bounds: boundsOfGeometries(source.map((f) => f.geometry)),
      nonce: Date.now(),
    });
  };

  const activeFilterCount =
    (filters.query ? 1 : 0) +
    (filters.proposalId !== ALL ? 1 : 0) +
    (filters.district !== ALL ? 1 : 0) +
    (filters.taluk !== ALL ? 1 : 0) +
    (filters.village !== ALL ? 1 : 0) +
    (filters.classification !== ALL ? 1 : 0) +
    (filters.status !== ALL ? 1 : 0);

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-[#0b1220]">
      <MapContainer
        center={[22.54, 88.21]}
        zoom={8}
        scrollWheelZoom
        zoomControl={false}
        className="min-h-0 min-w-0 flex-1"
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

        {showStateBoundary && stateBoundaryData && (
          <GeoJSON
            key={`state-${stateCode}`}
            data={stateBoundaryData}
            style={stateStyleFor as (feature?: Feature<Geometry>) => object}
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

        {showCadastral && filteredGeojson && (
          <GeoJSON
            key={`parcels-${geojsonKey}`}
            data={filteredGeojson}
            style={styleFor}
            onEachFeature={onEachFeature}
          />
        )}

        {wbParcelsEnabled && filteredWbParcelData && (
          <>
            <WbParcelsPaneSetup />
            <GeoJSON
              key={wbParcelsKey}
              data={filteredWbParcelData}
              style={wbParcelStyleFor as (feature?: Feature<Geometry>) => object}
              onEachFeature={onEachWbParcel as (feature: Feature<Geometry>, layer: Layer) => void}
              pane={WB_PARCELS_PANE}
              // react-leaflet's GeoJSONProps doesn't type `renderer`, but Leaflet's
              // GeoJSON layer forwards it to every created Path — needed here since
              // a district's fabric can run into the thousands of polygons.
              {...({ renderer: wbCanvasRenderer } as Record<string, unknown>)}
            />
          </>
        )}

        <FitToData
          data={geojson}
          focusState={stateName}
          highlightedUlpin={highlightedUlpin}
          fitAllSignal={fitAllSignal}
          onZoom={setZoom}
        />
        <FocusOnRequest request={focusRequest} onZoom={setZoom} />
        <ZoomWatcher onZoom={setZoom} />
        <ZoomControl position="bottomright" />
      </MapContainer>

      {(isLoading || wbParcelsLoading) && (
        <div className="pointer-events-none absolute inset-0 z-[1100] grid place-items-center bg-background/40">
          <div className="flex items-center gap-2 rounded-[6px] bg-card px-3 py-2 text-[12.5px] shadow">
            <Loader2 className="size-4 animate-spin" />
            {wbParcelsLoading
              ? "Loading West Bengal cadastral fabric (Banglarbhumi demo capture)…"
              : "Fetching parcel records from the National Land Records Repository…"}
          </div>
        </div>
      )}

      {/* Left — cascading cadastral filters */}
      <aside
        className={cn(
          "absolute inset-y-0 left-0 z-[1000] flex w-[292px] flex-col border-r border-border bg-card/95 backdrop-blur transition-transform duration-200",
          filtersOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-1 border-b border-border px-3 py-2.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-3.5 text-navy" />
            <span className="text-[12.5px] font-semibold text-foreground">Cadastral Filters</span>
            {activeFilterCount > 0 && (
              <span className="num rounded-full bg-navy px-1.5 text-[10px] font-semibold text-navy-foreground">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={resetFilters}
              title="Reset filters"
              className="inline-flex items-center gap-1 rounded-[4px] px-1.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RefreshCcw className="size-3" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              aria-label="Collapse filters"
              className="grid size-7 place-items-center rounded-[4px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <SelectField
            label="Infrastructure Project"
            value={filters.proposalId}
            onChange={(v) => setFilters((f) => ({ ...f, proposalId: v }))}
            options={[
              { value: ALL, label: "All projects" },
              ...proposalOptions.map(([id, name]) => ({
                value: id,
                label: `${id} — ${name}`,
              })),
            ]}
          />

          <div>
            <Label className="label-xs" htmlFor="cadastral-search">
              Search Survey / Hissa / Owner / ULPIN
            </Label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="cadastral-search"
                value={filters.query}
                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                placeholder="e.g. 307, 153/2, ULPIN…"
                className="h-8 rounded-[4px] pl-8 text-[12px]"
              />
            </div>
          </div>

          <SelectField
            label="State"
            value={stateCode}
            onChange={changeState}
            options={stateOptions.map((name) => ({
              value: STATE_LIST.find((s) => s.name === name)?.code ?? name,
              label: name,
            }))}
          />

          <SelectField
            label="District"
            value={wbParcelDistrictSlug ? `wb:${wbParcelDistrictSlug}` : filters.district}
            onChange={changeDistrict}
            options={districtOptions}
          />

          <SelectField
            label="Taluk / CD Block"
            value={filters.taluk}
            onChange={(v) => setFilters((f) => ({ ...f, taluk: v, village: ALL }))}
            options={talukOptions}
            disabled={talukOptions.length <= 1}
          />

          <SelectField
            label="Revenue Village"
            value={filters.village}
            onChange={(v) => setFilters((f) => ({ ...f, village: v }))}
            options={villageOptions}
            disabled={villageOptions.length <= 1}
          />

          <SelectField
            label="Land Type / Classification"
            value={filters.classification}
            onChange={(v) => setFilters((f) => ({ ...f, classification: v }))}
            options={[
              { value: ALL, label: "All classifications" },
              { value: "RURAL", label: "Rural" },
              { value: "URBAN", label: "Urban" },
            ]}
          />

          <SelectField
            label="Acquisition Status"
            value={filters.status}
            onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            options={[
              { value: ALL, label: "All statuses" },
              ...(Object.entries(PARCEL_STATUS_LABEL) as [string, string][]).map(([v, label]) => ({
                value: v,
                label,
              })),
            ]}
          />

          {(talukOptions.length <= 1 || villageOptions.length <= 1) && (
            <p className="text-[10px] leading-snug text-muted-foreground">
              Taluk/revenue-village cascades populate from CD-block boundaries and, for West Bengal,
              from the Banglarbhumi cadastral fabric once a fabric district is selected above.
            </p>
          )}

          <div className="border-t border-border pt-3">
            <div className="label-xs">Layers</div>
            <div className="mt-2 space-y-2">
              <LayerRow
                label="ULPIN-linked parcels"
                checked={showCadastral}
                onChange={setShowCadastral}
              />
              <LayerRow
                label={`Survey labels (zoom ≥ ${PARCEL_LABEL_ZOOM})`}
                checked={showLabels}
                onChange={setShowLabels}
              />
              <LayerRow
                label="State boundary"
                checked={showStateBoundary}
                onChange={setShowStateBoundary}
              />
              <LayerRow
                label="District boundaries"
                checked={showDistricts}
                onChange={setShowDistricts}
              />
              <LayerRow
                label={
                  blocksVisible || !showBlocks ? "Block boundaries" : "Block boundaries — zoom in"
                }
                checked={showBlocks}
                onChange={setShowBlocks}
              />
              <LayerRow
                label="Bhuvan admin boundaries"
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

          {stateCode === "WB" && (
            <div className="border-t border-border pt-3">
              <div className="label-xs">WB cadastral fabric</div>
              <div className="mt-2">
                <LayerRow
                  label="Show Banglarbhumi fabric"
                  checked={showWbParcels}
                  onChange={setShowWbParcels}
                />
              </div>
              {showWbParcels && !wbParcelDistrictSlug && (
                <p className="mt-1.5 text-[10.5px] leading-snug text-muted-foreground">
                  Select a district marked “cadastral fabric” above to load its plot fabric.
                </p>
              )}
              {filteredWbParcelData?.disclaimer && (
                <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
                  {filteredWbParcelData.disclaimer}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setFitAllSignal((n) => n + 1)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[4px] border border-border bg-card px-2 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              Fit all parcels
            </button>
            <button
              type="button"
              onClick={fitToState}
              disabled={!districtsData && !stateBoundaryData}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[4px] border border-border bg-card px-2 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Zoom to state
            </button>
          </div>
        </div>
      </aside>

      {!filtersOpen && (
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="panel absolute left-3 top-3 z-[1000] inline-flex items-center gap-1.5 px-2.5 py-2 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted"
        >
          <PanelLeftOpen className="size-4" />
          Cadastral Filters
        </button>
      )}

      {/* Top-right map tools */}
      <div
        className={cn(
          "absolute top-3 z-[1000] flex w-[176px] flex-col gap-1.5 transition-all",
          selected ? "right-[372px]" : "right-3",
        )}
      >
        {BASEMAPS.map((b) => (
          <button
            key={b.value}
            type="button"
            onClick={() => setBasemap(b.value)}
            aria-pressed={basemap === b.value}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-[5px] border px-2.5 text-[11.5px] font-medium shadow-sm backdrop-blur transition-colors",
              basemap === b.value
                ? "border-navy bg-navy/95 text-navy-foreground"
                : "border-border bg-card/95 text-foreground hover:bg-muted",
            )}
          >
            {b.value === "satellite" ? (
              <Satellite className="size-3.5 shrink-0" />
            ) : (
              <MapIcon className="size-3.5 shrink-0" />
            )}
            {b.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowLabels((v) => !v)}
          aria-pressed={showLabels}
          className="flex h-8 items-center gap-1.5 rounded-[5px] border border-border bg-card/95 px-2.5 text-[11.5px] font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted"
        >
          <span
            className={cn(
              "grid size-3.5 shrink-0 place-items-center rounded-[3px] border",
              showLabels ? "border-forest bg-forest text-forest-foreground" : "border-border",
            )}
          >
            {showLabels && <Check className="size-2.5" />}
          </span>
          Survey No. Labels
        </button>
      </div>

      {/* Result count */}
      <div className="pointer-events-none absolute left-1/2 top-3 z-[1000] hidden -translate-x-1/2 rounded-full border border-border bg-card/90 px-3 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur lg:block">
        <span className="num">{seedParcelCount}</span> ULPIN parcels
        {wbParcelsEnabled && (
          <>
            {" · "}
            <span className="num">{wbParcelCount}</span> fabric plots
          </>
        )}
      </div>

      <MapLegend filtersOpen={filtersOpen} showWbParcels={wbParcelsEnabled} />

      {selected && (
        <CadastralInspector
          selection={selected}
          stateCode={stateCode}
          onClose={() => setSelected(null)}
          onJumpToDistrict={jumpToDistrict}
          geojson={geojson}
          blocksData={blocksData}
        />
      )}
    </div>
  );
}

function MapLegend({
  filtersOpen,
  showWbParcels,
}: {
  filtersOpen: boolean;
  showWbParcels: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute bottom-3 z-[1000] w-[262px] rounded-[6px] border border-border bg-card/95 p-3 shadow-lg backdrop-blur",
        filtersOpen ? "left-[304px] max-md:left-3" : "left-3",
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-navy">
        Cadastral Survey &amp; Parcel Legend
      </div>
      <div className="mt-2 space-y-1.5">
        <LegendRow color={CADASTRAL_PARCEL_COLOR} label="Land parcel (ULPIN-linked)" />
        <LegendRow color={SELECTED_PARCEL_COLOR} label="Selected parcel (inspector active)" />
        <LegendRow
          color={WB_PARCEL_FABRIC_COLORS.real}
          label="Hissa-linked parcel (verified capture)"
        />
        <LegendRow color={WB_PARCEL_FABRIC_COLORS.synthetic} label="Synthetic demo parcel" />
        <LegendRow color={ADMIN_BOUNDARY_COLORS.state} label="State boundary" dashed />
        <LegendRow color={ADMIN_BOUNDARY_COLORS.district} label="District boundary" />
        <LegendRow color={ADMIN_BOUNDARY_COLORS.block} label="Block / taluk boundary" />
      </div>
      <p className="mt-2 border-t border-border pt-1.5 text-[9.5px] leading-snug text-muted-foreground">
        Survey numbers pin at zoom {PARCEL_LABEL_ZOOM}+; hover any plot for details
        {showWbParcels ? "; fabric records are a demo capture, not an authoritative record" : ""}.
      </p>
    </div>
  );
}

function LegendRow({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-0 w-4 shrink-0 border-t-2"
        style={{ borderColor: color, borderStyle: dashed ? "dashed" : "solid" }}
      />
      <span className="text-[10.5px] text-muted-foreground">{label}</span>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className={cn(disabled && "opacity-60")}>
      <Label className="label-xs">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="mt-1 h-8 w-full rounded-[4px] text-[11.5px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-[320px]">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-[12px]">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
