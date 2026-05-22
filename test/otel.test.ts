// OTel attribute projection (Section 6, appendix B).

import { describe, expect, it } from "vitest";
import { Confidence, SourceKind } from "../src/evidence.js";
import { type OutcomeDeclaration } from "../src/outcome.js";
import { type Report } from "../src/report.js";
import { HeuristicVerifier } from "../src/verifier.js";
import { SPAN_NAME, verdictToSpanAttributes } from "../src/otel.js";

function makeVerdict() {
  const outcome: OutcomeDeclaration = {
    title: "t",
    as_of: "2026-05-21",
    question: "q",
    success_criteria: ["c"],
  };
  const report: Report = {
    summary: "one. two. three.",
    open_questions: [],
    claims: [
      {
        statement: "x",
        confidence: Confidence.HIGH,
        citations: [
          { url: "https://example.com/a", title: "a", accessed: "2026-05-21", kind: SourceKind.PRIMARY },
          { url: "https://example.com/b", title: "b", accessed: "2026-05-21", kind: SourceKind.PRIMARY },
        ],
      },
    ],
  };
  return new HeuristicVerifier().verify(outcome, report);
}

describe("verdictToSpanAttributes", () => {
  it("sets all required attributes (Req 6.1.1)", () => {
    const a = verdictToSpanAttributes(makeVerdict());
    expect(a["gen_ai.outcome.spec_version"]).toBe("0.1.0");
    expect(typeof a["gen_ai.outcome.overall"]).toBe("number");
    expect(a["gen_ai.outcome.dimension_count"]).toBe(5);
    expect(a["gen_ai.outcome.evidence_count"]).toBe(2);
    expect(a["gen_ai.outcome.verifier_id"]).toBe("open-outcome.typescript.heuristic");
  });

  it("emits per-dimension scores (Req 6.1.2)", () => {
    const v = makeVerdict();
    const a = verdictToSpanAttributes(v);
    for (const d of v.dimensions) {
      expect(a[`gen_ai.outcome.dimension.${d.name}.score`]).toBe(d.score);
    }
  });

  it("uses the right span name (Req 6.2.1)", () => {
    expect(SPAN_NAME).toBe("verify_outcome");
  });

  it("does not inline the evidence array (Req 6.1.3)", () => {
    const a = verdictToSpanAttributes(makeVerdict());
    expect(a["gen_ai.outcome.evidence"]).toBeUndefined();
  });
});
