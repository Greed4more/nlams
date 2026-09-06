import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export interface ParcelFeatureProperties {
  ulpin: string;
  khasraNo: string;
  ownerName: string;
  coOwners: number;
  classification: "RURAL" | "URBAN";
  areaHa: number;
  compensationAssessed: number;
  compensationDisbursed: number;
  proposalId: string;
  projectName: string;
}

export interface ParcelFeatureCollection {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    geometry: { type: "Polygon"; coordinates: number[][][] };
    properties: ParcelFeatureProperties;
  }[];
}

export function useParcelsGeoJson() {
  const { session, loading } = useAuth();
  return useQuery({
    queryKey: ["parcels", "geojson"],
    queryFn: () => api.get<ParcelFeatureCollection>("/api/parcels/geojson"),
    enabled: !loading && !!session,
  });
}
