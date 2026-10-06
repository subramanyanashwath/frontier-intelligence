"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ShellMeta } from "@/lib/view/operator";
import { DATA_AS_OF, RANGE_DAYS, addDays, type RangeKey } from "@/lib/dates";

const OPERATOR_LINKS = [
  ["/operator", "Pulse"],
  ["/operator/tape", "Tape"],
  ["/operator/surface", "Surface"],
  ["/operator/xray", "X-Ray"],
  ["/operator/mandate", "Mandate"],
  ["/operator/allocate", "Allocate"],
] as const;

const PRIVATE_LINKS = [
  ["/private", "Alpha"],
  ["/private/recommendations", "Recommendations"],
  ["/private/roles", "Adjacency"],
  ["/private/surface", "Surface"],
] as const;

export function ObservatoryShell({
  meta,
  mode,
  children,
}: {
  meta: ShellMeta;
  mode: "operator" | "private";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const asOf = params.get("asOf") || DATA_AS_OF;
  const range = (params.get("range") as RangeKey) || "3M";
  const links = mode === "operator" ? OPERATOR_LINKS : PRIVATE_LINKS;

  function href(path: string, next?: { asOf?: string; range?: string }) {
    const query = new URLSearchParams();
    query.set("asOf", next?.asOf ?? asOf);
    query.set("range", next?.range ?? range);
    return `${path}?${query.toString()}`;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-[#0b0d10]/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 md:px-4">
          <Link href={href(mode === "operator" ? "/operator" : "/private")} className="leading-tight">
            <span className="block font-mono text-[13px] tracking-[0.18em] text-amber">FRONTIER OPERATOR</span>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-dim">
              {mode === "operator" ? "AI Capability Observatory" : "Private · Career Alpha"}
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {links.map(([path, label]) => {
              const active = path === "/operator" || path === "/private" ? pathname === path : pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  href={href(path)}
                  className={`px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] ${active ? "bg-ink text-bg" : "text-dim hover:text-ink"}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex flex-wrap items-center gap-2 font-mono text-[11px] text-dim">
            <span className="border border-amber/40 px-1.5 py-0.5 text-amber">{meta.provenance}</span>
            <span title={meta.sweepDetail}>{meta.sweepLabel}</span>
            <span>CONF {meta.confidence.band}</span>
            <Link href="/calibration" className="text-steel hover:text-ink">
              Calibrate
            </Link>
            {mode === "operator" ? (
              <Link href="/private" className="border border-line px-1.5 py-0.5 hover:text-ink">
                Private route
              </Link>
            ) : (
              <form action="/api/auth/logout" method="post">
                <button className="border border-rose/40 px-1.5 py-0.5 text-rose">Lock</button>
              </form>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line/80 px-3 py-1.5 md:px-4">
          <span className="kicker">As of</span>
          <form action={pathname} className="flex items-center gap-2">
            <input type="hidden" name="range" value={range} />
            <input
              type="date"
              name="asOf"
              defaultValue={asOf}
              min={addDays(DATA_AS_OF, -364)}
              max={DATA_AS_OF}
              className="border border-line bg-panel px-2 py-0.5 font-mono text-[12px] text-ink"
            />
            <button className="text-[11px] uppercase tracking-[0.14em] text-dim hover:text-ink">Set</button>
          </form>
          <div className="flex gap-1">
            {(Object.keys(RANGE_DAYS) as RangeKey[]).map((key) => (
              <Link
                key={key}
                href={href(pathname, { range: key })}
                className={`px-1.5 py-0.5 font-mono text-[11px] ${range === key ? "text-amber" : "text-dim hover:text-ink"}`}
              >
                {key}
              </Link>
            ))}
            <Link href={href(pathname, { asOf: DATA_AS_OF })} className="px-1.5 py-0.5 font-mono text-[11px] text-dim hover:text-ink">
              Today
            </Link>
          </div>
          <span className="ml-auto font-mono text-[11px] text-dim">Data date {meta.dataDate}</span>
        </div>
        {mode === "private" ? (
          <p className="border-t border-amber/30 bg-amber/10 px-3 py-1 font-mono text-[11px] text-amber md:px-4">
            Private Career Alpha. Separate route. Do not screen-share this view.
          </p>
        ) : null}
      </header>
      <main className="px-3 py-3 md:px-4 md:py-4">{children}</main>
    </div>
  );
}
