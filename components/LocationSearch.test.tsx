import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LocationSearch from "./LocationSearch";
import * as geocoding from "@/lib/geocoding";
import type { GeocodingResult } from "@/types/location";

vi.mock("@/lib/geocoding", async () => {
  const actual = await vi.importActual<typeof import("@/lib/geocoding")>(
    "@/lib/geocoding"
  );
  return { ...actual, searchLocations: vi.fn() };
});

function mockResult(id: number, name: string): GeocodingResult {
  return { id, name, latitude: 0, longitude: 0 };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(geocoding.searchLocations).mockReset();
});
afterEach(() => vi.useRealTimers());

it("ignores an aborted request even if it resolves after the newer one", async () => {
  const calls: { resolve: (v: GeocodingResult[]) => void }[] = [];

  vi.mocked(geocoding.searchLocations).mockImplementation(
    (_query, signal) =>
      new Promise<GeocodingResult[]>((resolve, reject) => {
        calls.push({ resolve });
        signal.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError"))
        );
      })
  );

  render(<LocationSearch />);
  const input = screen.getByRole("combobox");

  fireEvent.change(input, { target: { value: "lag" } });
  await act(async () => vi.advanceTimersByTime(300));

  fireEvent.change(input, { target: { value: "lago" } });
  await act(async () => vi.advanceTimersByTime(300));

  await act(async () => calls[1].resolve([mockResult(2, "Lagos")]));
  calls[0].resolve([mockResult(1, "Lagoa")]);

  expect(await screen.findByText("Lagos")).toBeInTheDocument();
  expect(screen.queryByText("Lagoa")).not.toBeInTheDocument();
});

it("selects the active result on Enter", async () => {
  vi.mocked(geocoding.searchLocations).mockResolvedValue([
    mockResult(1, "Lagos"),
    mockResult(2, "Lagoon City"),
  ]);

  render(<LocationSearch />);
  const input = screen.getByRole("combobox");

  fireEvent.change(input, { target: { value: "lag" } });
  await act(async () => vi.advanceTimersByTime(300));
  await screen.findByText("Lagos");

  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });

  expect(screen.getByText("Selected location")).toBeInTheDocument();
  expect(screen.getByText("Lagoon City")).toBeInTheDocument();
});
