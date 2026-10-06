export function formatRatio(ratio: number): string {
  const pct = Math.round(ratio * 100);
  if (pct > 0) return `+${pct}%`;
  return `${pct}%`;
}

export function formatSigned(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}
