import Link from "next/link";
import { roleAdjacency } from "@/lib/analytics/career";
import { getDataset } from "@/lib/data/repository";
import { readViewQuery } from "@/lib/view/query";

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await readViewQuery(searchParams);
  const rows = roleAdjacency(await getDataset(), query.asOf);
  return (
    <div className="space-y-3">
      <header>
        <p className="kicker">Adjacency</p>
        <h1 className="font-mono text-xl">Capability surfaces next to the mandate</h1>
        <p className="mt-2 max-w-3xl text-[12px] leading-5 text-dim">
          Similarity compares a role family&apos;s capability mix with current mandate importance. Fit horizons assume practice against the mandate. They are not odds of moving into a role.
        </p>
      </header>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-dim">
              {["Archetype", "Postings", "Similarity", "Now", "6m", "12m", "Sample"].map((label) => (
                <th key={label} className="px-2 py-2 font-medium first:px-3">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.archetype} className="border-b border-line/70 font-mono text-[12px]">
                <td className="px-3 py-2">{row.archetype}</td>
                <td className="px-2">{row.jobs}</td>
                <td className="px-2 text-amber">{row.similarity}</td>
                <td className="px-2">{row.fit.now}</td>
                <td className="px-2">{row.fit.sixMonth}</td>
                <td className="px-2">{row.fit.twelveMonth}</td>
                <td className="px-2 text-dim">{row.sampleTitle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href="/private/surface" className="text-[12px] text-steel">
        Open the private surface
      </Link>
    </div>
  );
}
