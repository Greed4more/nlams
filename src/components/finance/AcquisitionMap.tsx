import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import type { Feature, Geometry } from "geojson";
import type { Layer } from "leaflet";
import { Map as MapIcon, Satellite } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { ProposalParcelGeometry } from "@/hooks/useFinance";

const RURAL_COLOR = "#15803d";
const URBAN_COLOR = "#1d4ed8";
const SELECTED_COLOR = "#b45309";

function collectPositions(coords: unknown, out: number[][] = []): number[][] {
  if (!Array.isArray(coords)) return out;
  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    out.push(coords as number[]);
    return out;
  }
  for (const child of coords) collectPositions(child, out);
  return out;
}

function FitAll({ geometries, signature }: { geometries: Geometry[]; signature: string }) {
  const map = useMap();
  useEffect(() => {
    const positions = geometries.flatMap((g) =>
      collectPositions((g as { coordinates: unknown }).coordinates).map(
        (p) => [p[1]!, p[0]!] as [number, number],
      ),
    );
    if (positions.length === 0) return;
    map.fitBounds(positions, { padding: [44, 44] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
  return null;
}

export interface AcquisitionMapProps {
  parcels: ProposalParcelGeometry[];
  state: string;
  district: string;
  selectedUlpin?: string | null;
  onSelectUlpin?: (ulpin: string) => void;
}

/**
 * Interactive cadastral overlay for the Finance Officer workspace — one
 * polygon per affected landowner, shaded by classification and highlighted on
 * selection. Client-only (Leaflet touches `window` at import), so callers
 * lazy-load it.
 */
export function AcquisitionMap({
  parcels,
  state,
  district,
  selectedUlpin,
  onSelectUlpin,
}: AcquisitionMapProps) {
  const mapped = useMemo(() => parcels.filter((p) => p.geometry != null), [parcels]);

  if (mapped.length === 0) {
    return (
      <div className="grid h-[420px] place-items-center border border-border bg-muted/30 px-6 text-center text-[12.5px] text-muted-foreground">
        No georeferenced parcel geometry is available for this project yet. Parcel records and
        valuations below remain fully actionable.
      </div>
    );
  }

  const geometries = mapped.map((p) => p.geometry as Geometry);
  const signature = mapped.map((p) => p.ulpin).join(",");

  return (
    <div className="relative h-[440px] overflow-hidden border border-border">
      <MapContainer
        center={[21.15, 79.08]}
        zoom={6}
        scrollWheelZoom
        className="size-full"
        style={{ background: "#241c14" }}
      >
        <TileLayer
          attribution="Tiles &copy; Esri — Esri, Maxar, Earthstar Geographics"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        {mapped.map((parcel) => {
          const selected = selectedUlpin === parcel.ulpin;
          const color = parcel.classification === "URBAN" ? URBAN_COLOR : RURAL_COLOR;
          const feature: Feature<Geometry> = {
            type: "Feature",
            properties: { ulpin: parcel.ulpin },
            geometry: parcel.geometry as Geometry,
          };
          return (
            <GeoJSON
              key={`${parcel.ulpin}-${selected ? "sel" : "base"}`}
              data={feature}
              style={{
                color: selected ? SELECTED_COLOR : color,
                weight: selected ? 3 : 2,
                fillColor: selected ? SELECTED_COLOR : color,
                fillOpacity: selected ? 0.45 : 0.22,
              }}
              onEachFeature={(_, layer: Layer) => {
                layer.bindTooltip(
                  `<strong>Sy. No. ${parcel.surveyNo}</strong> · ${parcel.ulpin}<br/>${parcel.ownerName} · ${parcel.areaHa.toFixed(2)} Ha (${parcel.areaAcres.toFixed(2)} Ac)<br/>${parcel.classification} · ${district}, ${state}`,
                  { sticky: true },
                );
                layer.on("click", () => onSelectUlpin?.(parcel.ulpin));
              }}
            />
          );
        })}

        <FitAll geometries={geometries} signature={signature} />
      </MapContainer>

      <div className="absolute right-3 bottom-3 z-[1000] flex items-center gap-1.5 rounded-[4px] border border-border bg-card/95 px-2 py-1 text-[10.5px] text-muted-foreground shadow">
        <Satellite className="size-3" />
        High-Resolution Satellite Imagery (Esri World Imagery)
      </div>

      <div className="absolute left-3 top-3 z-[1000] rounded-[4px] border border-border bg-card/95 px-2.5 py-1.5 shadow">
        <div className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          Acquisition Extent
        </div>
        <div className="mt-1 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-[2px]"
              style={{ backgroundColor: "rgba(21,128,61,0.4)", border: `1px solid ${RURAL_COLOR}` }}
            />
            <span className="text-[10.5px] text-muted-foreground">Rural parcel</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-[2px]"
              style={{ backgroundColor: "rgba(29,78,216,0.4)", border: `1px solid ${URBAN_COLOR}` }}
            />
            <span className="text-[10.5px] text-muted-foreground">Urban parcel</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-[2px]"
              style={{
                backgroundColor: "rgba(180,83,9,0.5)",
                border: `1px solid ${SELECTED_COLOR}`,
              }}
            />
            <span className="text-[10.5px] text-muted-foreground">Selected for valuation</span>
          </div>
        </div>
        <div className="num mt-1.5 border-t border-border pt-1.5 text-[10.5px] text-muted-foreground">
          <MapIcon className="mr-1 inline size-3" />
          {mapped.length} cadastral parcels · {mapped.reduce((s, p) => s + p.areaHa, 0).toFixed(2)}{" "}
          Ha acquired
        </div>
      </div>
    </div>
  );
}

export default AcquisitionMap;
