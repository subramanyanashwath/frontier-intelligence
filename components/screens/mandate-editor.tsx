"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Row = {
  capabilityId: string;
  name: string;
  importance: number;
  depth: number;
  target: number;
  gap: number;
  momentum: string;
  priority: number;
  confidence: number;
  rationale: string;
};

export function MandateEditor({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: Row[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(rows);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update(capabilityId: string, field: "importance" | "depth" | "target", value: number) {
    setDraft((current) =>
      current.map((row) => (row.capabilityId === capabilityId ? { ...row, [field]: value, gap: field === "depth" || field === "target" ? (field === "target" ? value : row.target) - (field === "depth" ? value : row.depth) : row.gap } : row)),
    );
  }

  async function save() {
    setPending(true);
    setStatus(null);
    const response = await fetch("/api/mandate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rows: draft.map((row) => ({
          capabilityId: row.capabilityId,
          importance: row.importance,
          currentDepth: row.depth,
          targetDepth: row.target,
        })),
      }),
    });
    setPending(false);
    if (!response.ok) {
      setStatus("Save failed.");
      return;
    }
    setStatus("Saved. Historical dates keep the earlier approved depths.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <header>
        <p className="kicker">Current mandate</p>
        <h1 className="font-mono text-xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-[12px] leading-5 text-dim">{description}</p>
        <p className="mt-2 text-[12px] text-dim" title="Delta = importance × min(1, gap / 40). Gap is target depth minus depth at the selected date. 40 points is the stated full-room horizon, not a measured constant.">
          Scores are 0–100 heuristics. Delta uses importance × min(1, gap / 40). Hover for the method.
        </p>
      </header>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-dim">
              {["Capability", "Importance", "Depth", "Target", "Gap", "Frontier", "Delta", "Conf"].map((label) => (
                <th key={label} className="px-2 py-2 font-medium first:px-3">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {draft.map((row) => (
              <tr key={row.capabilityId} className="border-b border-line/70 align-top">
                <td className="px-3 py-2">
                  <div>{row.name}</div>
                  <p className="max-w-xs text-[11px] leading-4 text-dim">{row.rationale}</p>
                </td>
                <td className="px-2 py-2">
                  <NumberField value={row.importance} onChange={(value) => update(row.capabilityId, "importance", value)} />
                  <Meter value={row.importance} />
                </td>
                <td className="px-2 py-2">
                  <NumberField value={row.depth} onChange={(value) => update(row.capabilityId, "depth", value)} />
                  <Meter value={row.depth} />
                </td>
                <td className="px-2 py-2">
                  <NumberField value={row.target} onChange={(value) => update(row.capabilityId, "target", value)} />
                </td>
                <td className="num px-2 py-2 font-mono text-rose">{row.target - row.depth}</td>
                <td className="num px-2 py-2 font-mono text-dim">{row.momentum}</td>
                <td className="num px-2 py-2 font-mono text-amber">{row.priority}</td>
                <td className="num px-2 py-2 font-mono text-dim">{Math.round(row.confidence * 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? "Saving" : "Save mandate"}
        </Button>
        {status ? <p className="text-[12px] text-dim">{status}</p> : null}
      </div>
    </div>
  );
}

function NumberField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      max={100}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="num w-16 border border-line bg-bg px-1 py-0.5 font-mono"
    />
  );
}

function Meter({ value }: { value: number }) {
  return (
    <div className="mt-1 h-1 w-24 bg-line">
      <div className="h-1 bg-steel" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
