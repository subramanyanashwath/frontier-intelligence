import { recommendationDistribution } from "@/lib/analytics/career";
import { privateRecommendationEvents } from "@/lib/analytics/events";
import { getDataset } from "@/lib/data/repository";
import { readViewQuery } from "@/lib/view/query";

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await readViewQuery(searchParams);
  const dataset = await getDataset();
  const dist = recommendationDistribution(dataset, query.asOf);
  const events = privateRecommendationEvents(dataset, query.asOf).slice(0, 20);
  return (
    <div className="space-y-3">
      <header>
        <p className="kicker">Recommendations · private</p>
        <h1 className="font-mono text-xl">What was sent, not what to pursue</h1>
        <p className="mt-2 font-mono text-[12px] text-dim">
          180d count {dist.total} · last 30d {dist.recent} vs prior 30d {dist.prior}
        </p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        <section className="panel px-3 py-3">
          <h2 className="kicker">By archetype</h2>
          <ul className="mt-2 space-y-1 font-mono text-[12px]">
            {dist.byArchetype.map(([name, count]) => (
              <li key={name} className="flex justify-between border-b border-line/60 py-1">
                <span>{name}</span>
                <span>{count}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel px-3 py-3">
          <h2 className="kicker">By capability</h2>
          <ul className="mt-2 space-y-1 font-mono text-[12px]">
            {dist.byCapability.map((row) => (
              <li key={row.slug} className="flex justify-between border-b border-line/60 py-1">
                <span>{row.name}</span>
                <span>{row.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="panel">
        <header className="border-b border-line px-3 py-2">
          <h2 className="kicker">Message subjects stay on this route</h2>
        </header>
        <ul className="divide-y divide-line">
          {events.map((event) => (
            <li key={event.id} className="px-3 py-2">
              <p className="font-mono text-[11px] text-dim">{event.occurredAt}</p>
              <p>{event.summary}</p>
              <p className="text-[12px] text-dim">{event.title}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
