import {
  Building2,
  Factory,
  Plane,
  Route,
  Ship,
  TrainFront,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Illustrative project-category thumbnail for a proposal — derived from the
 * project name so each proposal reads as a distinct infrastructure project
 * rather than a spreadsheet row. Icon artwork (not photography) so it renders
 * offline and consistently across the demo environment.
 */
const KINDS: { pattern: RegExp; icon: LucideIcon; label: string }[] = [
  { pattern: /metro|rail|hsr|freight|siding/i, icon: TrainFront, label: "Rail & Metro" },
  {
    pattern: /expressway|highway|nh-\d|bypass|ring road|road|corridor|bridge|link/i,
    icon: Route,
    label: "Highway & Road",
  },
  { pattern: /thermal|solar|power|ntpc|hydro|transmission/i, icon: Zap, label: "Power & Energy" },
  { pattern: /airport|runway|aviation|apron/i, icon: Plane, label: "Aviation" },
  {
    pattern: /port|seaport|jetty|harbour|harbor|coastal|marshalling/i,
    icon: Ship,
    label: "Ports & Coastal",
  },
  {
    pattern: /flood|embankment|canal|water|irrigation|pipeline|transmission main/i,
    icon: Waves,
    label: "Water & Flood Control",
  },
  { pattern: /industrial|logistics|park|township|estate|sez/i, icon: Factory, label: "Industrial" },
];

export function projectKind(projectName: string): { icon: LucideIcon; label: string } {
  const hit = KINDS.find((k) => k.pattern.test(projectName));
  return hit ?? { icon: Building2, label: "Infrastructure" };
}

export function ProjectThumbnail({
  projectName,
  className,
}: {
  projectName: string;
  className?: string;
}) {
  const { icon: Icon, label } = projectKind(projectName);
  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-[5px] border border-white/15",
        "bg-gradient-to-br from-[#20486f] via-[#16344f] to-[#0d2340]",
        className,
      )}
      aria-hidden
    >
      <span
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(135deg, transparent 0 46%, rgba(255,255,255,0.18) 46% 54%, transparent 54% 100%)",
          backgroundSize: "14px 14px",
        }}
      />
      <Icon className="relative size-7 text-white/85" strokeWidth={1.4} />
      <span className="absolute bottom-1.5 max-w-full truncate px-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-white/65">
        {label}
      </span>
    </div>
  );
}
