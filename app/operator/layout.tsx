import { Suspense } from "react";
import { ObservatoryShell } from "@/components/shell/observatory-shell";
import { getDataset } from "@/lib/data/repository";
import { shellMeta } from "@/lib/view/operator";

export const dynamic = "force-dynamic";

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const dataset = await getDataset();
  const meta = shellMeta(dataset);
  return (
    <Suspense fallback={<p className="p-6 text-dim">Loading observatory…</p>}>
      <ObservatoryShell meta={meta} mode="operator">
        {children}
      </ObservatoryShell>
    </Suspense>
  );
}
