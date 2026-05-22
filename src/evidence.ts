// Citations, claims, and the confidence / source-kind enums.
// Implements Section 4 (Evidence) and Section 5 (Confidence Calibration).

import { z } from "zod";

export const Confidence = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;
export type Confidence = (typeof Confidence)[keyof typeof Confidence];

export const SourceKind = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  COMMUNITY: "community",
} as const;
export type SourceKind = (typeof SourceKind)[keyof typeof SourceKind];

export const ConfidenceSchema = z.enum(["high", "medium", "low"]);
export const SourceKindSchema = z.enum(["primary", "secondary", "community"]);

export const CitationSchema = z
  .object({
    url: z.string().url().regex(/^https?:\/\//, "url MUST be HTTP or HTTPS"),
    title: z.string().min(1),
    accessed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "accessed MUST be ISO date"),
    kind: SourceKindSchema,
    quote: z.string().optional(),
  })
  .strict();

export type Citation = z.infer<typeof CitationSchema>;

export const ClaimSchema = z
  .object({
    statement: z.string().min(1),
    confidence: ConfidenceSchema,
    citations: z.array(CitationSchema),
    caveats: z.string().optional(),
  })
  .strict()
  .refine(
    (c) => c.confidence === "low" || c.citations.length >= 1,
    "non-low confidence claim must cite at least one source",
  );

export type Claim = z.infer<typeof ClaimSchema>;
