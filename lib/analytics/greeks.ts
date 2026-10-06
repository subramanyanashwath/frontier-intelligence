import { CAPABILITY_BY_SLUG } from "@/lib/capabilities/ontology";
import type { Dataset } from "@/lib/domain";
import { diffusionFor } from "@/lib/analytics/diffusion";
import { capabilityMomentum } from "@/lib/analytics/momentum";
import { depthAt } from "@/lib/analytics/selectors";

export type GreekScore = {
  capabilityId: string;
  name: string;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  impliedVol: number;
  inputs: { label: string; value: string }[];
};

const GAP_HORIZON = 40;

export function deltaScore(importance: number, current: number, target: number): number {
  const gap = Math.max(0, target - current);
  return clamp(Math.round(importance * Math.min(1, gap / GAP_HORIZON)));
}

export function gammaScore(adjacency: number): number {
  return clamp(Math.round(100 * (1 - Math.exp(-0.45 * adjacency))));
}

export function thetaScore(baseTheta: number, titleChurn: number): number {
  return clamp(Math.round(baseTheta * 0.85 + titleChurn * 15));
}

export function vegaScore(baseVega: number, impliedVol: number): number {
  return clamp(Math.round(baseVega * 0.8 + impliedVol * 0.2));
}

export function impliedVolScore(input: {
  titleCount: number;
  jobCount: number;
  functions: number;
  locations: number;
  revisedShare: number;
}): number {
  const titleVariety = input.jobCount === 0 ? 0 : input.titleCount / input.jobCount;
  const raw =
    titleVariety * 35 +
    Math.min(input.functions, 5) * 8 +
    Math.min(input.locations, 5) * 6 +
    input.revisedShare * 25;
  return clamp(Math.round(raw));
}

export function greeksFor(dataset: Dataset, asOf: string): GreekScore[] {
  const mandate = dataset.mandateCapabilities;
  return dataset.capabilities
    .filter((capability) => capability.parentId)
    .map((capability) => {
      const row = mandate.find((item) => item.capabilityId === capability.slug);
      const depth = row ? depthAt(row, asOf) : 0;
      const importance = row?.importance ?? 0;
      const target = row?.targetDepth ?? 0;
      const momentum = capabilityMomentum(dataset, asOf, capability.slug, 90);
      const diffusion = diffusionFor(dataset, asOf, capability.slug, 90);
      const titles = new Set(momentum.jobs.map((job) => job.title));
      const revised = dataset.jobs.filter(
        (job) =>
          momentum.jobs.some((item) => item.id === job.id) &&
          dataset.snapshots.filter((snapshot) => snapshot.jobId === job.id).length > 1,
      ).length;
      const revisedShare = momentum.jobs.length ? revised / momentum.jobs.length : 0;
      const impliedVol = impliedVolScore({
        titleCount: titles.size,
        jobCount: momentum.jobs.length,
        functions: diffusion.functionCount,
        locations: diffusion.locationCount,
        revisedShare,
      });
      const ontology = CAPABILITY_BY_SLUG.get(capability.slug);
      const delta = deltaScore(importance, depth, target);
      const gamma = gammaScore(ontology?.adjacency.length ?? 0);
      const theta = thetaScore(ontology?.baseTheta ?? 30, revisedShare);
      const vega = vegaScore(ontology?.baseVega ?? 50, impliedVol);
      return {
        capabilityId: capability.slug,
        name: capability.name,
        delta,
        gamma,
        theta,
        vega,
        impliedVol,
        inputs: [
          { label: "Mandate importance", value: String(importance) },
          { label: "Depth at date", value: String(depth) },
          { label: "Target depth", value: String(target) },
          { label: "Gap horizon", value: `${GAP_HORIZON} pts = full marginal room` },
          { label: "Adjacent capabilities", value: String(ontology?.adjacency.length ?? 0) },
          { label: "Theta prior", value: String(ontology?.baseTheta ?? 30) },
          { label: "Vega prior", value: String(ontology?.baseVega ?? 50) },
          { label: "90d postings", value: `${momentum.current} vs ${momentum.prior}` },
          { label: "Functions / locations", value: `${diffusion.functionCount} / ${diffusion.locationCount}` },
          { label: "Wording revisions", value: `${Math.round(revisedShare * 100)}%` },
        ],
      };
    });
}

function clamp(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}
