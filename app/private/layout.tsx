import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ObservatoryShell } from "@/components/shell/observatory-shell";
import { isPrivateSession } from "@/lib/auth/private-session";
import { getDataset } from "@/lib/data/repository";
import { shellMeta } from "@/lib/view/operator";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  if (!(await isPrivateSession())) redirect("/login?next=/private");
  const dataset = await getDataset();
  const meta = { ...shellMeta(dataset), mode: "PRIVATE" as const };
  return (
    <Suspense fallback={<p className="p-6 text-dim">Loading private route…</p>}>
      <ObservatoryShell meta={meta} mode="private">
        {children}
      </ObservatoryShell>
    </Suspense>
  );
}
