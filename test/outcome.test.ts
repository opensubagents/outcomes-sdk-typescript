// Outcome model — Requirement 1.x coverage.

import { describe, expect, it } from "vitest";
import { OutcomeDeclarationSchema } from "../src/outcome.js";

describe("OutcomeDeclaration", () => {
  it("accepts the minimum required fields (Req 1.1.1-1.1.4)", () => {
    const parsed = OutcomeDeclarationSchema.parse({
      title: "t",
      as_of: "2026-05-21",
      question: "q",
      success_criteria: ["c"],
    });
    expect(parsed.archetype).toBeUndefined();
  });

  it("rejects a blank title (Req 1.1.1)", () => {
    expect(() =>
      OutcomeDeclarationSchema.parse({
        title: "",
        as_of: "2026-05-21",
        question: "ok",
        success_criteria: ["ok"],
      }),
    ).toThrow();
  });

  it("rejects empty success_criteria (Req 1.1.4)", () => {
    expect(() =>
      OutcomeDeclarationSchema.parse({
        title: "t",
        as_of: "2026-05-21",
        question: "q",
        success_criteria: [],
      }),
    ).toThrow();
  });

  it("accepts archetype + archetype_fields (Req 1.2.1, 1.2.2)", () => {
    const o = OutcomeDeclarationSchema.parse({
      title: "t",
      as_of: "2026-05-21",
      question: "q",
      success_criteria: ["c"],
      archetype: "vendor_comparison",
      archetype_fields: { candidates: ["A", "B"], dimensions: ["d"] },
    });
    expect(o.archetype).toBe("vendor_comparison");
  });
});
