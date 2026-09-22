import LocationSearch from "@/components/LocationSearch";
import Mark from "@/components/Mark";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Mark className="h-5 w-5" />
          </div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-ink-faint">
            Location lookup
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Flocate
          </h1>
        </div>

        <LocationSearch />
      </div>
    </main>
  );
}
