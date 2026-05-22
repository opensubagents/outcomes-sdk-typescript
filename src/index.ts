// @opensubagents/open-outcome — public surface.

export {
  Confidence,
  ConfidenceSchema,
  SourceKind,
  SourceKindSchema,
  CitationSchema,
  ClaimSchema,
  type Citation,
  type Claim,
} from "./evidence.js";
export { OutcomeDeclarationSchema, type OutcomeDeclaration } from "./outcome.js";
export { ReportSchema, allCitations, type Report } from "./report.js";
export {
  DimensionScoreSchema,
  VerdictSchema,
  verdictsEqual,
  toJsonable,
  type DimensionScore,
  type Verdict,
} from "./verdict.js";
export { HeuristicVerifier, REFERENCE_VERIFIER_ID, type Verifier } from "./verifier.js";
export { SPAN_NAME, verdictToSpanAttributes, type SpanAttributes } from "./otel.js";
export {
  SPEC_VERSION,
  validateOutcome,
  validateVerdict,
  type ValidationResult,
} from "./conformance.js";
