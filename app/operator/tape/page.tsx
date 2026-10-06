import Link from "next/link";
import { getDataset } from "@/lib/data/repository";
import { DISCIPLINES } from "@/lib/domain";
import { buildTape } from "@/lib/view/operator";
import { one, readViewQuery } from "@/lib/view/query";

const TYPES = ["NEW_JOB", "JOB_CLOSED", "JOB_CHANGED", "NEW_CAPABILITY", "ROLE_DIFFUSION", "LOCATION_EXPANSION"];

export default async function TapePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = await readViewQuery(params);
  const filters = {
    org: one(params.org),
    discipline: one(params.discipline),
    location: one(params.location),
    capability: one(params.capability),
    level: one(params.level),
    eventType: one(params.eventType),
    from: one(params.from),
    to: one(params.to),
  };
  const tape = buildTape(await getDataset(), query.asOf, query.days, filters);
  return (
    <div className="space-y-3">
      <header className="flex items-end justify-between">
        <div>
          <p className="kicker">Tape</p>
          <h1 className="font-mono text-xl">Event stream</h1>
        </div>
        <p className="font-mono text-[12px] text-dim">
          {tape.total} events · {tape.start} → {tape.end}
        </p>
      </header>
      <form className="panel grid gap-2 p-2 md:grid-cols-4 xl:grid-cols-8" action="/operator/tape">
        <input type="hidden" name="asOf" value={query.asOf} />
        <input type="hidden" name="range" value={query.range} />
        <Select name="eventType" value={filters.eventType} options={TYPES} label="Event" />
        <Select name="org" value={filters.org} options={tape.orgs} label="Org" />
        <Select name="discipline" value={filters.discipline} options={[...DISCIPLINES]} label="Function" />
        <Select name="location" value={filters.location} options={["Redmond", "New York", "Mountain View", "London", "Zurich"]} label="Location" />
        <input name="capability" defaultValue={filters.capability} placeholder="Capability" className="border border-line bg-bg px-2 py-1" />
        <input name="level" defaultValue={filters.level} placeholder="Level" className="border border-line bg-bg px-2 py-1" />
        <input type="date" name="from" defaultValue={filters.from} className="border border-line bg-bg px-2 py-1 font-mono" />
        <button className="border border-amber/40 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-amber">Filter</button>
      </form>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[760px] font-mono text-[12px]">
          <tbody>
            {tape.events.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-dim">No events match these filters.</td>
              </tr>
            ) : null}
            {tape.events.map((event) => (
              <tr key={event.id} className="border-b border-line/80 hover:bg-white/[0.02]">
                <td className="whitespace-nowrap px-3 py-1.5 text-dim">{event.occurredAt}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-amber">{event.eventType}</td>
                <td className="px-2 py-1.5">
                  {event.jobId ? (
                    <Link href={`/operator/xray/${event.jobId}?asOf=${query.asOf}`} className="text-ink hover:text-steel">
                      {event.title}
                    </Link>
                  ) : (
                    event.title
                  )}
                  <span className="block text-[11px] text-dim">{event.summary}</span>
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 text-dim">{event.discipline}</td>
                <td className="whitespace-nowrap px-3 py-1.5 text-dim">{event.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Select({ name, value, options, label }: { name: string; value: string; options: string[]; label: string }) {
  return (
    <select name={name} defaultValue={value} aria-label={label} className="border border-line bg-bg px-2 py-1">
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
