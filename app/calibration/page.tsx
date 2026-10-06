import { Suspense } from "react";
import { CalibrationForm } from "@/components/screens/calibration-form";
import { ObservatoryShell } from "@/components/shell/observatory-shell";
import { getDataset } from "@/lib/data/repository";
import { shellMeta } from "@/lib/view/operator";

export const dynamic = "force-dynamic";

export default async function CalibrationPage() {
  const dataset = await getDataset();
  const capabilities = dataset.mandateCapabilities.map((row) => ({
    slug: row.capabilityId,
    name: dataset.capabilities.find((capability) => capability.slug === row.capabilityId)?.name ?? row.capabilityId,
  }));
  const completed = dataset.interviews.filter((interview) => interview.completedAt);
  return (
    <Suspense fallback={<p className="p-6 text-dim">Loading…</p>}>
      <ObservatoryShell meta={{ ...shellMeta(dataset), mode: "OPERATOR" }} mode="operator">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <CalibrationForm capabilities={capabilities} />
          <aside className="panel h-fit px-3 py-3">
            <h2 className="kicker">Prior calibrations</h2>
            <ul className="mt-2 space-y-2">
              {completed.map((interview) => (
                <li key={interview.id}>
                  <p className="font-mono text-[12px]">{interview.month}</p>
                  <p className="text-[12px] leading-5 text-dim">{interview.summary}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </ObservatoryShell>
    </Suspense>
  );
}
