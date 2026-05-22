// OpenTelemetry span attribute projection for a Verdict.
// Implements Section 6 (Observability) and appendix B.

import { type Verdict } from "./verdict.js";

export const SPAN_NAME = "verify_outcome";

export type SpanAttributes = Record<string, string | number>;

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function verdictToSpanAttributes(verdict: Verdict): SpanAttributes {
  const attrs: SpanAttributes = {
    "gen_ai.outcome.spec_version": verdict.spec_version,
    "gen_ai.outcome.overall": verdict.overall,
    "gen_ai.outcome.dimension_count": verdict.dimensions.length,
    "gen_ai.outcome.evidence_count": verdict.evidence.length,
  };
  if (verdict.verifier_id) attrs["gen_ai.outcome.verifier_id"] = verdict.verifier_id;
  for (const d of verdict.dimensions) {
    attrs[`gen_ai.outcome.dimension.${normalize(d.name)}.score`] = d.score;
  }
  return attrs;
}
