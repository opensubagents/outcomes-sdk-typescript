// OutcomeDeclaration — what should be true after an agent runs.
// Implements Section 1 of the Open Outcome spec.

import { z } from "zod";

export const OutcomeDeclarationSchema = z
  .object({
    title: z.string().min(1),
    as_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "as_of MUST be ISO date"),
    question: z.string().min(1),
    success_criteria: z.array(z.string().min(1)).min(1),
    archetype: z.string().min(1).optional(),
    archetype_fields: z.record(z.unknown()).optional(),
    requester: z.string().optional(),
  })
  .strict();

export type OutcomeDeclaration = z.infer<typeof OutcomeDeclarationSchema>;
