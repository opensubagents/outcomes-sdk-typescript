// Verdict and DimensionScore.
// Implements Section 3 (Verdict).

import { z } from "zod";
import { CitationSchema, type Citation } from "./evidence.js";

export const DimensionScoreSchema = z
  .object({
    name: z.string().min(1),
    score: z.number().int().min(1).max(5),
    justification: z.string().min(1),
  })
  .strict();

export type DimensionScore = z.infer<typeof DimensionScoreSchema>;

export const VerdictSchema = z
  .object({
    spec_version: z
      .string()
      .regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, "spec_version MUST be SemVer"),
    dimensions: z.array(DimensionScoreSchema).min(1),
    overall: z.number().min(1).max(5),
    evidence: z.array(CitationSchema),
    notes: z.string().optional(),
    verifier_id: z.string().optional(),
  })
  .strict()
  .refine((v) => {
    // Requirement 3.3.1 — dimension names unique.
    const names = v.dimensions.map((d) => d.name);
    return new Set(names).size === names.length;
  }, "verdict dimensions MUST have unique names")
  .refine((v) => {
    // Requirement 3.1.2 — overall is mean of dimension scores (1dp).
    const expected =
      Math.round(
        (v.dimensions.reduce((a, b) => a + b.score, 0) / v.dimensions.length) *
          10,
      ) / 10;
    return Math.abs(v.overall - expected) < 1e-9;
  }, "overall MUST equal mean of dimension scores")
  .refine((v) => {
    // Requirement 4.3.1 — evidence deduplicated by URI.
    const urls = v.evidence.map((c) => c.url);
    return new Set(urls).size === urls.length;
  }, "verdict evidence MUST be deduplicated by URI");

export type Verdict = z.infer<typeof VerdictSchema>;

export function verdictsEqual(a: Verdict, b: Verdict): boolean {
  if (a.spec_version !== b.spec_version) return false;
  if (Math.abs(a.overall - b.overall) > 1e-9) return false;
  const keyDim = (d: DimensionScore) => `${d.name}|${d.score}|${d.justification}`;
  const aDims = new Set(a.dimensions.map(keyDim));
  const bDims = new Set(b.dimensions.map(keyDim));
  if (aDims.size !== bDims.size) return false;
  for (const k of aDims) if (!bDims.has(k)) return false;
  const aU = new Set(a.evidence.map((c) => c.url));
  const bU = new Set(b.evidence.map((c) => c.url));
  if (aU.size !== bU.size) return false;
  for (const u of aU) if (!bU.has(u)) return false;
  return true;
}

export function toJsonable(verdict: Verdict): Record<string, unknown> {
  // Strip undefined optional fields so the result matches the JSON Schema.
  const out: Record<string, unknown> = {
    spec_version: verdict.spec_version,
    dimensions: verdict.dimensions,
    overall: verdict.overall,
    evidence: verdict.evidence.map((c) => {
      const { quote, ...rest } = c;
      return quote === undefined ? rest : { ...rest, quote };
    }),
  };
  if (verdict.notes !== undefined) out["notes"] = verdict.notes;
  if (verdict.verifier_id !== undefined) out["verifier_id"] = verdict.verifier_id;
  return out;
}

export type { Citation };
