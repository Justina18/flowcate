# Flocate

Search and select a location.

## 1. Overview

Flocate is a small, accessible location-search app. Type a city or place
name, get live suggestions from a public geocoding API, navigate them with
the keyboard, and select one to see its coordinates.

## 2. Setup

```
npm install
npm run dev
```

Open http://localhost:3000.

No environment variables or backend are required.

## 3. API choice

The app uses the [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api).
It's free, requires no API key, has no rate-limit friction for a demo app,
and returns exactly what's needed here: name, country, admin region,
coordinates, and timezone, in a small predictable JSON shape.

## 4. Debouncing

Every keystroke updates `query` immediately, so the input never feels
laggy. A `useDebounce` hook mirrors that value into `debouncedQuery` after
a 300ms pause. Only changes to `debouncedQuery` trigger a network request,
so typing "Lagos" fires one request instead of five. 300ms is short enough
to feel responsive but long enough to skip a request per keystroke during
normal typing speed.

## 5. Stale responses

Debouncing cuts down request volume, but it doesn't guarantee requests
resolve in the order they were sent. Before starting a new request, the
component aborts whatever request is still in flight via
`AbortController`. An aborted request rejects with an `AbortError`, which
is caught and ignored rather than surfaced as an error. Because only one
request is ever allowed to be "live" at a time, only its result can ever
update the UI — an older request can't win a race against a newer one
since it's cancelled the moment the newer one starts.

## 6. Accessibility

The input is a `combobox` (`role="combobox"`, `aria-expanded`,
`aria-autocomplete="list"`, `aria-controls` pointing at the listbox) paired
with a `listbox`/`option` results list. The active option is tracked in
state and exposed via `aria-activedescendant`, so a screen reader
announces the highlighted result without moving DOM focus off the input.

Keyboard support:
- `Arrow Down` / `Arrow Up` — move the active option, wrapping at each end
- `Enter` — select the active option
- `Escape` — close the suggestion list
- Clicking outside the component closes the list

The active option also has a visible highlight and scrolls into view as
you navigate, so keyboard and pointer users see consistent state.

## 7. Engineering decisions

- State is kept flat in one component (`LocationSearch`) rather than split
  into a reducer or context — the state machine is small enough (idle /
  loading / success / empty / error, plus the active index and selection)
  that a reducer would add ceremony without adding clarity.
- Fetch logic and label formatting live in `lib/geocoding.ts`, separate
  from the component, so they're easy to test or swap out independently.
- No data-fetching library (React Query, SWR, etc.) — the app makes one
  kind of request with one cancellation strategy, which doesn't justify
  the dependency.
- Selecting a result fills the input with the location's name rather than
  clearing it, so the field reflects what's currently selected.
- Recent searches persist to `localStorage` (last 5, deduped by id) via a
  small `useRecentSearches` hook, and are shown when the input is empty
  and focused — keyboard navigation and selection reuse the same
  `ResultRow` component and the same active-index logic as live results.
- The selected-location card has a copy-to-clipboard button for the
  coordinates, with a 1.5s "Copied" confirmation state.

## 8. Future improvements

- Cache recent queries client-side to avoid re-fetching repeated searches.
- Add a small test suite around the debounce/abort/keyboard behavior
  (the component was structured with this in mind — see the list of
  scenarios worth covering, from stale responses to rapid re-search).
- Highlight the matching substring within each result.
- Add a "use my location" option using the browser geolocation API.
- Virtualize the result list if the API ever returned very large result
  sets.
