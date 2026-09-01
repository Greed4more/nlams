import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SpatialMapContainer } from "@/components/map/SpatialMapContainer";
import { proposals } from "@/data/mockData";

export const Route = createFileRoute("/map-view")({
  validateSearch: (search: Record<string, unknown>): { ulpin?: string } => ({
    ...(typeof search["ulpin"] === "string" ? { ulpin: search["ulpin"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Cadastral GIS Viewer — NLAMS" },
      {
        name: "description",
        content:
          "Spatial view of ULPIN cadastral parcels, proposed alignment corridors and village boundaries for acquisition proposals.",
      },
      { property: "og:title", content: "Cadastral GIS Viewer — NLAMS" },
      {
        property: "og:description",
        content: "ULPIN parcel polygons, layer toggles and parcel status legend for land acquisition.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapViewPage,
});

function MapViewPage() {
  const { ulpin } = Route.useSearch();

  const parcels = (() => {
    const all = proposals.flatMap((p) => p.parcels);
    if (ulpin) {
      const idx = all.findIndex((p) => p.ulpin === ulpin);
      if (idx !== -1) {
        const target = all[idx]!;
        const rest = all.filter((_, i) => i !== idx);
        return [target, ...rest].slice(0, 12);
      }
    }
    return all.slice(0, 12);
  })();

  return (
    <AppShell breadcrumb={["NLAMS", "GIS Map View"]}>
      <PageHeader
        title="Cadastral GIS Viewer"
        subtitle="ULPIN-linked cadastral parcels · ISRO Bhuvan base imagery pending live layer integration."
      />
      <SpatialMapContainer parcels={parcels} highlightedUlpin={ulpin} />
    </AppShell>
  );
}
