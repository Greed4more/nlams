import { cn } from "@/lib/utils";

/**
 * Decorative, offline-safe vector map canvas used behind the officer
 * authentication screen. Deliberately synthetic (deterministic cadastral
 * fabric, roads, water and revenue-village labels) rather than live tiles:
 * the sign-in screen must render instantly on locked-down government
 * networks that block third-party tile servers.
 */
export function VectorMapBackdrop({ className }: { className?: string }) {
  const parcels = buildParcels();

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        role="presentation"
        focusable="false"
        className="map-drift size-full motion-reduce:animate-none"
      >
        <defs>
          <pattern id="bhumitra-auth-map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#DCD5C4" strokeWidth="0.6" />
          </pattern>
        </defs>

        {/* Base terrain wash */}
        <rect width="1440" height="900" fill="#EAE4D4" />
        <rect width="1440" height="900" fill="url(#bhumitra-auth-map-grid)" opacity="0.55" />

        {/* Water bodies */}
        <path
          d="M 1010 -80 C 1090 20 1200 60 1300 10 C 1370 -25 1460 40 1540 -20 L 1540 -80 Z"
          fill="#C2CDBB"
        />
        <path
          d="M -40 940 C 140 860 90 700 260 640 S 420 500 360 360 S 300 200 420 60"
          fill="none"
          stroke="#AEBDA9"
          strokeWidth="26"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path
          d="M -40 940 C 140 860 90 700 260 640 S 420 500 360 360 S 300 200 420 60"
          fill="none"
          stroke="#9FB29A"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Cadastral fabric */}
        <g stroke="#CFC8B6" strokeWidth="1">
          {parcels.map((p) => (
            <rect
              key={p.key}
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              fill={PARCEL_FILL[p.tone]}
              transform={`rotate(${p.rotate.toFixed(2)} ${(p.x + p.w / 2).toFixed(1)} ${(p.y + p.h / 2).toFixed(1)})`}
            />
          ))}
        </g>

        {/* Highway */}
        <path
          d="M -60 430 C 260 400 520 470 820 430 S 1260 360 1520 420"
          fill="none"
          stroke="#DCD5C4"
          strokeWidth="17"
        />
        <path
          d="M -60 430 C 260 400 520 470 820 430 S 1260 360 1520 420"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="12"
        />

        {/* Secondary road */}
        <path
          d="M 620 -40 C 660 220 600 460 660 700 S 720 900 700 960"
          fill="none"
          stroke="#DCD5C4"
          strokeWidth="10.5"
        />
        <path
          d="M 620 -40 C 660 220 600 460 660 700 S 720 900 700 960"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="7"
        />

        {/* Village lanes */}
        <g fill="none" stroke="#FFFFFF" strokeWidth="4" opacity="0.85">
          <path d="M 60 180 C 220 200 360 160 520 200 S 820 260 980 220" />
          <path d="M 260 940 C 300 780 380 700 420 560 S 520 380 560 220" />
          <path d="M 1120 120 C 1180 260 1140 400 1200 540 S 1280 740 1240 940" />
        </g>

        {/* Railway line */}
        <path
          d="M -40 780 C 320 740 760 820 1500 760"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="6"
        />
        <path
          d="M -40 780 C 320 740 760 820 1500 760"
          fill="none"
          stroke="#A39A87"
          strokeWidth="2.4"
          strokeDasharray="14 10"
        />

        {/* Notified acquisition alignment (ochre dashed route) */}
        <path
          d="M 120 560 C 400 520 700 610 1040 520 S 1380 480 1500 520"
          fill="none"
          stroke="#C08A2E"
          strokeWidth="1.6"
          strokeDasharray="7 6"
          opacity="0.85"
        />

        {/* Highlighted parcel + survey marker */}
        <g>
          <rect
            x={880}
            y={300}
            width="112"
            height="94"
            fill="#0F5132"
            fillOpacity="0.1"
            stroke="#0F5132"
            strokeWidth="1.6"
            strokeDasharray="7 5"
          />
          <circle
            cx={936}
            cy={347}
            r={30}
            fill="#0F5132"
            fillOpacity="0.08"
            className="animate-pulse"
          />
          <circle
            cx={936}
            cy={347}
            r={17}
            fill="#FFFFFF"
            fillOpacity="0.92"
            stroke="#0F5132"
            strokeWidth="1.4"
          />
          <circle cx={936} cy={347} r={5.5} fill="#0F5132" />
        </g>

        {/* Labels */}
        <g fontFamily="Inter, 'Noto Sans', sans-serif">
          <g fill="#948A76" fontSize="11.5" letterSpacing="0.18em">
            <text x="150" y="250">
              RAMPUR
            </text>
            <text x="1040" y="250">
              BARGAON
            </text>
            <text x="420" y="520">
              KHERI
            </text>
            <text x="760" y="700">
              SULTANPUR
            </text>
            <text x="220" y="830">
              SEMRA
            </text>
            <text x="1180" y="840">
              NANDGAON
            </text>
          </g>
          <g fill="#A29A88" fontSize="10.5">
            <text x="118" y="452" transform="rotate(-3 118 452)">
              NH-66
            </text>
            <text x="612" y="150" transform="rotate(84 612 150)">
              MDR 12
            </text>
            <text x="96" y="668">
              MINOR CANAL 3
            </text>
            <text x="760" y="300" fill="#78705E">
              KHASRA 214/2
            </text>
            <text x="1150" y="470">
              SURVEY NO. 88/1
            </text>
            <text x="330" y="752">
              DAG 452
            </text>
          </g>
        </g>
      </svg>

      {/* Legibility wash — keeps text on the overlay and card readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/25 via-background/10 to-background/55 lg:bg-gradient-to-r lg:from-background/40 lg:via-background/5 lg:to-background/30" />
    </div>
  );
}

const PARCEL_FILL = ["#EFE9D8", "#E6DFCC", "#F3EDDD", "#EAE3D0"] as const;

interface ParcelRect {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotate: number;
  tone: number;
}

/** Deterministic 32-bit LCG — same fabric on the server and the client. */
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildParcels(): ParcelRect[] {
  const rand = mulberry32(20131118);
  const rects: ParcelRect[] = [];
  let y = -36;
  let row = 0;
  while (y < 960) {
    const h = 62 + rand() * 48;
    let x = -48;
    while (x < 1500) {
      const w = 52 + rand() * 118;
      rects.push({
        key: `${row}-${Math.round(x)}`,
        x,
        y,
        w,
        h,
        rotate: (rand() - 0.5) * 1.8,
        tone: row % PARCEL_FILL.length,
      });
      x += w + 3 + rand() * 3;
    }
    y += h + 4 + rand() * 4;
    row += 1;
  }
  return rects;
}
