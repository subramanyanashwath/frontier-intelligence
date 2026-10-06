import type { Dataset, Job } from "@/lib/domain";
import { CAPABILITY_BY_SLUG } from "@/lib/capabilities/ontology";
import { addDays } from "@/lib/dates";
import { capabilityMomentum, persistenceScore } from "@/lib/analytics/momentum";
import { depthAt, jobsVisible, linksByJob } from "@/lib/analytics/selectors";
import { greeksFor } from "@/lib/analytics/greeks";
import { confidenceFrom } from "@/lib/analytics/confidence";

export type AlphaComponent = {
  capabilityId: string;
  name: string;
  marketMomentum: number;
  personalAdjacency: number;
  strategicValue: number;
  attainability: number;
  persistence: number;
  signalConfidence: number;
  composite: number;
  rationale: string;
};

export function careerAlpha(dataset: Dataset, asOf: string): AlphaComponent[] {
  const greeks = new Map(greeksFor(dataset, asOf).map((row) => [row.capabilityId, row]));
  const mandated = new Set(dataset.mandateCapabilities.map((row) => row.capabilityId));
  return dataset.capabilities
    .filter((capability) => capability.parentId)
    .map((capability) => {
      const momentum = capabilityMomentum(dataset, asOf, capability.slug, 90);
      const greek = greeks.get(capability.slug);
      const persistence = persistenceScore(dataset, asOf, capability.slug);
      const marketMomentum = clamp(Math.round(50 + momentum.ratio * 70));
      const neighbors = capability.adjacency.filter((slug) => mandated.has(slug)).length;
      const personalAdjacency = mandated.has(capability.slug)
        ? 80
        : clamp(Math.round(neighbors * 22 + (capability.parentId && mandated.has(capability.parentId) ? 15 : 0)));
      const strategicValue = greek?.vega ?? capability.baseVega;
      const row = dataset.mandateCapabilities.find((item) => item.capabilityId === capability.slug);
      const gap = row ? Math.max(0, row.targetDepth - depthAt(row, asOf)) : 40;
      const attainability = clamp(Math.round(100 - gap * 1.4));
      const signal = confidenceFrom({
        jobs: momentum.current + momentum.prior,
        functions: momentum.functions,
        locations: momentum.locations,
        persistence,
      });
      const signalConfidence = clamp(Math.round(signal.score * 100));
      const composite = clamp(
        Math.round(
          (marketMomentum + personalAdjacency + strategicValue + attainability + persistence * 100 + signalConfidence) /
            6,
        ),
      );
      return {
        capabilityId: capability.slug,
        name: capability.name,
        marketMomentum,
        personalAdjacency,
        strategicValue,
        attainability,
        persistence: Math.round(persistence * 100),
        signalConfidence,
        composite,
        rationale: mandated.has(capability.slug)
          ? "On the current mandate. Adjacency is high because the capability is already in the job."
          : `${neighbors} mandated neighbor${neighbors === 1 ? "" : "s"}. Composite uses equal weights and is a heuristic index.`,
      };
    })
    .sort((a, b) => b.composite - a.composite);
}

export function jobFit(dataset: Dataset, job: Job, asOf: string) {
  const links = (linksByJob(dataset).get(job.id) ?? []).filter((link) => link.weight >= 0.4);
  const weight = links.reduce((sum, link) => sum + link.weight, 0) || 1;
  const depthFor = (slug: string) => {
    const row = dataset.mandateCapabilities.find((item) => item.capabilityId === slug);
    return row ? depthAt(row, asOf) : 25;
  };
  const now = Math.round(links.reduce((sum, link) => sum + link.weight * depthFor(link.capabilityId), 0) / weight);
  const six = Math.round(
    links.reduce((sum, link) => {
      const row = dataset.mandateCapabilities.find((item) => item.capabilityId === link.capabilityId);
      const depth = depthFor(link.capabilityId);
      const target = row?.targetDepth ?? depth;
      return sum + link.weight * (depth + 0.3 * Math.max(0, target - depth));
    }, 0) / weight,
  );
  const twelve = Math.round(
    links.reduce((sum, link) => {
      const row = dataset.mandateCapabilities.find((item) => item.capabilityId === link.capabilityId);
      const depth = depthFor(link.capabilityId);
      const target = row?.targetDepth ?? depth;
      return sum + link.weight * (depth + 0.6 * Math.max(0, target - depth));
    }, 0) / weight,
  );
  return {
    now: clamp(now),
    sixMonth: clamp(six),
    twelveMonth: clamp(twelve),
    learningValue: clamp(Math.round((100 - now) * 0.6 + (links.length > 0 ? 20 : 0))),
    optionValue: clamp(Math.round(links.reduce((sum, link) => sum + (CAPABILITY_BY_SLUG.get(link.capabilityId)?.baseVega ?? 40), 0) / (links.length || 1))),
    note: "Fit is coverage of this posting's capability weights by current mandate depth. 6m and 12m assume 30% and 60% of the mandate gap closes. They are not probabilities of changing roles.",
  };
}

export function recommendationDistribution(dataset: Dataset, asOf: string) {
  const recs = dataset.recommendations.filter((rec) => rec.recommendedAt <= asOf && rec.recommendedAt >= addDays(asOf, -180));
  const byArchetype = new Map<string, number>();
  const byCapability = new Map<string, number>();
  const links = linksByJob(dataset);
  for (const rec of recs) {
    const job = dataset.jobs.find((item) => item.id === rec.jobId);
    if (!job) continue;
    byArchetype.set(job.archetype, (byArchetype.get(job.archetype) ?? 0) + 1);
    for (const link of links.get(job.id) ?? []) {
      if (link.weight < 0.6) continue;
      byCapability.set(link.capabilityId, (byCapability.get(link.capabilityId) ?? 0) + 1);
    }
  }
  const visible = jobsVisible(dataset, asOf);
  const recent = recs.filter((rec) => rec.recommendedAt >= addDays(asOf, -30)).length;
  const prior = dataset.recommendations.filter(
    (rec) => rec.recommendedAt < addDays(asOf, -30) && rec.recommendedAt >= addDays(asOf, -60),
  ).length;
  return {
    total: recs.length,
    recent,
    prior,
    byArchetype: [...byArchetype.entries()].sort((a, b) => b[1] - a[1]),
    byCapability: [...byCapability.entries()]
      .map(([slug, count]) => ({ slug, name: CAPABILITY_BY_SLUG.get(slug)?.name ?? slug, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    openJobs: visible.filter((job) => job.status === "open" || (job.closedAt && job.closedAt > asOf)).length,
  };
}

export function roleAdjacency(dataset: Dataset, asOf: string) {
  const groups = new Map<string, Job[]>();
  for (const job of jobsVisible(dataset, asOf)) {
    const list = groups.get(job.archetype) ?? [];
    list.push(job);
    groups.set(job.archetype, list);
  }
  const mandateVector = new Map(dataset.mandateCapabilities.map((row) => [row.capabilityId, row.importance / 100]));
  return [...groups.entries()]
    .map(([archetype, jobs]) => {
      const links = linksByJob(dataset);
      const weights = new Map<string, number>();
      for (const job of jobs) {
        for (const link of links.get(job.id) ?? []) {
          weights.set(link.capabilityId, (weights.get(link.capabilityId) ?? 0) + link.weight);
        }
      }
      const norm = [...weights.values()].reduce((sum, value) => sum + value, 0) || 1;
      let dot = 0;
      let mag = 0;
      for (const [slug, weight] of weights) {
        const unit = weight / norm;
        mag += unit * unit;
        dot += unit * (mandateVector.get(slug) ?? 0);
      }
      const fit = jobFit(dataset, jobs[jobs.length - 1] ?? jobs[0], asOf);
      return {
        archetype,
        jobs: jobs.length,
        similarity: Math.round((dot / Math.sqrt(mag || 1)) * 100),
        fit,
        sampleTitle: jobs[jobs.length - 1]?.title ?? archetype,
      };
    })
    .sort((a, b) => b.similarity - a.similarity);
}

function clamp(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}
