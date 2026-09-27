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

/** National identity lockup — emblem, government and ministry names. */
export function GovIdentityLockup({
  variant = "dark",
  className,
  trailing,
}: {
  variant?: "dark" | "light";
  className?: string;
  trailing?: ReactNode;
}) {
  const text = variant === "dark" ? "text-navy-foreground" : "text-navy";
  const subtle = variant === "dark" ? "text-navy-muted" : "text-muted-foreground";
  return (
    <div className={["flex items-center gap-3", className].filter(Boolean).join(" ")}>
      <AshokaChakra className={["size-9 shrink-0", text].join(" ")} />
      <div className="leading-tight">
        <div className={["text-[13px] font-bold tracking-wide", text].join(" ")}>
          Government of India
        </div>
        <div className={["text-[10.5px]", subtle].join(" ")}>
          Ministry of Rural Development · Department of Land Resources
        </div>
      </div>
      {trailing}
    </div>
  );
}
