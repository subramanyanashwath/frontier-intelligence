import type { Dataset } from "@/lib/domain";
import { confidenceFrom } from "@/lib/analytics/confidence";
import { familyMomentum, momentumTable } from "@/lib/analytics/momentum";

export function marketRegime(dataset: Dataset, asOf: string) {
  const evals = familyMomentum(dataset, asOf, "evaluations", 90);
  const training = familyMomentum(dataset, asOf, "training", 90);
  const agents = familyMomentum(dataset, asOf, "agent-systems", 90);
  const movers = momentumTable(dataset, asOf);
  const flywheel = movers.find((row) => row.capabilityId === "data-flywheels");
  let code = "MIXED REGIME";
  let headline = "NO SINGLE FAMILY DOMINATES THE 90-DAY WINDOW";
  if (evals.ratio > 0.15 && training.ratio > 0.15) {
    code = "MSFT AI REGIME";
    headline = "EVALS + POST-TRAINING ACCELERATING";
  } else if (agents.ratio > 0.25) {
    code = "MSFT AI REGIME";
    headline = "AGENT PLATFORM EXPANSION";
  } else if ((flywheel?.windows.d90 ?? 0) > 0.2) {
    code = "MSFT AI REGIME";
    headline = "DATA FLYWHEELS EMERGING";
  }
  const sample = evals.current + training.current + agents.current;
  return {
    code,
    headline,
    evals,
    training,
    agents,
    confidence: confidenceFrom({
      jobs: sample,
      functions: 4,
      locations: 3,
      persistence: 0.75,
    }),
    detail: `90d new postings: evaluations ${evals.current} vs ${evals.prior}, training ${training.current} vs ${training.prior}, agent systems ${agents.current} vs ${agents.prior}.`,
  };
}
