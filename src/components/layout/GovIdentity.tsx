import type { ReactNode } from "react";

/** Stylised 24-spoke Ashoka Chakra used as the national identity mark. */
export function AshokaChakra({ className }: { className?: string }) {
  const spokes = Array.from({ length: 24 }, (_, i) => (i * 360) / 24);
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Ashoka Chakra"
      fill="none"
    >
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="5" />
      <circle cx="50" cy="50" r="8" fill="currentColor" />
      {spokes.map((deg) => (
        <line
          key={deg}
          x1="50"
          y1="50"
          x2="50"
          y2="6.5"
          stroke="currentColor"
          strokeWidth="2"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}
    </svg>
  );
}

/** Bilingual national identity lockup — emblem, Hindi + English ministry names. */
export function GovIdentityLockup({
  variant = "dark",
  className,
  trailing,
}: {
  variant?: "dark" | "light";
  className?: string;
  trailing?: ReactNode;
}) {
  const text = variant === "dark" ? "text-ink-foreground" : "text-ink";
  const subtle = variant === "dark" ? "text-ink-muted" : "text-muted-foreground";
  return (
    <div className={["flex items-center gap-3", className].filter(Boolean).join(" ")}>
      <AshokaChakra className={["size-10 shrink-0", text].join(" ")} />
      <div className="leading-tight">
        <div className={["font-serif text-[14px] font-bold tracking-wide", text].join(" ")}>
          भारत सरकार
        </div>
        <div className={["text-[10.5px] font-medium", text].join(" ")}>
          Government of India · Ministry of Rural Development
        </div>
        <div className={["text-[9.5px]", subtle].join(" ")}>
          भूमि संसाधन विभाग · Department of Land Resources
        </div>
      </div>
      {trailing}
    </div>
  );
}

/**
 * Circular official-seal motif used as a watermark on public-facing screens —
 * concentric rings, ministry lettering and a chakra roundel, rotated like a
 * hand-stamped impression. Purely decorative.
 */
export function OfficialSeal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" fill="none">
      <circle cx="100" cy="100" r="94" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="1" />
      <circle
        cx="100"
        cy="100"
        r="57"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeDasharray="3 4"
      />
      <g
        fontFamily="'Noto Serif', 'Noto Sans Devanagari', Georgia, serif"
        textAnchor="middle"
        fill="currentColor"
      >
        <text x="100" y="63" fontSize="12" fontWeight="600" letterSpacing="2.4">
          GOVERNMENT OF INDIA
        </text>
        <text x="100" y="79" fontSize="7.5" letterSpacing="1.4">
          MINISTRY OF RURAL DEVELOPMENT
        </text>
        <text x="100" y="145" fontSize="13.5" fontWeight="700" letterSpacing="3">
          BHUMITRA
        </text>
        <text x="100" y="160" fontSize="11" letterSpacing="2">
          भूमित्र
        </text>
        <text x="100" y="175" fontSize="7" letterSpacing="2.6">
          RESTRICTED · भारत सरकार
        </text>
      </g>
      <g stroke="currentColor" strokeWidth="1">
        <circle cx="100" cy="108" r="18" />
        {Array.from({ length: 24 }, (_, i) => i * 15).map((deg) => (
          <line key={deg} x1="100" y1="108" x2="100" y2="92" transform={`rotate(${deg} 100 108)`} />
        ))}
        <circle cx="100" cy="108" r="3.2" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
