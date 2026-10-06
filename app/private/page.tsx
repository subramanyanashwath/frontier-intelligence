import Link from "next/link";
import { careerAlpha } from "@/lib/analytics/career";
import { getDataset } from "@/lib/data/repository";
import { readViewQuery } from "@/lib/view/query";

export default async function PrivateHome({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await readViewQuery(searchParams);
  const rows = careerAlpha(await getDataset(), query.asOf).slice(0, 12);
  return (
    <div className="space-y-3">
      <header>
        <p className="kicker">Career Alpha</p>
        <h1 className="font-mono text-xl">Component scores</h1>
        <p className="mt-2 max-w-3xl text-[12px] leading-5 text-dim">
          Each column is an independent heuristic on a 0–100 scale. The composite is an equal-weight index, labeled as such. Weights are placeholders.
        </p>
      </header>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[880px] text-left font-mono text-[12px]">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-dim">
              {["Capability", "Momentum", "Adjacency", "Strategic", "Attainable", "Persist", "Signal", "Equal-weight"].map((label) => (
                <th key={label} className="px-2 py-2 font-medium first:px-3">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.capabilityId} className="border-b border-line/70">
                <td className="px-3 py-1.5">
                  {row.name}
                  <span className="block text-[10px] text-dim">{row.rationale}</span>
                </td>
                <td className="px-2">{row.marketMomentum}</td>
                <td className="px-2">{row.personalAdjacency}</td>
                <td className="px-2">{row.strategicValue}</td>
                <td className="px-2">{row.attainability}</td>
                <td className="px-2">{row.persistence}</td>
                <td className="px-2">{row.signalConfidence}</td>
                <td className="px-2 text-amber">{row.composite}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-dim">
        <Link href="/private/recommendations" className="text-steel">
          Recommendation distribution
        </Link>
        {" · "}
        <Link href="/private/roles" className="text-steel">
          Role adjacency
        </Link>
        {" · "}
        <Link href="/private/surface" className="text-steel">
          Alpha surface
        </Link>
      </p>
    </div>
  );
}
