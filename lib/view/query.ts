import { addDays, clampDate, DATA_AS_OF, parseRange, RANGE_DAYS, type RangeKey } from "@/lib/dates";

export type ViewQuery = {
  asOf: string;
  range: RangeKey;
  days: number;
};

type RawParams = Record<string, string | string[] | undefined>;

export async function readViewQuery(searchParams: Promise<RawParams> | RawParams): Promise<ViewQuery> {
  const params = await searchParams;
  const rawAsOf = typeof params.asOf === "string" ? params.asOf : DATA_AS_OF;
  const asOf = clampDate(rawAsOf, addDays(DATA_AS_OF, -364), DATA_AS_OF);
  const range = parseRange(typeof params.range === "string" ? params.range : undefined);
  return { asOf, range, days: RANGE_DAYS[range] };
}

export function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}
