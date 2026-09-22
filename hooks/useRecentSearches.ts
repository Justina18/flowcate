"use client";

import { useCallback, useEffect, useState } from "react";
import type { GeocodingResult } from "@/types/location";

const STORAGE_KEY = "flocate:recent-searches";
const MAX_RECENT = 5;

export function useRecentSearches() {
  const [recent, setRecent] = useState<GeocodingResult[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {
      // localStorage unavailable or the stored value is malformed — start empty
    }
  }, []);

  const addRecent = useCallback((result: GeocodingResult) => {
    setRecent((prev) => {
      const next = [result, ...prev.filter((r) => r.id !== result.id)].slice(
        0,
        MAX_RECENT
      );
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable — list still works for the current session
      }
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { recent, addRecent, clearRecent };
}
