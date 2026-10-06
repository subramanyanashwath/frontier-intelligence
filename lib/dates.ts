export const DATA_AS_OF = "2026-10-06";

export function parseISODate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

export function formatISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return formatISODate(date);
}

export function diffDays(later: string, earlier: string): number {
  return Math.round(
    (parseISODate(later).getTime() - parseISODate(earlier).getTime()) / 86_400_000,
  );
}

export function clampDate(iso: string, min: string, max: string): string {
  if (iso < min) return min;
  if (iso > max) return max;
  return iso.slice(0, 10);
}

export const RANGE_DAYS = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
} as const;

export type RangeKey = keyof typeof RANGE_DAYS;

export function parseRange(value: string | undefined): RangeKey {
  if (value && value in RANGE_DAYS) return value as RangeKey;
  return "3M";
}

export function monthAnchor(index: number): string {
  return addDays(DATA_AS_OF, (index - 11) * 30);
}
