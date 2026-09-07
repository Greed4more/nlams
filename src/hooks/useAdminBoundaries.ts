import { useQuery } from "@tanstack/react-query";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

export interface DistrictFeatureProperties {
  distName: string;
}

export interface BlockFeatureProperties {
  blockName: string;
  /** Matches a district feature's `distName` exactly. */
  districtName: string;
}

export type DistrictFeature = Feature<Polygon | MultiPolygon, DistrictFeatureProperties>;
export type BlockFeature = Feature<Polygon | MultiPolygon, BlockFeatureProperties>;

/**
 * Static assets under public/geo — served as-is by Vite, fetched directly
 * (not through the API server) and cached indefinitely by react-query since
 * the boundary data never changes at runtime.
 */
async function fetchGeoJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export function useWestBengalDistricts() {
  return useQuery({
    queryKey: ["geo", "west-bengal-districts"],
    queryFn: () =>
      fetchGeoJson<FeatureCollection<Polygon | MultiPolygon, DistrictFeatureProperties>>(
        "/geo/west-bengal-districts.geojson",
      ),
    staleTime: Infinity,
  });
}

export function useWestBengalBlocks() {
  return useQuery({
    queryKey: ["geo", "west-bengal-blocks"],
    queryFn: () =>
      fetchGeoJson<FeatureCollection<Polygon | MultiPolygon, BlockFeatureProperties>>(
        "/geo/west-bengal-blocks.geojson",
      ),
    staleTime: Infinity,
  });
}
