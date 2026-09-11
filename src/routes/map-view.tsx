import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useI18n } from "@/context/I18nContext";

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
      { title: "Cadastral GIS Viewer — BHUMITRA" },
      {
        name: "description",
        content:
          "Spatial view of ULPIN cadastral parcels over OpenStreetMap, with ISRO Bhuvan administrative boundary overlays.",
      },
      { property: "og:title", content: "Cadastral GIS Viewer — BHUMITRA" },
      {
        property: "og:description",
        content:
          "ULPIN parcel polygons, layer toggles and parcel status legend for land acquisition.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapViewPage,
});

function MapSkeleton() {
  return <div className="shimmer h-[calc(100vh-190px)] min-h-[520px] w-full rounded-[6px]" />;
}

function MapViewPage() {
  const { ulpin } = Route.useSearch();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <AppShell breadcrumb={["BHUMITRA", "GIS Map View"]}>
      <PageHeader
        title={t("page.map.title")}
        subtitle="ULPIN-linked cadastral parcels on OpenStreetMap · ISRO Bhuvan boundary overlay available"
      />
      {mounted ? (
        <Suspense fallback={<MapSkeleton />}>
          <SpatialMapContainer highlightedUlpin={ulpin} />
        </Suspense>
      ) : (
        <MapSkeleton />
      )}
    </AppShell>
  );
}
