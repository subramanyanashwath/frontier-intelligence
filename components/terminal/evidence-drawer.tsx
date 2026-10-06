"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import type { EvidenceModel } from "@/lib/domain";

export function EvidenceDrawer({
  evidence,
  onClose,
  jobBase = "/operator/xray",
}: {
  evidence: EvidenceModel | null;
  onClose: () => void;
  jobBase?: string;
}) {
  return (
    <Dialog.Root open={Boolean(evidence)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/55" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-line bg-[#0e1217] shadow-2xl">
          {evidence ? (
            <>
              <header className="border-b border-line px-4 py-3">
                <p className="kicker">Evidence</p>
                <Dialog.Title className="mt-1 font-mono text-lg text-ink">{evidence.title}</Dialog.Title>
                <Dialog.Description className="mt-1 font-mono text-amber">{evidence.value}</Dialog.Description>
                <p className="mt-2 text-[12px] text-dim">
                  Confidence <span className="text-ink">{evidence.confidence.band}</span>
                  <span className="text-dim"> · {evidence.confidence.detail}</span>
                </p>
              </header>
              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                <section>
                  <h3 className="kicker">Heuristic</h3>
                  <p className="mt-2 text-[12px] leading-5 text-ink/90">{evidence.heuristic}</p>
                </section>
                <section>
                  <h3 className="kicker">Inputs</h3>
                  <dl className="mt-2 divide-y divide-line border border-line">
                    {evidence.inputs.map((input) => (
                      <div key={input.label} className="grid grid-cols-[140px_1fr] gap-3 px-2 py-1.5 font-mono text-[12px]">
                        <dt className="text-dim">{input.label}</dt>
                        <dd>{input.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
                <section>
                  <h3 className="kicker">Source postings</h3>
                  <ul className="mt-2 space-y-2">
                    {evidence.jobs.length === 0 ? <li className="text-dim">No contributing postings in this window.</li> : null}
                    {evidence.jobs.map((job) => (
                      <li key={job.id} className="border border-line px-2 py-2">
                        <Link href={`${jobBase}/${job.id}`} className="text-steel hover:text-ink">
                          {job.title}
                        </Link>
                        <p className="mt-1 font-mono text-[11px] text-dim">
                          {job.date} · {job.org} · {job.discipline} · {job.location}
                        </p>
                        <p className="mt-1 text-[12px] leading-5 text-ink/80">{job.excerpt}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
              <footer className="border-t border-line px-4 py-3">
                <Dialog.Close className="kicker hover:text-ink">Close</Dialog.Close>
              </footer>
            </>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
