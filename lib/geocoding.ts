import type { GeocodingResponse, GeocodingResult } from "@/types/location";

const BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";

export async function searchLocations(
  query: string,
  signal: AbortSignal
): Promise<GeocodingResult[]> {
  const url = `${BASE_URL}?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;
  const res = await fetch(url, { signal });

  if (!res.ok) {
    throw new Error(`Geocoding request failed with status ${res.status}`);
  }

  const data: GeocodingResponse = await res.json();
  return data.results ?? [];
}

export function formatLocationLabel(result: GeocodingResult): {
  primary: string;
  secondary: string;
} {
  const region = [result.admin1, result.country].filter(Boolean).join(", ");
  return {
    primary: result.name,
    secondary: region || result.country_code || "",
  };
}

const FLAG_OFFSET = 127397;

export function countryCodeToFlag(countryCode?: string): string | null {
  if (!countryCode || countryCode.length !== 2) return null;
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => char.charCodeAt(0) + FLAG_OFFSET);
  return String.fromCodePoint(...codePoints);
}
