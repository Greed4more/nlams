import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Parcel } from "@/data/mockData";
import { formatINRFull } from "@/data/mockData";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ParcelStatus = "ACQUIRED" | "UNDER_AWARD" | "DISPUTED" | "NOTIFIED";

export const PARCEL_STATUS_COLOR: Record<ParcelStatus, string> = {
  ACQUIRED: "var(--status-ok)",
  UNDER_AWARD: "var(--status-info)",
  DISPUTED: "var(--status-critical)",
  NOTIFIED: "var(--status-warn)",
};

const STATUS_LABEL: Record<ParcelStatus, string> = {
  ACQUIRED: "Acquired",
  UNDER_AWARD: "Under Award",
  DISPUTED: "Disputed",
  NOTIFIED: "Notified",
};

/** Hand-drawn cadastral geometry (viewBox 0 0 1000 620). */
const POLYGONS: { points: string; label?: boolean }[] = [
  { points: "90,120 260,96 300,220 130,250", label: true },
  { points: "300,220 470,190 520,320 340,350", label: true },
  { points: "260,96 430,74 470,190 300,220" },
  { points: "520,320 700,286 750,410 560,440", label: true },
  { points: "430,74 620,58 660,170 470,190" },
  { points: "130,250 340,350 300,470 120,420", label: true },
  { points: "660,170 840,150 880,270 700,286" },
  { points: "340,350 560,440 520,540 300,470" },
  { points: "750,410 900,390 930,500 780,520", label: true },
];

const BASEMAPS = [
  { value: "bhuvan", label: "ISRO Bhuvan" },
  { value: "cadastral", label: "Cadastral Grey" },
  { value: "terrain", label: "Terrain" },
];

const LAYERS = [
  { key: "cadastral", label: "Cadastral Polygons" },
  { key: "ulpin", label: "ULPIN Parcel Highlights" },
  { key: "satellite", label: "ISRO Bhuvan Satellite Base" },
  { key: "corridor", label: "Proposed Alignment Corridor" },
  { key: "village", label: "Village Boundaries" },
] as const;

export interface SpatialMapContainerProps {
  parcels: Parcel[];
  onParcelClick?: (parcel: Parcel) => void;
  highlightedUlpin?: string | undefined;
}

const statusFor = (ulpin: string): ParcelStatus => {
  const codes: ParcelStatus[] = ["ACQUIRED", "UNDER_AWARD", "DISPUTED", "NOTIFIED"];
  const sum = [...ulpin].reduce((s, c) => s + c.charCodeAt(0), 0);
  return codes[sum % codes.length]!;
};

export function SpatialMapContainer({
  parcels,
  onParcelClick,
  highlightedUlpin,
}: SpatialMapContainerProps) {
  const [layers, setLayers] = useState<Record<string, boolean>>({
    cadastral: true,
    ulpin: true,
    satellite: false,
    corridor: true,
    village: true,
  });
  const [basemap, setBasemap] = useState("cadastral");
  const [opacity, setOpacity] = useState(70);
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [cursor, setCursor] = useState({ lat: 15.4021, lng: 73.9812 });

  const shown = parcels.slice(0, POLYGONS.length);

  useEffect(() => {
    if (!highlightedUlpin) return;
    const match = shown.find((p) => p.ulpin === highlightedUlpin);
    if (match) setSelected(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedUlpin]);

  const select = (p: Parcel) => {
    setSelected(p);
    onParcelClick?.(p);
  };

  return (
    <div className="panel relative h-[calc(100vh-190px)] min-h-[520px] overflow-hidden">
      {/* Base */}
      <div
        className={cn(
          "absolute inset-0",
          basemap === "terrain"
            ? "bg-[#e9e4d8]"
            : basemap === "bhuvan"
              ? "bg-[#2b3327]"
              : "bg-[#eef1f4]",
        )}
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(15,41,66,0.05) 0 1px, transparent 1px 42px), repeating-linear-gradient(90deg, rgba(15,41,66,0.05) 0 1px, transparent 1px 42px), radial-gradient(circle at 30% 40%, rgba(15,41,66,0.07), transparent 55%), radial-gradient(circle at 70% 70%, rgba(15,123,79,0.08), transparent 50%)",
        }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setCursor({
            lat: 15.2 + ((r.bottom - e.clientY) / r.height) * 0.4,
            lng: 73.8 + ((e.clientX - r.left) / r.width) * 0.45,
          });
        }}
      >
        <svg viewBox="0 0 1000 620" className="size-full" preserveAspectRatio="none">
          {layers["village"] && (
            <path
              d="M40,60 C260,20 620,10 960,70 L950,560 C620,600 300,600 60,540 Z"
              fill="none"
              stroke="var(--navy)"
              strokeWidth={2}
              strokeDasharray="10 6"
              opacity={0.35}
            />
          )}

          {layers["corridor"] && (
            <path
              d="M60,470 C280,410 430,300 640,250 C790,214 880,190 970,140"
              fill="none"
              stroke="var(--status-warn)"
              strokeWidth={16}
              opacity={0.28}
              strokeLinecap="round"
            />
          )}

          {layers["cadastral"] &&
            shown.map((parcel, i) => {
              const poly = POLYGONS[i]!;
              const status = statusFor(parcel.ulpin);
              const active = selected?.ulpin === parcel.ulpin || highlightedUlpin === parcel.ulpin;
              const pts = poly.points.split(" ").map((s) => s.split(",").map(Number));
              const cx = pts.reduce((s, p) => s + (p[0] ?? 0), 0) / pts.length;
              const cy = pts.reduce((s, p) => s + (p[1] ?? 0), 0) / pts.length;
              return (
                <g key={parcel.ulpin} className="cursor-pointer" onClick={() => select(parcel)}>
                  <polygon
                    points={poly.points}
                    fill={active ? PARCEL_STATUS_COLOR[status] : "var(--status-info)"}
                    fillOpacity={(active ? 0.5 : 0.22) * (opacity / 100)}
                    stroke="var(--navy)"
                    strokeWidth={active ? 3 : 1.5}
                  />
                  {layers["ulpin"] && poly.label && (
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      className="font-mono"
                      fontSize={13}
                      fill="var(--navy)"
                      opacity={0.85}
                    >
                      {parcel.ulpin}
                    </text>
                  )}
                </g>
              );
            })}
        </svg>
      </div>

      {/* Control panel */}
      <div className="panel absolute right-3 top-3 w-[248px] p-3">
        <div className="label-xs">Layers</div>
        <div className="mt-2 space-y-2">
          {LAYERS.map((l) => (
            <div key={l.key} className="flex items-center justify-between gap-2">
              <Label htmlFor={`layer-${l.key}`} className="text-[11.5px] font-normal">
                {l.label}
              </Label>
              <Switch
                id={`layer-${l.key}`}
                checked={!!layers[l.key]}
                onCheckedChange={(v) => setLayers((s) => ({ ...s, [l.key]: v }))}
              />
            </div>
          ))}
        </div>

        <div className="mt-3 border-t border-border pt-3">
          <div className="label-xs">Basemap</div>
          <RadioGroup value={basemap} onValueChange={setBasemap} className="mt-2 gap-1.5">
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

        <div className="mt-3 border-t border-border pt-3">
          <div className="label-xs">Overlay Opacity — {opacity}%</div>
          <Slider
            className="mt-2.5"
            value={[opacity]}
            min={10}
            max={100}
            step={5}
            onValueChange={(v) => setOpacity(v[0] ?? 70)}
          />
        </div>
      </div>

      {/* Scale + coordinates */}
      <div className="absolute bottom-3 left-3 space-y-1.5">
        <div className="panel px-2 py-1.5">
          <div className="flex items-center gap-2">
            <div className="h-[7px] w-[72px] border-x-2 border-b-2 border-navy" />
            <span className="num text-[10.5px] text-muted-foreground">500 m</span>
          </div>
        </div>
        <div className="panel num px-2 py-1 font-mono text-[10.5px] text-muted-foreground">
          {cursor.lat.toFixed(4)}° N, {cursor.lng.toFixed(4)}° E · EPSG:4326
        </div>
      </div>

      {/* Legend */}
      <div className="panel absolute bottom-3 right-3 px-3 py-2">
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
        <aside className="absolute inset-y-0 right-0 w-[320px] border-l border-border bg-card p-4 shadow-lg">
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
            <Row
              label="Classification"
              value={`${selected.vernacularTerm.script} — ${selected.vernacularTerm.standard}`}
            />
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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
      <dt className="shrink-0 text-[11px] text-muted-foreground">{label}</dt>
      <dd className={cn("text-right", mono && "num font-mono text-[12px]")}>{value}</dd>
    </div>
  );
}
