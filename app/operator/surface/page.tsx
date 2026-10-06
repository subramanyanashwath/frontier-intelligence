import Link from "next/link";
import { SurfaceScreen } from "@/components/screens/surface-screen";
import { getDataset } from "@/lib/data/repository";
import { buildSurface } from "@/lib/view/operator";
import { one, readViewQuery } from "@/lib/view/query";

export default async function SurfacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = await readViewQuery(params);
  const view = one(params.view) === "mandate" ? "mandate" : "market";
  const surface = buildSurface(await getDataset(), query.asOf, view);
  return (
    <div className="space-y-3">
      <div className="flex gap-2 font-mono text-[12px]">
        <Link href={`/operator/surface?asOf=${query.asOf}&range=${query.range}&view=market`} className={view === "market" ? "text-amber" : "text-dim"}>
          Market surface
        </Link>
        <Link href={`/operator/surface?asOf=${query.asOf}&range=${query.range}&view=mandate`} className={view === "mandate" ? "text-amber" : "text-dim"}>
          Mandate surface
        </Link>
      </div>
      <SurfaceScreen
        title={view === "market" ? "Market surface" : "Mandate surface"}
        note={
          view === "market"
            ? "Cell intensity is 90-day posting momentum, centered at 50. Later horizons decay that move by persistence. They are planning projections."
            : "Cell intensity is remaining mandate gap, weighted by importance. Later horizons assume practice closes part of the gap."
        }
        capabilities={surface.capabilities}
        horizons={surface.horizons}
        cells={surface.cells}
        z={surface.z}
      />
    </div>
  );
}
