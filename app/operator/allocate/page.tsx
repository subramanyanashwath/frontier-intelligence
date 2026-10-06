import { AllocateScreen } from "@/components/screens/allocate-screen";
import { getDataset } from "@/lib/data/repository";
import { buildAllocate } from "@/lib/view/operator";
import { readViewQuery } from "@/lib/view/query";

export default async function AllocatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await readViewQuery(searchParams);
  const view = buildAllocate(await getDataset(), query.asOf);
  return <AllocateScreen lines={view.lines} evidence={view.evidence} />;
}
