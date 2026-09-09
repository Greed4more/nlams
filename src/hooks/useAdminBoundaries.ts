import { useQuery } from "@tanstack/react-query";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

export interface StateFeatureProperties {
  state: string;
  stateCode: string;
}

export interface DistrictFeatureProperties {
  distName: string;
  state: string;
}

export interface BlockFeatureProperties {
  blockName: string;
  /** Matches a district feature's `distName` exactly. */
  districtName: string;
  state: string;
}

export type StateFeature = Feature<Polygon | MultiPolygon, StateFeatureProperties>;
export type DistrictFeature = Feature<Polygon | MultiPolygon, DistrictFeatureProperties>;
export type BlockFeature = Feature<Polygon | MultiPolygon, BlockFeatureProperties>;

/**
 * Static assets under public/geo — served as-is by Vite, fetched directly
 * (not through the API server) and cached indefinitely by react-query since
 * the boundary data never changes at runtime. One file per state/UT code
 * (from src/data/mockData.ts's STATE_CODE) for each of state outline,
 * district, and block (CD block / sub-district) boundaries — sourced from
 * geoBoundaries.org / lgdirectory.gov.in (ODbL), same source as the original
 * West Bengal pilot files.
 */
async function fetchGeoJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export function useStateBoundary(stateCode: string) {
  return useQuery({
    queryKey: ["geo", "state", stateCode],
    queryFn: () =>
      fetchGeoJson<FeatureCollection<Polygon | MultiPolygon, StateFeatureProperties>>(
        `/geo/states/${stateCode}.geojson`,
      ),
    staleTime: Infinity,
  });
}

export function useDistricts(stateCode: string) {
  return useQuery({
    queryKey: ["geo", "districts", stateCode],
    queryFn: () =>
      fetchGeoJson<FeatureCollection<Polygon | MultiPolygon, DistrictFeatureProperties>>(
        `/geo/districts/${stateCode}.geojson`,
      ),
    staleTime: Infinity,
  });
}

export function useBlocks(stateCode: string) {
  return useQuery({
    queryKey: ["geo", "blocks", stateCode],
    queryFn: () =>
      fetchGeoJson<FeatureCollection<Polygon | MultiPolygon, BlockFeatureProperties>>(
        `/geo/blocks/${stateCode}.geojson`,
      ),
    staleTime: Infinity,
  });
}
