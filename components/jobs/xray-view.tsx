import Link from "next/link";
import type { buildXray } from "@/lib/view/operator";

type Model = NonNullable<ReturnType<typeof buildXray>>;

export function XrayView({
  model,
  fit,
}: {
  model: Model;
  fit?: {
    now: number;
    sixMonth: number;
    twelveMonth: number;
    learningValue: number;
    optionValue: number;
    note: string;
  };
}) {
  const { job } = model;
  return (
    <article className="space-y-3">
      <header>
        <p className="kicker">{job.isDemo ? "Synthetic posting" : "Public posting"} · level {job.level}</p>
        <h1 className="font-mono text-xl">{job.title}</h1>
        <p className="mt-1 text-dim">
          {job.org} / {job.team} · {job.discipline} · {job.locations.join(", ")}
        </p>
      </header>
      <dl className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
        <Fact label="First seen" value={model.firstSeen} />
        <Fact label="Last seen" value={model.lastSeen} />
        <Fact label="Status" value={job.status} />
        <Fact label="Snapshots" value={String(model.snapshots)} />
      </dl>
      {job.sourceUrl ? (
        <p className="text-[12px]">
          <a href={job.sourceUrl} className="text-steel">
            Public posting
          </a>
        </p>
      ) : (
        <p className="text-[12px] text-dim">Demo record. No external posting link.</p>
      )}
      <section className="panel px-3 py-3">
        <h2 className="kicker">Capability fingerprint</h2>
        <ul className="mt-3 space-y-2">
          {model.fingerprint.map((item) => (
            <li key={item.slug} className="grid grid-cols-[180px_1fr_48px] items-center gap-2 text-[12px]">
              <span>{item.name}</span>
              <span className="h-2 bg-line">
                <span className="block h-2 bg-amber" style={{ width: `${Math.round(item.weight * 100)}%` }} />
              </span>
              <span className="num font-mono text-dim">{Math.round(item.weight * 100)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="panel px-3 py-3">
        <h2 className="kicker">Organizational signal</h2>
        <p className="mt-2 max-w-3xl text-[13px] leading-6">{model.signal}</p>
        <p className="mt-2 font-mono text-[11px] text-dim">
          Archetype skew · level {model.skew.level} · {model.skew.discipline} · {model.skew.location}
        </p>
      </section>
      <div className="grid gap-3 lg:grid-cols-3">
        <Requirement title="Required" rows={model.required} />
        <Requirement title="Preferred" rows={model.preferred} />
        <Requirement title="Inferred" rows={model.inferred} />
      </div>
      {fit ? (
        <section className="border border-amber/40 bg-amber/5 px-3 py-3">
          <h2 className="kicker text-amber">Private fit · not shown in Operator</h2>
          <dl className="mt-2 grid grid-cols-2 gap-2 font-mono md:grid-cols-5">
            <Fact label="Now" value={String(fit.now)} />
            <Fact label="6m" value={String(fit.sixMonth)} />
            <Fact label="12m" value={String(fit.twelveMonth)} />
            <Fact label="Learning" value={String(fit.learningValue)} />
            <Fact label="Option" value={String(fit.optionValue)} />
          </dl>
          <p className="mt-2 text-[12px] leading-5 text-dim">{fit.note}</p>
        </section>
      ) : null}
      <section className="panel px-3 py-3">
        <h2 className="kicker">Source text</h2>
        <pre className="mt-2 whitespace-pre-wrap font-mono text-[12px] leading-5 text-ink/90">{model.text}</pre>
      </section>
      <p>
        <Link href="/operator/tape" className="text-[12px] text-steel">
          Back to tape
        </Link>
      </p>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-panel px-3 py-2">
      <dt className="kicker">{label}</dt>
      <dd className="mt-1 font-mono">{value}</dd>
    </div>
  );
}

function Requirement({
  title,
  rows,
}: {
  title: string;
  rows: { capabilityId: string; evidenceQuote: string; confidence: number }[];
}) {
  return (
    <section className="panel px-3 py-3">
      <h2 className="kicker">{title}</h2>
      {rows.length === 0 ? <p className="mt-2 text-[12px] text-dim">None extracted.</p> : null}
      <ul className="mt-2 space-y-2">
        {rows.map((row) => (
          <li key={row.capabilityId} className="text-[12px] leading-5">
            <span className="font-mono text-amber">{row.capabilityId}</span>
            <span className="text-dim"> · {Math.round(row.confidence * 100)}</span>
            <p className="text-ink/85">{row.evidenceQuote}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
