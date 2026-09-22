export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  country?: string;
  country_id?: number;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
  timezone?: string;
  population?: number;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
  generationtime_ms: number;
}

export type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";
