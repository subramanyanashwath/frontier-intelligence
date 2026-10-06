import { ONTOLOGY } from "@/lib/capabilities/ontology";
import type { Capability, EvidenceType, JobCapabilityLink } from "@/lib/domain";

const PHRASES = ONTOLOGY.flatMap((capability) =>
  capability.phrases.map((phrase) => ({
    capability,
    phrase: phrase.toLowerCase(),
  })),
).sort((a, b) => b.phrase.length - a.phrase.length);

function sectionOf(text: string, index: number): EvidenceType {
  const lower = text.toLowerCase();
  const requiredAt = lower.indexOf("required qualifications");
  const preferredAt = lower.indexOf("preferred qualifications");
  if (requiredAt >= 0 && index >= requiredAt && (preferredAt < 0 || index < preferredAt)) {
    return "required";
  }
  if (preferredAt >= 0 && index >= preferredAt) return "preferred";
  return "inferred";
}

function sentenceAround(text: string, index: number): string {
  const start = Math.max(0, text.lastIndexOf(".", index - 1) + 1, text.lastIndexOf("\n", index));
  const endCandidates = [text.indexOf(".", index), text.indexOf("\n", index)].filter((n) => n >= 0);
  const end = endCandidates.length ? Math.min(...endCandidates) : text.length;
  return text.slice(start, end + 1).replace(/\s+/g, " ").trim().slice(0, 280);
}

export function extractCapabilities(
  text: string,
  snapshotId: string,
  jobId: string,
  createdAt: string,
): JobCapabilityLink[] {
  const lower = text.toLowerCase();
  const found = new Map<string, { capability: Capability; type: EvidenceType; quote: string; hits: number }>();

  for (const entry of PHRASES) {
    const index = lower.indexOf(entry.phrase);
    if (index < 0) continue;
    const type = sectionOf(text, index);
    const existing = found.get(entry.capability.slug);
    if (!existing) {
      found.set(entry.capability.slug, {
        capability: entry.capability,
        type,
        quote: sentenceAround(text, index),
        hits: 1,
      });
      continue;
    }
    existing.hits += 1;
    const rank = { required: 3, preferred: 2, inferred: 1 };
    if (rank[type] > rank[existing.type]) {
      existing.type = type;
      existing.quote = sentenceAround(text, index);
    }
  }

  return [...found.values()].map((hit) => {
    const base = hit.type === "required" ? 0.82 : hit.type === "preferred" ? 0.62 : 0.44;
    return {
      id: `${jobId}:${hit.capability.slug}`,
      jobId,
      capabilityId: hit.capability.slug,
      weight: Math.min(0.98, base + (hit.hits - 1) * 0.05),
      evidenceType: hit.type,
      confidence: hit.type === "required" ? 0.84 : hit.type === "preferred" ? 0.68 : 0.5,
      evidenceQuote: hit.quote,
      sourceSnapshotId: snapshotId,
      createdAt,
    };
  });
}
