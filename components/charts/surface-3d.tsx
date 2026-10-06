"use client";

import { useEffect, useRef, useState } from "react";

type PlotlyModule = {
  newPlot: (root: HTMLElement, data: unknown[], layout: unknown, config: unknown) => Promise<unknown>;
  purge: (root: HTMLElement) => void;
};

export function Surface3D({
  z,
  x,
  y,
}: {
  z: number[][];
  x: string[];
  y: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let active = true;
    let plotly: PlotlyModule | null = null;
    (async () => {
      try {
        const loaded = (await import("plotly.js-dist-min")) as unknown as PlotlyModule & { default?: PlotlyModule };
        plotly = loaded.default ?? loaded;
        if (!active) return;
        await plotly.newPlot(
          node,
          [
            {
              type: "surface",
              z,
              x,
              y,
              colorscale: [
                [0, "#1b2430"],
                [0.45, "#8a6a32"],
                [1, "#e0b15a"],
              ],
              showscale: false,
            },
          ],
          {
            paper_bgcolor: "#12171d",
            plot_bgcolor: "#12171d",
            margin: { l: 0, r: 0, t: 10, b: 0 },
            scene: {
              xaxis: { title: "Capability", color: "#8493a5", gridcolor: "#2a3544" },
              yaxis: { title: "Horizon", color: "#8493a5", gridcolor: "#2a3544" },
              zaxis: { title: "Intensity", color: "#8493a5", gridcolor: "#2a3544" },
              bgcolor: "#12171d",
            },
          },
          { displaylogo: false, responsive: true },
        );
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "3D surface failed to load.");
      }
    })();
    return () => {
      active = false;
      if (plotly && node) plotly.purge(node);
    };
  }, [x, y, z]);

  if (error) return <p className="text-rose">{error}</p>;
  return <div ref={ref} className="h-[420px] w-full" />;
}
