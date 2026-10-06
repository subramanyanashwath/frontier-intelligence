import type { Dataset } from "@/lib/domain";
import { CAPABILITY_BY_SLUG } from "@/lib/capabilities/ontology";
import { jobsVisible } from "@/lib/analytics/selectors";

export type TapeEventType =
  | "NEW_JOB"
  | "JOB_CLOSED"
  | "JOB_CHANGED"
  | "NEW_CAPABILITY"
  | "ROLE_DIFFUSION"
  | "LOCATION_EXPANSION"
  | "RECOMMENDED_TO_ME";

export type TapeEvent = {
  id: string;
  eventType: TapeEventType;
  jobId: string | null;
  capabilityId: string | null;
  occurredAt: string;
  title: string;
  summary: string;
  org: string;
  discipline: string;
  location: string;
  level: string;
  archetype: string;
  isDemo: boolean;
};

export function operatorEvents(dataset: Dataset, asOf: string): TapeEvent[] {
  const events: TapeEvent[] = [];
  const visible = jobsVisible(dataset, asOf);
  const firstCapability = new Map<string, string>();
  const firstPair = new Set<string>();
  const firstLocation = new Set<string>();

  const ordered = [...visible].sort((a, b) => a.firstSeenAt.localeCompare(b.firstSeenAt) || a.id.localeCompare(b.id));
  for (const job of ordered) {
    events.push({
      id: `new_${job.id}`,
      eventType: "NEW_JOB",
      jobId: job.id,
      capabilityId: null,
      occurredAt: job.firstSeenAt,
      title: job.title,
      summary: `${job.org} · ${job.team}`,
      org: job.org,
      discipline: job.discipline,
      location: job.locations[0] ?? "",
      level: job.level,
      archetype: job.archetype,
      isDemo: job.isDemo,
    });
    const caps = dataset.links.filter((link) => link.jobId === job.id).map((link) => link.capabilityId);
    for (const capabilityId of caps) {
      if (!firstCapability.has(capabilityId)) {
        firstCapability.set(capabilityId, job.firstSeenAt);
        const name = CAPABILITY_BY_SLUG.get(capabilityId)?.name ?? capabilityId;
        events.push({
          id: `cap_${capabilityId}`,
          eventType: "NEW_CAPABILITY",
          jobId: job.id,
          capabilityId,
          occurredAt: job.firstSeenAt,
          title: name,
          summary: `First observed on ${job.title}`,
          org: job.org,
          discipline: job.discipline,
          location: job.locations[0] ?? "",
          level: job.level,
          archetype: job.archetype,
          isDemo: job.isDemo,
        });
      }
      const pair = `${capabilityId}:${job.discipline}`;
      if (!firstPair.has(pair) && firstCapability.get(capabilityId) !== job.firstSeenAt) {
        firstPair.add(pair);
        events.push({
          id: `diff_${pair}_${job.id}`,
          eventType: "ROLE_DIFFUSION",
          jobId: job.id,
          capabilityId,
          occurredAt: job.firstSeenAt,
          title: `${CAPABILITY_BY_SLUG.get(capabilityId)?.name ?? capabilityId} → ${job.discipline}`,
          summary: job.title,
          org: job.org,
          discipline: job.discipline,
          location: job.locations[0] ?? "",
          level: job.level,
          archetype: job.archetype,
          isDemo: job.isDemo,
        });
      } else {
        firstPair.add(pair);
      }
      const locKey = `${capabilityId}:${job.locations[0] ?? ""}`;
      if (!firstLocation.has(locKey) && job.locations[0]) {
        const seen = [...firstLocation].some((key) => key.startsWith(`${capabilityId}:`));
        firstLocation.add(locKey);
        if (seen) {
          events.push({
            id: `loc_${locKey}_${job.id}`,
            eventType: "LOCATION_EXPANSION",
            jobId: job.id,
            capabilityId,
            occurredAt: job.firstSeenAt,
            title: `${CAPABILITY_BY_SLUG.get(capabilityId)?.name ?? capabilityId} → ${job.locations[0]}`,
            summary: job.title,
            org: job.org,
            discipline: job.discipline,
            location: job.locations[0] ?? "",
            level: job.level,
            archetype: job.archetype,
            isDemo: job.isDemo,
          });
        }
      }
    }
    if (job.closedAt && job.closedAt <= asOf) {
      events.push({
        id: `closed_${job.id}`,
        eventType: "JOB_CLOSED",
        jobId: job.id,
        capabilityId: null,
        occurredAt: job.closedAt,
        title: job.title,
        summary: "Not a single-scrape miss. Closed in the historical record.",
        org: job.org,
        discipline: job.discipline,
        location: job.locations[0] ?? "",
        level: job.level,
        archetype: job.archetype,
        isDemo: job.isDemo,
      });
    }
    const revisions = dataset.snapshots
      .filter((snapshot) => snapshot.jobId === job.id && snapshot.capturedAt <= asOf)
      .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
    if (revisions.length > 1) {
      const revision = revisions[1];
      if (revision) {
        events.push({
          id: `chg_${job.id}`,
          eventType: "JOB_CHANGED",
          jobId: job.id,
          capabilityId: null,
          occurredAt: revision.capturedAt,
          title: job.title,
          summary: "Job text changed. A new snapshot was stored.",
          org: job.org,
          discipline: job.discipline,
          location: job.locations[0] ?? "",
          level: job.level,
          archetype: job.archetype,
          isDemo: job.isDemo,
        });
      }
    }
  }
  return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id));
}

export function privateRecommendationEvents(dataset: Dataset, asOf: string): TapeEvent[] {
  return dataset.recommendations
    .filter((rec) => rec.recommendedAt <= asOf)
    .map((rec) => {
      const job = dataset.jobs.find((item) => item.id === rec.jobId);
      return {
        id: rec.id,
        eventType: "RECOMMENDED_TO_ME" as const,
        jobId: rec.jobId,
        capabilityId: null,
        occurredAt: rec.recommendedAt,
        title: job?.title ?? "Unmatched recommendation",
        summary: rec.subject,
        org: job?.org ?? "",
        discipline: job?.discipline ?? "",
        location: job?.locations[0] ?? "",
        level: job?.level ?? "",
        archetype: job?.archetype ?? "",
        isDemo: rec.isDemo,
      };
    })
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
