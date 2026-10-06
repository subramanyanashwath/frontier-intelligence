"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const QUESTIONS = [
  { key: "problems", label: "Which technically difficult problems did you encounter this month?" },
  { key: "explained", label: "What did another team need to explain to you?" },
  { key: "faster", label: "What decision can you now make faster than 30 days ago?" },
  { key: "artifact", label: "What artifact did you produce?" },
  { key: "edge", label: "Where were you operating at the edge of your competence?" },
  { key: "next", label: "What do you deliberately want to test next month?" },
] as const;

type Proposal = {
  id: string;
  capabilityId: string;
  name: string;
  oldValue: number;
  proposedValue: number;
  rationale: string;
};

export function CalibrationForm({ capabilities }: { capabilities: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [exercised, setExercised] = useState<string[]>([]);
  const [leverage, setLeverage] = useState(capabilities[0]?.slug ?? "");
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function toggle(slug: string) {
    setExercised((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]));
  }

  async function submit() {
    setPending(true);
    setStatus(null);
    const response = await fetch("/api/calibration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, exercised, leverage }),
    });
    setPending(false);
    if (!response.ok) {
      setStatus("Could not draft proposals.");
      return;
    }
    const body = (await response.json()) as { proposals: Proposal[] };
    setProposals(body.proposals);
    setSelected(body.proposals.map((item) => item.id));
  }

  async function approve() {
    setPending(true);
    const response = await fetch("/api/calibration/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected }),
    });
    setPending(false);
    if (!response.ok) {
      setStatus("Approval failed. Depths were not changed.");
      return;
    }
    setStatus("Approved updates are now part of mandate depth. Unselected proposals were left unchanged.");
    setProposals(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <header>
        <p className="kicker">Monthly calibration</p>
        <h1 className="font-mono text-xl">What changed in practice</h1>
        <p className="mt-2 max-w-3xl text-[12px] leading-5 text-dim">
          Proposals do not rewrite depth until you approve them. The system will not claim a skill rose on its own.
        </p>
      </header>
      {QUESTIONS.map((question) => (
        <label key={question.key} className="block panel px-3 py-3">
          <span className="text-[13px]">{question.label}</span>
          <textarea
            value={answers[question.key] ?? ""}
            onChange={(event) => setAnswers((current) => ({ ...current, [question.key]: event.target.value }))}
            rows={3}
            className="mt-2 w-full border border-line bg-bg px-2 py-1.5 text-[13px]"
          />
        </label>
      ))}
      <fieldset className="panel px-3 py-3">
        <legend className="kicker">Capabilities exercised</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {capabilities.map((capability) => {
            const on = exercised.includes(capability.slug);
            return (
              <button
                type="button"
                key={capability.slug}
                onClick={() => toggle(capability.slug)}
                className={`border px-2 py-1 text-[12px] ${on ? "border-amber text-amber" : "border-line text-dim"}`}
              >
                {capability.name}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="block panel px-3 py-3">
        <span>What capability would have created the most leverage?</span>
        <select
          value={leverage}
          onChange={(event) => setLeverage(event.target.value)}
          className="mt-2 block border border-line bg-bg px-2 py-1"
        >
          {capabilities.map((capability) => (
            <option key={capability.slug} value={capability.slug}>
              {capability.name}
            </option>
          ))}
        </select>
      </label>
      <Button type="button" onClick={submit} disabled={pending}>
        Draft depth updates
      </Button>
      {proposals ? (
        <section className="panel px-3 py-3">
          <h2 className="kicker">Proposed updates · approval required</h2>
          {proposals.length === 0 ? <p className="mt-2 text-dim">Nothing to change from these answers.</p> : null}
          <ul className="mt-2 divide-y divide-line">
            {proposals.map((proposal) => (
              <li key={proposal.id} className="flex gap-3 py-2">
                <input
                  type="checkbox"
                  checked={selected.includes(proposal.id)}
                  onChange={() =>
                    setSelected((current) =>
                      current.includes(proposal.id) ? current.filter((id) => id !== proposal.id) : [...current, proposal.id],
                    )
                  }
                />
                <div>
                  <p className="font-mono">
                    {proposal.name} {proposal.oldValue} → {proposal.proposedValue}
                  </p>
                  <p className="text-[12px] text-dim">{proposal.rationale}</p>
                </div>
              </li>
            ))}
          </ul>
          <Button type="button" className="mt-3" onClick={approve} disabled={pending || selected.length === 0}>
            Approve selected
          </Button>
        </section>
      ) : null}
      {status ? <p className="text-[12px] text-dim">{status}</p> : null}
    </div>
  );
}
