import { SurfaceScreen } from "@/components/screens/surface-screen";
import { careerSurface, HORIZONS, SURFACE_CAPABILITIES } from "@/lib/analytics/surface";
import { CAPABILITY_BY_SLUG } from "@/lib/capabilities/ontology";
import { getDataset } from "@/lib/data/repository";
import { readViewQuery } from "@/lib/view/query";

export default async function PrivateSurfacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await readViewQuery(searchParams);
  const cells = careerSurface(await getDataset(), query.asOf);
  const capabilities = SURFACE_CAPABILITIES.map((slug) => ({ slug, name: CAPABILITY_BY_SLUG.get(slug)?.name ?? slug }));
  const horizons = HORIZONS.map((horizon) => ({ id: horizon.id, label: horizon.label }));
  const z = horizons.map((horizon) => capabilities.map((capability) => cells.find((cell) => cell.capabilityId === capability.slug && cell.horizon === horizon.id)?.intensity ?? 0));
  return (
    <SurfaceScreen
      title="Career Alpha surface"
      note="Private only. Intensity mixes momentum, adjacency, Vega, and current learning weight. The operator surface does not render this view."
      capabilities={capabilities}
      horizons={horizons}
      cells={cells}
      z={z}
    />
  );
}
