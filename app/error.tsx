"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <p className="kicker">Observatory error</p>
      <h1 className="mt-2 font-mono text-xl">The screen could not be built</h1>
      <p className="mt-3 text-[13px] leading-6 text-dim">{error.message}</p>
      <button className="mt-4 border border-line px-3 py-1 text-[11px] uppercase tracking-[0.14em]" onClick={reset}>
        Retry
      </button>
    </main>
  );
}
