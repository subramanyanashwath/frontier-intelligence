"use client";

import * as echarts from "echarts";
import { useEffect, useRef } from "react";

export function EChart({ option, className }: { option: echarts.EChartsOption; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const chart = echarts.init(node, undefined, { renderer: "canvas" });
    chart.setOption(option);
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(node);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [option]);

  return <div ref={ref} className={className ?? "h-52 w-full"} />;
}
