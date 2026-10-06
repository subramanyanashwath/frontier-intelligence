import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { CapabilityUpdateProposal, Dataset, MandateCapability, MonthlyInterview } from "@/lib/domain";

export type Overlay = {
  mandate: Record<
    string,
    { importance?: number; currentDepth?: number; targetDepth?: number; rationale?: string; updatedAt: string }
  >;
  interviews: MonthlyInterview[];
  proposals: CapabilityUpdateProposal[];
};

const FILE = path.join(process.cwd(), ".data", "overlay.json");

export function emptyOverlay(): Overlay {
  return { mandate: {}, interviews: [], proposals: [] };
}

export async function readOverlay(): Promise<Overlay> {
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Overlay;
    return {
      mandate: parsed.mandate ?? {},
      interviews: parsed.interviews ?? [],
      proposals: parsed.proposals ?? [],
    };
  } catch {
    return emptyOverlay();
  }
}

export async function writeOverlay(overlay: Overlay): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(overlay, null, 2));
}

export function applyOverlay(dataset: Dataset, overlay: Overlay): Dataset {
  const mandateCapabilities: MandateCapability[] = dataset.mandateCapabilities.map((row) => {
    const patch = overlay.mandate[row.capabilityId];
    if (!patch) return row;
    const depth = patch.currentDepth ?? row.currentDepth;
    const history = row.history.some((point) => point.date === patch.updatedAt && point.depth === depth)
      ? row.history
      : [...row.history, { date: patch.updatedAt, depth }];
    return {
      ...row,
      importance: patch.importance ?? row.importance,
      currentDepth: depth,
      targetDepth: patch.targetDepth ?? row.targetDepth,
      rationale: patch.rationale ?? row.rationale,
      updatedAt: patch.updatedAt,
      history,
    };
  });
  return {
    ...dataset,
    mandateCapabilities,
    interviews: [...dataset.interviews, ...overlay.interviews],
    proposals: [...dataset.proposals, ...overlay.proposals],
  };
}
