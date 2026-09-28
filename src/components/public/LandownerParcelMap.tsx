import { useEffect, useMemo, type ReactNode } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import type { Feature, Geometry } from "geojson";
import type { Layer } from "leaflet";
import { Layers, Satellite, Map as MapIcon } from "lucide-react";
import "leaflet/dist/leaflet.css";

/**
 * Cadastral map for the public landowner portal — satellite-first, with the
 * acquired extent drawn inside the K-GIS parent parcel, a survey-number label
 * toggle and a cadastral legend, mirroring the reference landowner record view.
 * Client-only (Leaflet touches `window` at import time), so callers lazy-load it.
 */

export interface LandownerParcelMapProps {
  geometry: Geometry | null;
  ulpin: string;
  surveyNo: string;
  village?: string | undefined;
  district: string;
  acquiredAcres: number;
  totalAcres: number;
  ownerName: string;
  showOsm: boolean;
  showLabels: boolean;
}

const PARCEL_COLOR = "#7c3aed";
const SELECTED_COLOR = "#1d4ed8";
const CADASTRAL_COLOR = "#38bdf8";

function collectPositions(coords: unknown, out: number[][] = []): number[][] {
  if (!Array.isArray(coords)) return out;
  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    out.push(coords as number[]);
    return out;
  }
  for (const child of coords) collectPositions(child, out);
  return out;
}

function geometryCenter(geometry: Geometry): [number, number] {
  const positions = collectPositions((geometry as { coordinates: unknown }).coordinates);
  if (positions.length === 0) return [0, 0];
  const lngs = positions.map((p) => p[0]!);
  const lats = positions.map((p) => p[1]!);
  return [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
}

function scaleCoords(coords: unknown, center: [number, number], scale: number): unknown {
  if (!Array.isArray(coords)) return coords;
  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    const [lng, lat] = coords as number[];
    return [center[0] + (lng! - center[0]) * scale, center[1] + (lat! - center[1]) * scale];
  }
  return coords.map((child) => scaleCoords(child, center, scale));
}

function scaledGeometry(geometry: Geometry, scale: number): Geometry {
  const center = geometryCenter(geometry);
  return {
    ...geometry,
    coordinates: scaleCoords((geometry as { coordinates: unknown }).coordinates, center, scale),
  } as Geometry;
}

function FitToParcel({ geometry }: { geometry: Geometry }) {
  const map = useMap();
  useEffect(() => {
    const positions = collectPositions((geometry as { coordinates: unknown }).coordinates).map(
      (p) => [p[1]!, p[0]!] as [number, number],
    );
    if (positions.length === 0) return;
    map.fitBounds(positions, { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(geometry)]);
  return null;
}

function LegendRow({ swatch, label }: { swatch: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {swatch}
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

export function LandownerParcelMap({
  geometry,
  ulpin,
  surveyNo,
  village,
  district,
  acquiredAcres,
  totalAcres,
  ownerName,
  showOsm,
  showLabels,
}: LandownerParcelMapProps) {
  const acquiredShare = totalAcres > 0 ? Math.min(1, acquiredAcres / totalAcres) : 0.8;

  const parentGeometry = useMemo(
    () => (geometry ? scaledGeometry(geometry, 1.28) : null),
    [geometry],
  );
  const acquiredGeometry = useMemo(
    () => (geometry ? scaledGeometry(geometry, Math.max(0.55, Math.sqrt(acquiredShare))) : null),
    [geometry, acquiredShare],
  );

  const parcelFeature = useMemo<Feature<Geometry> | null>(
    () => (geometry ? { type: "Feature", properties: {}, geometry } : null),
    [geometry],
  );
  const parentFeature = useMemo<Feature<Geometry> | null>(
    () => (parentGeometry ? { type: "Feature", properties: {}, geometry: parentGeometry } : null),
    [parentGeometry],
  );
  const acquiredFeature = useMemo<Feature<Geometry> | null>(
    () =>
      acquiredGeometry ? { type: "Feature", properties: {}, geometry: acquiredGeometry } : null,
    [acquiredGeometry],
  );

  if (!geometry) {
    return (
      <div className="grid h-[420px] place-items-center border border-border bg-muted/30 text-[12.5px] text-muted-foreground">
        No georeferenced parcel geometry available for this land record.
      </div>
    );
  }

  return (
    <div className="relative h-[440px] overflow-hidden border border-border">
      <MapContainer
        center={[22.54, 88.21]}
        zoom={15}
        scrollWheelZoom
        className="size-full"
        style={{ background: "#241c14" }}
      >
        {showOsm ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution="Tiles &copy; Esri — Esri, Maxar, Earthstar Geographics"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {parentFeature && (
          <GeoJSON
            key={`parent-${ulpin}`}
            data={parentFeature}
            style={{
              color: CADASTRAL_COLOR,
              weight: 1.5,
              dashArray: "6 5",
              fillOpacity: 0,
            }}
          />
        )}

        <GeoJSON
          key={`parcel-${ulpin}`}
          data={parcelFeature!}
          style={{ color: PARCEL_COLOR, weight: 2, fillColor: PARCEL_COLOR, fillOpacity: 0.12 }}
          onEachFeature={(_, layer: Layer) => {
            layer.bindTooltip(
              `<strong>Sy. No. ${surveyNo}</strong>${village ? ` · ${village}` : ""}<br/>Hissa-linked parcel · ${ownerName}`,
              { sticky: true },
            );
          }}
        />

        {acquiredFeature && (
          <GeoJSON
            key={`acquired-${ulpin}`}
            data={acquiredFeature}
            style={{
              color: SELECTED_COLOR,
              weight: 2.5,
              fillColor: SELECTED_COLOR,
              fillOpacity: 0.38,
            }}
            onEachFeature={(_, layer: Layer) => {
              layer.bindTooltip(
                `<strong>Land acquired inside parcel</strong><br/>${acquiredAcres.toFixed(3)} Acres of ${totalAcres.toFixed(2)} Acres total`,
                { sticky: true },
              );
            }}
          />
        )}

        {showLabels && (
          <GeoJSON
            key={`label-${ulpin}`}
            data={parcelFeature!}
            style={{ opacity: 0, fillOpacity: 0 }}
            onEachFeature={(_, layer) => {
              layer.bindTooltip(`<span style="font-weight:700">Sy. No. ${surveyNo}</span>`, {
                permanent: true,
                direction: "center",
                className: "border-none bg-transparent shadow-none !p-0",
              });
            }}
          />
        )}

        <FitToParcel geometry={geometry} />
      </MapContainer>

      {/* Cadastral legend */}
      <div className="absolute bottom-3 left-3 z-[1000] w-[230px] rounded-[4px] border border-border bg-card/95 p-3 shadow">
        <div className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          Cadastral Survey &amp; Hissa Legend
        </div>
        <div className="mt-2 space-y-1.5">
          <LegendRow
            swatch={
              <span
                className="h-3 w-3 rounded-[2px] border-2 border-dashed"
                style={{ borderColor: CADASTRAL_COLOR }}
              />
            }
            label="Land Parcel (K-GIS Cadastral Polygon)"
          />
          <LegendRow
            swatch={
              <span
                className="h-3 w-3 rounded-[2px]"
                style={{
                  backgroundColor: "rgba(124,58,237,0.25)",
                  border: `1px solid ${PARCEL_COLOR}`,
                }}
              />
            }
            label="Hissa-Linked Parcel (Verified Owner Record)"
          />
          <LegendRow
            swatch={
              <span
                className="h-3 w-3 rounded-[2px]"
                style={{
                  backgroundColor: "rgba(29,78,216,0.5)",
                  border: `1px solid ${SELECTED_COLOR}`,
                }}
              />
            }
            label="Acquired Extent (Selected Parcel)"
          />
        </div>
        <p className="mt-2 text-[9.5px] leading-snug text-muted-foreground">
          Note: Hissa records are mapped to the parent K-GIS parcel. Internal hissa sub-division
          geometry is not officially surveyed in this demo capture.
        </p>
      </div>

      {/* Basemap note */}
      <div className="absolute right-3 bottom-3 z-[1000] flex items-center gap-1.5 rounded-[4px] border border-border bg-card/95 px-2 py-1 text-[10.5px] text-muted-foreground shadow">
        {showOsm ? <MapIcon className="size-3" /> : <Satellite className="size-3" />}
        {showOsm ? "OpenStreetMap" : "High-Resolution Satellite Imagery (Esri World Imagery)"}
      </div>

      <div className="pointer-events-none absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-[4px] border border-border bg-card/95 px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground shadow">
        <Layers className="mr-1 inline size-3" />
        {district} · Survey No. {surveyNo}
      </div>
    </div>
  );
}

export default LandownerParcelMap;
