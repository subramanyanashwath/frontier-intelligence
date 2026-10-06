import Link from "next/link";
import { XrayView } from "@/components/jobs/xray-view";
import { getDataset } from "@/lib/data/repository";
import { buildXray } from "@/lib/view/operator";
import { readViewQuery } from "@/lib/view/query";

export default async function XrayPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { jobId } = await params;
  const query = await readViewQuery(searchParams);
  const model = buildXray(await getDataset(), jobId, query.asOf);
  if (!model) {
    return (
      <div className="panel px-4 py-6">
        <p className="font-mono">No posting {jobId} was visible on {query.asOf}.</p>
        <Link href="/operator/xray" className="mt-3 inline-block text-steel">
          Return to index
        </Link>
      </div>
    );
  }
  return <XrayView model={model} />;
}
