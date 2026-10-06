import { MandateEditor } from "@/components/screens/mandate-editor";
import { getDataset } from "@/lib/data/repository";
import { buildMandate } from "@/lib/view/operator";
import { readViewQuery } from "@/lib/view/query";

export default async function MandatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await readViewQuery(searchParams);
  const view = buildMandate(await getDataset(), query.asOf);
  return (
    <MandateEditor
      title={view.mandate?.title ?? "Current mandate"}
      description={view.mandate?.description ?? ""}
      rows={view.rows}
    />
  );
}
