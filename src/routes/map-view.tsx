import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

// Leaflet touches `window` at module load time, which crashes SSR — load it
// only after mount, client-side only.
const SpatialMapContainer = lazy(() =>
  import("@/components/map/SpatialMapContainer").then((m) => ({ default: m.SpatialMapContainer })),
);

export const Route = createFileRoute("/map-view")({
  validateSearch: (search: Record<string, unknown>): { ulpin?: string } => ({
    ...(typeof search["ulpin"] === "string" ? { ulpin: search["ulpin"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "GIS & Land Parcels — BHUMITRA" },
      {
        name: "description",
        content:
          "Full-canvas cadastral viewer with cascading revenue filters, ULPIN parcel outlines and a cadastral record & land title inspector.",
      },
      { property: "og:title", content: "GIS & Land Parcels — BHUMITRA" },
      {
        property: "og:description",
        content:
          "ULPIN parcel polygons, cadastral record inspection and acquisition status over satellite imagery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapViewPage,
});

function MapSkeleton() {
  return <div className="shimmer min-h-[480px] w-full flex-1 rounded-none" />;
}

function MapViewPage() {
  const { ulpin } = Route.useSearch();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <AppShell breadcrumb={["BHUMITRA", "GIS & Land Parcels"]} fullBleed>
      <div className="flex min-h-0 flex-1 flex-col">
        {mounted ? (
          <Suspense fallback={<MapSkeleton />}>
            <SpatialMapContainer highlightedUlpin={ulpin} />
          </Suspense>
        ) : (
          <MapSkeleton />
        )}
      </div>
    </AppShell>
  );
}
