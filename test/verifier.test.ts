// HeuristicVerifier behavior, determinism, and Section 5 calibration.

import { describe, expect, it } from "vitest";
import { Confidence, SourceKind } from "../src/evidence.js";
import { type OutcomeDeclaration } from "../src/outcome.js";
import { type Report } from "../src/report.js";
import { HeuristicVerifier } from "../src/verifier.js";
import { verdictsEqual } from "../src/verdict.js";

function makeOutcome(): OutcomeDeclaration {
  return {
    title: "t",
    as_of: "2026-05-21",
    question: "q",
    success_criteria: ["hash compared"],
    archetype: "deep_dive",
    archetype_fields: { angles: ["reproducibility"] },
  };
}

function makeHighConfidenceClaim() {
  return {
    statement: "The CI artifact hash equals the local hash.",
    confidence: Confidence.HIGH,
    citations: [
      {
        url: "https://example.com/ci-run-1234",
        title: "CI run #1234",
        accessed: "2026-05-21",
        kind: SourceKind.PRIMARY,
      },
      {
        url: "https://example.com/local-build-log",
        title: "Local build log",
        accessed: "2026-05-21",
        kind: SourceKind.PRIMARY,
      },
    ],
  };
}

describe("HeuristicVerifier", () => {
  it("emits spec_version (Req 3.1.3)", () => {
    const outcome = makeOutcome();
    const report: Report = {
      summary: "hash compared. reproducibility confirmed.",
      claims: [makeHighConfidenceClaim()],
      open_questions: [],
      methodology_notes: "diff -q",
    };
    const v = new HeuristicVerifier().verify(outcome, report);
    expect(v.spec_version).toBe("0.1.0");
  });

  it("is deterministic (Req 2.2.2)", () => {
    const outcome = makeOutcome();
    const report: Report = {
      summary: "hash compared. reproducibility confirmed.",
      claims: [makeHighConfidenceClaim()],
      open_questions: [],
    };
    const v1 = new HeuristicVerifier().verify(outcome, report);
    const v2 = new HeuristicVerifier().verify(outcome, report);
    expect(verdictsEqual(v1, v2)).toBe(true);
    expect(JSON.stringify(v1)).toBe(JSON.stringify(v2));
  });

  it("overall equals mean of dimensions (Req 3.1.2)", () => {
    const outcome = makeOutcome();
    const report: Report = {
      summary: "hash compared. reproducibility confirmed.",
      claims: [makeHighConfidenceClaim()],
      open_questions: [],
    };
    const v = new HeuristicVerifier().verify(outcome, report);
    const expected =
      Math.round((v.dimensions.reduce((a, b) => a + b.score, 0) / v.dimensions.length) * 10) / 10;
    expect(v.overall).toBeCloseTo(expected, 1);
  });

  it("dedups evidence by URI (Req 4.3.1)", () => {
    const outcome = makeOutcome();
    const report: Report = {
      summary: "hash compared. reproducibility confirmed.",
      claims: [makeHighConfidenceClaim(), makeHighConfidenceClaim()],
      open_questions: [],
    };
    const v = new HeuristicVerifier().verify(outcome, report);
    const urls = v.evidence.map((c) => c.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("flags overconfident claims (Req 5.2.1)", () => {
    const outcome = makeOutcome();
    const weak = {
      statement: "Reproducibility holds in general.",
      confidence: Confidence.HIGH,
      citations: [
        {
          url: "https://example.com/blog-post",
          title: "A blog post",
          accessed: "2026-05-21",
          kind: SourceKind.SECONDARY,
        },
      ],
    };
    const report: Report = {
      summary: "hash compared.",
      claims: [weak],
      open_questions: [],
    };
    const v = new HeuristicVerifier().verify(outcome, report);
    const calib = v.dimensions.find((d) => d.name === "confidence_calibration");
    expect(calib).toBeDefined();
    expect(calib!.score).toBeLessThan(5);
  });
});
