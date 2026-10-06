import type { Dataset } from "@/lib/domain";
import { addDays } from "@/lib/dates";
import { learningAllocation } from "@/lib/analytics/allocation";
import { capabilityMomentum, persistenceScore } from "@/lib/analytics/momentum";
import { depthAt } from "@/lib/analytics/selectors";
import { greeksFor } from "@/lib/analytics/greeks";

export const SURFACE_CAPABILITIES = [
  "agents",
  "evals",
  "agent-evals",
  "synthetic-data",
  "reinforcement-learning",
  "post-training",
  "inference",
  "data-infrastructure",
  "alignment",
  "observability",
  "forward-deployed-engineering",
  "multimodal",
] as const;

export const HORIZONS = [
  { id: "now", label: "Now", days: 0 },
  { id: "3m", label: "3M", days: 90 },
  { id: "6m", label: "6M", days: 180 },
  { id: "12m", label: "12M", days: 365 },
] as const;

export type SurfaceCell = {
  capabilityId: string;
  horizon: string;
  intensity: number;
  note: string;
};

export function marketSurface(dataset: Dataset, asOf: string): SurfaceCell[] {
  return SURFACE_CAPABILITIES.flatMap((capabilityId) => {
    const momentum = capabilityMomentum(dataset, asOf, capabilityId, 90);
    const persistence = persistenceScore(dataset, asOf, capabilityId);
    const now = clamp(Math.round(50 + momentum.ratio * 80));
    return HORIZONS.map((horizon) => {
      const decay = horizon.days === 0 ? 1 : horizon.days === 90 ? 0.7 : horizon.days === 180 ? 0.5 : 0.35;
      const projected = 50 + (now - 50) * decay * (0.55 + persistence * 0.45);
      return {
        capabilityId,
        horizon: horizon.id,
        intensity: clamp(Math.round(horizon.days === 0 ? now : projected)),
        note:
          horizon.days === 0
            ? `90d momentum mapped around 50. ${momentum.current} vs ${momentum.prior} postings.`
            : `Projection. Momentum decayed by ${decay} and mixed with persistence ${persistence.toFixed(2)}. Not a forecast.`,
      };
    });
  });
}

export function mandateSurface(dataset: Dataset, asOf: string): SurfaceCell[] {
  return SURFACE_CAPABILITIES.flatMap((capabilityId) => {
    const row = dataset.mandateCapabilities.find((item) => item.capabilityId === capabilityId);
    const depth = row ? depthAt(row, asOf) : 0;
    const importance = row?.importance ?? 0;
    const gap = Math.max(0, (row?.targetDepth ?? 0) - depth);
    const now = clamp(Math.round((importance / 100) * gap));
    return HORIZONS.map((horizon) => {
      const closed = horizon.days === 0 ? 0 : horizon.days === 90 ? 0.25 : horizon.days === 180 ? 0.45 : 0.7;
      return {
        capabilityId,
        horizon: horizon.id,
        intensity: clamp(Math.round(now * (1 - closed))),
        note:
          horizon.days === 0
            ? `Importance ${importance} × gap ${gap}. Depth ${depth}.`
            : `Remaining gap if about ${Math.round(closed * 100)}% of the gap is closed by practice. A planning assumption.`,
      };
    });
  });
}

export function careerSurface(dataset: Dataset, asOf: string): SurfaceCell[] {
  const greeks = new Map(greeksFor(dataset, asOf).map((row) => [row.capabilityId, row]));
  const allocation = new Map(learningAllocation(dataset, asOf).map((line) => [line.capabilityId, line.allocationPct]));
  return SURFACE_CAPABILITIES.flatMap((capabilityId) => {
    const greek = greeks.get(capabilityId);
    const momentum = capabilityMomentum(dataset, asOf, capabilityId, 90);
    const adjacency = greek ? greek.gamma : 0;
    const now = clamp(
      Math.round(
        0.3 * clamp(50 + momentum.ratio * 80) +
          0.25 * adjacency +
          0.2 * (greek?.vega ?? 0) +
          0.15 * (allocation.get(capabilityId) ?? 0) * 2 +
          0.1 * (greek?.delta ?? 0),
      ),
    );
    return HORIZONS.map((horizon) => ({
      capabilityId,
      horizon: horizon.id,
      intensity: clamp(Math.round(now * (horizon.days === 365 ? 0.85 : 1))),
      note: "Private heuristic. Components stay visible on the Career Alpha table. Equal weights are placeholders.",
    }));
  });
}

export function surfaceAsOfNote(asOf: string): string {
  return `Reconstructed as of ${asOf}. Postings after ${addDays(asOf, 0)} are excluded.`;
}

function clamp(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}
