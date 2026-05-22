// JSON Schema validation against the bundled spec schemas.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Confidence, SourceKind } from "../src/evidence.js";
import { type OutcomeDeclaration } from "../src/outcome.js";
import { type Report } from "../src/report.js";
import { HeuristicVerifier } from "../src/verifier.js";
import { toJsonable } from "../src/verdict.js";
import {
  evidenceSchema,
  outcomeSchema,
  validateOutcome,
  validateVerdict,
  verdictSchema,
} from "../src/conformance.js";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");

describe("schema bundling", () => {
  for (const name of ["outcome.schema.json", "verdict.schema.json", "evidence.schema.json"]) {
    it(`bundled ${name} equals canonical copy`, () => {
      const canonical = JSON.parse(readFileSync(resolve(REPO_ROOT, "schema", name), "utf-8"));
      const bundled =
        name === "outcome.schema.json"
          ? outcomeSchema
          : name === "verdict.schema.json"
            ? verdictSchema
            : evidenceSchema;
      expect(bundled).toStrictEqual(canonical);
    });
  }
});

describe("validateOutcome", () => {
  it("accepts a minimum outcome", () => {
    const r = validateOutcome({
      title: "t",
      as_of: "2026-05-21",
      question: "q",
      success_criteria: ["c"],
    });
    expect(r.valid).toBe(true);
  });

  it("rejects a missing success_criteria", () => {
    const r = validateOutcome({ title: "t", as_of: "2026-05-21", question: "q" });
    expect(r.valid).toBe(false);
  });
});

describe("validateVerdict", () => {
  it("accepts a HeuristicVerifier output", () => {
    const outcome: OutcomeDeclaration = {
      title: "t",
      as_of: "2026-05-21",
      question: "q",
      success_criteria: ["c"],
    };
    const report: Report = {
      summary: "one. two.",
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
    const v = new HeuristicVerifier().verify(outcome, report);
    const r = validateVerdict(toJsonable(v));
    expect(r.errors).toEqual([]);
    expect(r.valid).toBe(true);
  });
});
