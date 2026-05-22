// Report — the agent's structured output that a verifier consumes.

import { z } from "zod";
import { CitationSchema, ClaimSchema, type Citation, type Claim } from "./evidence.js";

export const ReportSchema = z
  .object({
    summary: z.string().min(1),
    claims: z.array(ClaimSchema).min(1),
    open_questions: z.array(z.string()).default([]),
    methodology_notes: z.string().optional(),
  })
  .strict();

export type Report = z.infer<typeof ReportSchema>;

export function allCitations(report: Report): Citation[] {
  const seen = new Map<string, Citation>();
  for (const claim of report.claims) {
    for (const c of claim.citations) {
      if (!seen.has(c.url)) seen.set(c.url, c);
    }
  }
  return Array.from(seen.values());
}

// Re-export for convenience.
export { CitationSchema, ClaimSchema };
export type { Citation, Claim };
