import Link from "next/link";
import { XrayView } from "@/components/jobs/xray-view";
import { jobFit } from "@/lib/analytics/career";
import { getDataset } from "@/lib/data/repository";
import { buildXray } from "@/lib/view/operator";
import { readViewQuery } from "@/lib/view/query";

export default async function PrivateXrayPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { jobId } = await params;
  const query = await readViewQuery(searchParams);
  const dataset = await getDataset();
  const model = buildXray(dataset, jobId, query.asOf);
  if (!model) {
    return (
      <div className="panel px-4 py-6">
        <p>No posting visible on this date.</p>
        <Link href="/private/roles" className="text-steel">
          Back
        </Link>
      </div>
    );
  }
  return <XrayView model={model} fit={jobFit(dataset, model.job, query.asOf)} />;
}
