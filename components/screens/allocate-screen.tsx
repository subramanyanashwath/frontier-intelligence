"use client";

import { useState } from "react";
import Link from "next/link";
import { EvidenceDrawer } from "@/components/terminal/evidence-drawer";
import type { AllocationLine } from "@/lib/analytics/allocation";
import type { EvidenceModel } from "@/lib/domain";

export function AllocateScreen({ lines, evidence }: { lines: AllocationLine[]; evidence: EvidenceModel[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const active = evidence.find((item) => item.id === open) ?? null;
  return (
    <div className="space-y-3">
      <header>
        <p className="kicker">Next 10 hours</p>
        <h1 className="font-mono text-xl">Learning allocation</h1>
        <p className="mt-2 max-w-3xl text-[12px] leading-5 text-dim">
          A portfolio for the current mandate. Percents are normalized heuristic weights, not a measured optimum.
        </p>
      </header>
      <section className="panel p-3">
        <div className="flex h-8 w-full overflow-hidden border border-line">
          {lines.map((line) => (
            <button
              key={line.capabilityId}
              title={`${line.name} ${line.allocationPct}%`}
              style={{ width: `${line.allocationPct}%` }}
              className="h-full border-r border-black/40 bg-amber/80 text-[10px] text-bg last:border-r-0"
              onClick={() => setOpen(`alloc_${line.capabilityId}`)}
            />
          ))}
        </div>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {lines.map((line) => (
            <li key={line.capabilityId} className="font-mono text-[12px] text-dim">
              <span className="text-amber">{line.allocationPct}%</span> {line.name}
              <span className="text-dim"> · {line.hours}h</span>
            </li>
          ))}
        </ul>
      </section>
      <div className="space-y-2">
        {lines.filter((line) => line.capabilityId !== "other").map((line) => (
          <article key={line.capabilityId} className="panel px-3 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-mono text-base">
                {line.allocationPct}% {line.name}
              </h2>
              <button className="font-mono text-[11px] text-steel" onClick={() => setOpen(`alloc_${line.capabilityId}`)}>
                Evidence · {line.confidence.band}
              </button>
            </div>
            <dl className="mt-2 grid gap-2 text-[12px] leading-5 md:grid-cols-2">
              <div>
                <dt className="kicker">Why now</dt>
                <dd className="mt-1">{line.whyNow}</dd>
              </div>
              <div>
                <dt className="kicker">Mandate</dt>
                <dd className="mt-1">{line.mandateRelevance}</dd>
              </div>
              <div>
                <dt className="kicker">Objective</dt>
                <dd className="mt-1">{line.objective}</dd>
              </div>
              <div>
                <dt className="kicker">Action · gap {line.gap}</dt>
                <dd className="mt-1 text-ink">{line.action}</dd>
              </div>
            </dl>
            <ul className="mt-2 space-y-1">
              {line.evidenceJobs.slice(0, 3).map((job) => (
                <li key={job.id} className="text-[12px]">
                  <Link href={`/operator/xray/${job.id}`} className="text-steel hover:text-ink">
                    {job.title}
                  </Link>
                  <span className="text-dim"> · {job.date} · {job.location}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <EvidenceDrawer evidence={active} onClose={() => setOpen(null)} />
    </div>
  );
}
