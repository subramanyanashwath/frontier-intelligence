import { PulseScreen } from "@/components/screens/pulse-screen";
import { getDataset } from "@/lib/data/repository";
import { buildPulse } from "@/lib/view/operator";
import { readViewQuery } from "@/lib/view/query";

export default async function PulsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await readViewQuery(searchParams);
  const pulse = buildPulse(await getDataset(), query.asOf);
  return <PulseScreen pulse={pulse} />;
}
