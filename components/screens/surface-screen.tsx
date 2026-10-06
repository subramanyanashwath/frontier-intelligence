"use client";

import type { EChartsOption } from "echarts";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { EChart } from "@/components/charts/echart";

const Surface3D = dynamic(() => import("@/components/charts/surface-3d").then((mod) => mod.Surface3D), {
  ssr: false,
  loading: () => <p className="px-3 py-6 text-dim">Loading 3D surface…</p>,
});

type Cell = { capabilityId: string; horizon: string; intensity: number; note: string };

export function SurfaceScreen({
  title,
  note,
  capabilities,
  horizons,
  cells,
  z,
}: {
  title: string;
  note: string;
  capabilities: { slug: string; name: string }[];
  horizons: { id: string; label: string }[];
  cells: Cell[];
  z: number[][];
}) {
  const [selected, setSelected] = useState<Cell | null>(cells[0] ?? null);
  const [show3d, setShow3d] = useState(false);
  const option = useMemo(() => heatmapOption(capabilities, horizons, cells), [capabilities, horizons, cells]);

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Surface</p>
          <h1 className="font-mono text-xl">{title}</h1>
          <p className="mt-1 max-w-3xl text-[12px] leading-5 text-dim">{note}</p>
        </div>
        <button className="border border-line px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-dim" onClick={() => setShow3d((value) => !value)}>
          {show3d ? "2D matrix" : "3D vol surface"}
        </button>
      </header>
      {show3d ? (
        <section className="panel p-2">
          <Surface3D z={z} x={capabilities.map((item) => item.name)} y={horizons.map((item) => item.label)} />
          <p className="px-2 py-1 text-[11px] text-dim">Optional view. The matrix remains the readable default.</p>
        </section>
      ) : (
        <section className="panel">
          <EChart option={option} className="h-[460px] w-full" />
        </section>
      )}
      <div className="overflow-x-auto panel">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-[0.14em] text-dim">
              <th className="px-3 py-2 font-medium">Capability</th>
              {horizons.map((horizon) => (
                <th key={horizon.id} className="px-2 py-2 font-medium">
                  {horizon.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {capabilities.map((capability) => (
              <tr key={capability.slug} className="border-b border-line/70">
                <td className="px-3 py-1.5">{capability.name}</td>
                {horizons.map((horizon) => {
                  const cell = cells.find((item) => item.capabilityId === capability.slug && item.horizon === horizon.id);
                  const intensity = cell?.intensity ?? 0;
                  return (
                    <td key={horizon.id} className="px-2 py-1.5">
                      <button
                        className="num w-14 border border-line px-1 py-0.5 text-left font-mono text-[12px]"
                        style={{ backgroundColor: `rgba(224, 177, 90, ${0.08 + intensity / 140})` }}
                        onClick={() => cell && setSelected(cell)}
                      >
                        {intensity}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected ? (
        <p className="text-[12px] leading-5 text-dim">
          <span className="font-mono text-ink">
            {capabilities.find((item) => item.slug === selected.capabilityId)?.name} · {selected.horizon} · {selected.intensity}
          </span>
          {" · "}
          {selected.note}
        </p>
      ) : null}
    </div>
  );
}

function heatmapOption(
  capabilities: { slug: string; name: string }[],
  horizons: { id: string; label: string }[],
  cells: Cell[],
): EChartsOption {
  const data = cells.map((cell) => [
    capabilities.findIndex((item) => item.slug === cell.capabilityId),
    horizons.findIndex((item) => item.id === cell.horizon),
    cell.intensity,
  ]);
  return {
    backgroundColor: "transparent",
    grid: { left: 70, right: 20, top: 10, bottom: 80 },
    xAxis: {
      type: "category" as const,
      data: capabilities.map((item) => item.name),
      axisLabel: { color: "#8493a5", rotate: 35, fontSize: 10 },
      splitArea: { show: true },
    },
    yAxis: {
      type: "category" as const,
      data: horizons.map((item) => item.label),
      axisLabel: { color: "#d7dee7" },
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: false,
      orient: "horizontal",
      left: "center",
      bottom: 0,
      textStyle: { color: "#8493a5" },
      inRange: { color: ["#171d25", "#6d5730", "#e0b15a"] },
    },
    series: [{ type: "heatmap" as const, data, label: { show: true, color: "#d7dee7", fontSize: 10 } }],
    tooltip: { backgroundColor: "#12171d", borderColor: "#2a3544", textStyle: { color: "#d7dee7" } },
  };
}
