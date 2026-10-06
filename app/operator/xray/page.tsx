import Link from "next/link";
import { getDataset } from "@/lib/data/repository";
import { xrayIndex } from "@/lib/view/operator";
import { readViewQuery } from "@/lib/view/query";

export default async function XrayIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await readViewQuery(searchParams);
  const jobs = xrayIndex(await getDataset(), query.asOf);
  return (
    <div className="space-y-3">
      <header>
        <p className="kicker">X-Ray</p>
        <h1 className="font-mono text-xl">Posting index</h1>
        <p className="mt-1 text-[12px] text-dim">Open a posting to read the capability fingerprint and the source text.</p>
      </header>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[680px] text-left">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-[0.14em] text-dim">
              <th className="px-3 py-2 font-medium">Seen</th>
              <th className="px-2 py-2 font-medium">Title</th>
              <th className="px-2 py-2 font-medium">Org</th>
              <th className="px-2 py-2 font-medium">Function</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-line/70">
                <td className="px-3 py-1.5 font-mono text-[12px] text-dim">{job.firstSeenAt}</td>
                <td className="px-2 py-1.5">
                  <Link href={`/operator/xray/${job.id}?asOf=${query.asOf}`} className="hover:text-amber">
                    {job.title}
                  </Link>
                </td>
                <td className="px-2 py-1.5 text-[12px] text-dim">{job.org}</td>
                <td className="px-2 py-1.5 text-[12px] text-dim">{job.discipline}</td>
                <td className="px-3 py-1.5 font-mono text-[12px]">{job.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
