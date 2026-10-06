import { z } from "zod";
import type { Discipline } from "@/lib/domain";
import type { RawOpening } from "@/lib/ingestion/pipeline";

const SEARCH_URL = "https://apply.careers.microsoft.com/api/pcsx/search";
const DETAIL_URL = "https://apply.careers.microsoft.com/api/pcsx/position_details";
const USER_AGENT = "FrontierOperator/0.1 (personal capability research; public job metadata only)";

const positionSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    positionId: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    title: z.string().optional(),
    locations: z.array(z.string()).optional(),
    location: z.string().optional(),
    standardizedLocations: z.array(z.string()).optional(),
    department: z.string().optional(),
    businessUnit: z.string().optional(),
    postedTs: z.number().optional(),
    creationTs: z.number().optional(),
    positionUrl: z.string().optional(),
    canonicalPositionUrl: z.string().optional(),
    jobDescription: z.string().optional(),
    description: z.string().optional(),
    skills: z.array(z.string()).optional(),
  })
  .passthrough();

const searchSchema = z
  .object({
    data: z
      .object({
        count: z.number().optional(),
        positions: z.array(positionSchema).optional(),
      })
      .optional(),
  })
  .passthrough();

export type FetchResult = {
  openings: RawOpening[];
  errors: string[];
  seen: number;
};

export async function fetchMicrosoftOpenings(options?: {
  query?: string;
  pages?: number;
  delayMs?: number;
  detailLimit?: number;
  fetchImpl?: typeof fetch;
}): Promise<FetchResult> {
  const query = options?.query ?? process.env.INGEST_QUERY ?? "artificial intelligence";
  const pages = options?.pages ?? numberEnv("INGEST_MAX_PAGES", 2);
  const delayMs = options?.delayMs ?? numberEnv("INGEST_DELAY_MS", 1000);
  const detailLimit = options?.detailLimit ?? numberEnv("INGEST_DETAIL_LIMIT", 20);
  const fetchImpl = options?.fetchImpl ?? fetch;
  const openings: RawOpening[] = [];
  const errors: string[] = [];
  let seen = 0;

  for (let page = 0; page < pages; page += 1) {
    if (page > 0) await sleep(delayMs);
    const url = new URL(SEARCH_URL);
    url.searchParams.set("domain", "microsoft.com");
    url.searchParams.set("query", query);
    url.searchParams.set("location", "");
    url.searchParams.set("start", String(page * 10));
    url.searchParams.set("sort_by", "timestamp");
    const response = await fetchImpl(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
        Referer: "https://apply.careers.microsoft.com/careers",
      },
    });
    if (!response.ok) {
      errors.push(`Search page ${page} returned HTTP ${response.status}. Stopped. No bypass attempted.`);
      break;
    }
    const json: unknown = await response.json();
    const parsed = searchSchema.safeParse(json);
    if (!parsed.success) {
      errors.push(`Search page ${page} did not match the expected public payload.`);
      break;
    }
    const positions = parsed.data.data?.positions ?? [];
    seen += positions.length;
    if (positions.length === 0) break;
    for (const position of positions) {
      const sourceJobId = String(position.id ?? position.positionId ?? "");
      if (!sourceJobId) {
        errors.push("Skipped a position with no public id.");
        continue;
      }
      let text = stripHtml(position.jobDescription ?? position.description ?? "");
      let html = position.jobDescription ?? position.description ?? "";
      if (!text && openings.length < detailLimit) {
        await sleep(delayMs);
        const detail = await fetchDetail(fetchImpl, sourceJobId);
        if (detail.error) errors.push(detail.error);
        text = detail.text;
        html = detail.html;
      }
      if (!text) {
        errors.push(`Position ${sourceJobId} had no public description. Not invented.`);
        continue;
      }
      const title = position.name ?? position.title ?? "Untitled posting";
      openings.push({
        source: "microsoft-careers",
        sourceJobId,
        title,
        company: "Microsoft",
        org: position.businessUnit || position.department || "Microsoft",
        team: position.department || "Unspecified",
        discipline: inferDiscipline(`${title} ${text}`),
        level: inferLevel(`${title} ${text}`),
        locations: position.locations?.length
          ? position.locations
          : position.standardizedLocations?.length
            ? position.standardizedLocations
            : position.location
              ? [position.location]
              : ["Unspecified"],
        sourceUrl: position.canonicalPositionUrl || position.positionUrl || `https://apply.careers.microsoft.com/careers/job/${sourceJobId}`,
        postedAt: toDate(position.postedTs ?? position.creationTs),
        text,
        html,
        archetype: "live",
        metadata: { query, page, isDemo: false },
      });
    }
  }

  return { openings, errors, seen };
}

async function fetchDetail(fetchImpl: typeof fetch, id: string): Promise<{ text: string; html: string; error?: string }> {
  const url = new URL(DETAIL_URL);
  url.searchParams.set("position_id", id);
  url.searchParams.set("domain", "microsoft.com");
  url.searchParams.set("hl", "en");
  const response = await fetchImpl(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
  if (!response.ok) return { text: "", html: "", error: `Detail ${id} returned HTTP ${response.status}.` };
  const json: unknown = await response.json();
  const record = json as { data?: { jobDescription?: string; description?: string } };
  const html = record.data?.jobDescription ?? record.data?.description ?? "";
  return { text: stripHtml(html), html };
}

export function inferDiscipline(text: string): Discipline {
  const lower = text.toLowerCase();
  if (lower.includes("forward deployed") || lower.includes("fde")) return "FDE";
  if (lower.includes("program manager") || lower.includes("technical program")) return "TPM";
  if (lower.includes("product manager")) return "PM";
  if (lower.includes("data scientist")) return "Data Science";
  if (lower.includes("researcher") || lower.includes("research scientist") || lower.includes("applied scientist")) {
    return "Research";
  }
  return "Engineering";
}

export function inferLevel(text: string): string {
  const match = text.match(/\b(5[9]|6[0-6])\b/);
  if (match) return match[1] ?? "";
  const lower = text.toLowerCase();
  if (lower.includes("principal") || lower.includes("partner")) return "65";
  if (lower.includes("senior")) return "63";
  return "62";
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function toDate(epochSeconds?: number): string {
  if (!epochSeconds) return new Date().toISOString().slice(0, 10);
  const ms = epochSeconds > 10_000_000_000 ? epochSeconds : epochSeconds * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

function numberEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
