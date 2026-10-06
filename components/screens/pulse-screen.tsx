"use client";

import type { EChartsOption } from "echarts";
import { useMemo, useState } from "react";
import Link from "next/link";
import { EChart } from "@/components/charts/echart";
import { EvidenceDrawer } from "@/components/terminal/evidence-drawer";
import { formatRatio } from "@/lib/format";
import type { PulseView } from "@/lib/view/operator";

export function PulseScreen({ pulse }: { pulse: PulseView }) {
  const [open, setOpen] = useState<string | null>(null);
  const evidence = pulse.evidence.find((item) => item.id === open) ?? null;
  const option = useMemo(() => barOption(pulse), [pulse]);

  return (
    <div className="space-y-3">
      <section className="panel px-3 py-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="kicker">{pulse.regime.code}</p>
            <h1 className="mt-1 font-mono text-xl tracking-wide text-ink md:text-2xl">{pulse.regime.headline}</h1>
            <p className="mt-2 max-w-3xl text-[12px] leading-5 text-dim">{pulse.regime.detail}</p>
          </div>
          <p className="font-mono text-[12px] text-dim">
            Regime confidence <span className="text-ink">{pulse.regime.confidence.band}</span>
          </p>
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <section className="panel">
          <header className="flex items-center justify-between border-b border-line px-3 py-2">
            <h2 className="kicker">Capability movers · 90d</h2>
            <span className="font-mono text-[11px] text-dim">click a row for evidence</span>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="text-[10px] uppercase tracking-[0.14em] text-dim">
                <tr className="border-b border-line">
                  <th className="px-3 py-2 font-medium">Capability</th>
                  <th className="px-2 py-2 font-medium">7d</th>
                  <th className="px-2 py-2 font-medium">30d</th>
                  <th className="px-2 py-2 font-medium">90d</th>
                  <th className="px-2 py-2 font-medium">Counts</th>
                  <th className="px-3 py-2 font-medium">Conf</th>
                </tr>
              </thead>
              <tbody>
                {pulse.movers.map((row) => (
                  <tr key={row.capabilityId} className="border-b border-line/70 hover:bg-white/[0.02]">
                    <td className="px-3 py-1.5">
                      <button className="text-left hover:text-amber" onClick={() => setOpen(row.evidenceId)}>
                        {row.name}
                      </button>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-dim">{row.category}</div>
                    </td>
                    <Td ratio={row.windows.d7} />
                    <Td ratio={row.windows.d30} />
                    <td className="px-2 py-1.5">
                      <button className={`num font-mono ${tone(row.windows.d90)}`} onClick={() => setOpen(row.evidenceId)}>
                        {formatRatio(row.windows.d90)}
                      </button>
                    </td>
                    <td className="num px-2 py-1.5 font-mono text-[12px] text-dim">
                      {row.counts.d90[0]} vs {row.counts.d90[1]}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-[11px] text-dim">{row.confidence.band}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line px-2 py-2">
            <EChart option={option} className="h-48 w-full" />
          </div>
        </section>

        <section className="panel">
          <header className="border-b border-line px-3 py-2">
            <h2 className="kicker">New signals · 21d</h2>
          </header>
          <ul className="divide-y divide-line">
            {pulse.signals.length === 0 ? <li className="px-3 py-3 text-dim">No signals in this window.</li> : null}
            {pulse.signals.map((signal) => (
              <li key={signal.id} className="px-3 py-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber">{signal.eventType.replaceAll("_", " ")}</span>
                  <span className="font-mono text-[11px] text-dim">{signal.occurredAt}</span>
                </div>
                {signal.jobId ? (
                  <Link href={`/operator/xray/${signal.jobId}`} className="mt-1 block text-ink hover:text-steel">
                    {signal.title}
                  </Link>
                ) : (
                  <p className="mt-1">{signal.title}</p>
                )}
                <p className="text-[12px] text-dim">{signal.summary}</p>
              </li>
            ))}
          </ul>
          {pulse.copilotClosures > 0 ? (
            <p className="border-t border-line px-3 py-2 text-[12px] text-dim">
              Generic copilot-surface postings closed in the last 120 days: <span className="font-mono text-rose">{pulse.copilotClosures}</span>
            </p>
          ) : null}
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="panel">
          <header className="border-b border-line px-3 py-2">
            <h2 className="kicker">Current mandate coverage</h2>
          </header>
          <table className="w-full text-left">
            <tbody>
              {pulse.gaps.map((gap) => (
                <tr key={gap.capabilityId} className="border-b border-line/70">
                  <td className="px-3 py-2">
                    <button className="hover:text-amber" onClick={() => setOpen(gap.evidenceId)}>
                      {gap.name}
                    </button>
                  </td>
                  <td className="num px-2 font-mono text-[12px] text-dim">imp {gap.importance}</td>
                  <td className="num px-2 font-mono text-[12px]">depth {gap.depth}</td>
                  <td className="num px-2 font-mono text-rose">{gap.gap > 0 ? `-${gap.gap}` : gap.gap}</td>
                  <td className="num px-3 font-mono text-[12px] text-dim">{gap.momentum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="panel">
          <header className="flex items-center justify-between border-b border-line px-3 py-2">
            <h2 className="kicker">Learning allocation change · 30d</h2>
            <Link href="/operator/allocate" className="font-mono text-[11px] text-steel">
              Allocate
            </Link>
          </header>
          <ul className="divide-y divide-line">
            {pulse.allocationShift.map((line) => (
              <li key={line.name} className="flex items-center justify-between px-3 py-2 font-mono">
                <span>{line.name}</span>
                <span className="text-dim">
                  {line.previous}% <span className="text-ink">→</span> <span className="text-amber">{line.next}%</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <EvidenceDrawer evidence={evidence} onClose={() => setOpen(null)} />
    </div>
  );
}

function Td({ ratio }: { ratio: number }) {
  return <td className={`num px-2 py-1.5 font-mono text-[12px] ${tone(ratio)}`}>{formatRatio(ratio)}</td>;
}

function tone(ratio: number): string {
  if (ratio > 0.02) return "text-mint";
  if (ratio < -0.02) return "text-rose";
  return "text-dim";
}

function barOption(pulse: PulseView): EChartsOption {
  const rows = [...pulse.movers].reverse();
  return {
    backgroundColor: "transparent",
    grid: { left: 120, right: 16, top: 8, bottom: 20 },
    xAxis: {
      type: "value" as const,
      axisLabel: { color: "#8493a5", formatter: (value: number) => `${Math.round(value * 100)}%` },
      splitLine: { lineStyle: { color: "#2a3544" } },
    },
    yAxis: {
      type: "category" as const,
      data: rows.map((row) => row.name),
      axisLabel: { color: "#d7dee7", fontSize: 11 },
      axisLine: { lineStyle: { color: "#2a3544" } },
    },
    series: [
      {
        type: "bar" as const,
        data: rows.map((row) => ({
          value: row.windows.d90,
          itemStyle: { color: row.windows.d90 >= 0 ? "#7dcea0" : "#e08b93" },
        })),
        barWidth: 10,
      },
    ],
    tooltip: {
      trigger: "axis",
      backgroundColor: "#12171d",
      borderColor: "#2a3544",
      textStyle: { color: "#d7dee7" },
    },
  };
}
