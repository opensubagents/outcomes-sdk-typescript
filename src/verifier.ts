// Verifier interface and the reference HeuristicVerifier.
// Implements Section 2 (Verifier).
//
// Algorithm is a one-to-one port of the Python `HeuristicVerifier`.

import { SPEC_VERSION } from "./conformance.js";
import { Confidence, SourceKind, type Citation } from "./evidence.js";
import { type OutcomeDeclaration } from "./outcome.js";
import { allCitations, type Report } from "./report.js";
import { type DimensionScore, type Verdict } from "./verdict.js";

export const REFERENCE_VERIFIER_ID = "open-outcome.typescript.heuristic";

export const STALE_CITATION_DAYS = 180;

export interface Verifier {
  verify(outcome: OutcomeDeclaration, report: Report): Verdict;
}

export class HeuristicVerifier implements Verifier {
  verify(outcome: OutcomeDeclaration, report: Report): Verdict {
    const dimensions: DimensionScore[] = [
      this.scoreConfidenceCalibration(report),
      this.scoreCitationQuality(report),
      this.scoreCoverage(outcome, report),
      this.scoreDecisionUsefulness(report),
      this.scoreClarity(report),
    ];
    const overall =
      Math.round(
        (dimensions.reduce((a, b) => a + b.score, 0) / dimensions.length) * 10,
      ) / 10;
    const evidence = allCitations(report);
    return {
      spec_version: SPEC_VERSION,
      dimensions,
      overall,
      evidence,
      notes: "HeuristicVerifier (no LLM)",
      verifier_id: REFERENCE_VERIFIER_ID,
    };
  }

  private scoreConfidenceCalibration(report: Report): DimensionScore {
    const violations: string[] = [];
    for (const claim of report.claims) {
      const primary = claim.citations.filter((c) => c.kind === SourceKind.PRIMARY).length;
      const reputable = claim.citations.filter(
        (c) => c.kind === SourceKind.PRIMARY || c.kind === SourceKind.SECONDARY,
      ).length;
      if (claim.confidence === Confidence.HIGH && primary < 2) {
        violations.push(
          `high-confidence claim has ${primary} primary source(s): ${claim.statement.slice(0, 60)}...`,
        );
      } else if (
        claim.confidence === Confidence.MEDIUM &&
        primary < 1 &&
        reputable < 2
      ) {
        violations.push(
          `medium-confidence claim has weak sourcing: ${claim.statement.slice(0, 60)}...`,
        );
      } else if (claim.confidence === Confidence.LOW && primary >= 2) {
        violations.push(
          `low-confidence claim is well-sourced (under-calibrated): ${claim.statement.slice(0, 60)}...`,
        );
      }
    }
    const n = report.claims.length;
    const ratio = n ? (n - violations.length) / n : 0;
    const score = 1 + Math.round(ratio * 4);
    const justification = violations.length === 0
      ? "all claims calibrated"
      : `${violations.length}/${n} miscalibrated: ${violations.slice(0, 2).join("; ")}`;
    return { name: "confidence_calibration", score, justification };
  }

  private scoreCitationQuality(report: Report): DimensionScore {
    const cits: Citation[] = allCitations(report);
    if (cits.length === 0) {
      return { name: "citation_quality", score: 1, justification: "report has no citations" };
    }
    const counts: Record<SourceKind, number> = {
      [SourceKind.PRIMARY]: 0,
      [SourceKind.SECONDARY]: 0,
      [SourceKind.COMMUNITY]: 0,
    };
    for (const c of cits) counts[c.kind] += 1;
    const primaryShare = counts.primary / cits.length;
    let score: number;
    let justification: string;
    if (primaryShare >= 0.5) {
      score = 5;
      justification = `${counts.primary}/${cits.length} primary`;
    } else if (primaryShare >= 0.25) {
      score = 4;
      justification = `${counts.primary}/${cits.length} primary`;
    } else if (counts.primary >= 1) {
      score = 3;
      justification = "at least one primary, mostly secondary";
    } else if (counts.secondary >= 1) {
      score = 2;
      justification = "secondary only";
    } else {
      score = 1;
      justification = "community-only sourcing";
    }

    // Citation-staleness downgrade: if a majority of citations are older
    // than STALE_CITATION_DAYS at the time of scoring, drop one point.
    // Floor at 1.
    const today = new Date();
    const staleThreshold = new Date(today);
    staleThreshold.setUTCDate(staleThreshold.getUTCDate() - STALE_CITATION_DAYS);
    const staleCount = cits.filter((c) => new Date(c.accessed) < staleThreshold).length;
    if (staleCount * 2 > cits.length && score > 1) {
      score -= 1;
      justification = `${justification}; ${staleCount}/${cits.length} citations stale (>${STALE_CITATION_DAYS}d)`;
    }

    return { name: "citation_quality", score, justification };
  }

  private scoreCoverage(outcome: OutcomeDeclaration, report: Report): DimensionScore {
    const required: string[] = [...outcome.success_criteria];
    const af = outcome.archetype_fields ?? {};
    const fromArchetype = (key: string): string[] => {
      const v = af[key];
      return Array.isArray(v) ? (v as unknown[]).map(String) : [];
    };
    if (outcome.archetype === "vendor_comparison") required.push(...fromArchetype("dimensions"));
    else if (outcome.archetype === "deep_dive") required.push(...fromArchetype("angles"));
    else if (outcome.archetype === "capability_audit")
      required.push(...fromArchetype("capabilities"));

    if (required.length === 0) {
      return {
        name: "coverage",
        score: 3,
        justification: "outcome specifies no explicit coverage requirements",
      };
    }
    const haystack = report.claims.map((c) => c.statement.toLowerCase()).join(" ");
    const hits = required.filter((r) =>
      r
        .toLowerCase()
        .split(/\s+/)
        .some((tok) => tok.length > 0 && haystack.includes(tok)),
    ).length;
    const ratio = hits / required.length;
    const score = 1 + Math.round(ratio * 4);
    return {
      name: "coverage",
      score,
      justification: `${hits}/${required.length} required axes mentioned`,
    };
  }

  private scoreDecisionUsefulness(report: Report): DimensionScore {
    let signals = 0;
    if (report.open_questions.length > 0) signals += 1;
    if (report.claims.some((c) => c.caveats !== undefined && c.caveats !== "")) signals += 1;
    if (report.methodology_notes) signals += 1;
    const summary = report.summary.toLowerCase();
    if (["recommend", "choose", "prefer", "avoid", "tradeoff"].some((w) => summary.includes(w))) {
      signals += 1;
    }
    const score = Math.max(1, Math.min(5, 1 + signals));
    return {
      name: "decision_usefulness",
      score,
      justification: `${signals}/4 decision signals present`,
    };
  }

  private scoreClarity(report: Report): DimensionScore {
    const sentences = report.summary
      .replace(/!/g, ".")
      .split(".")
      .filter((s) => s.trim().length > 0);
    const n = sentences.length;
    if (n >= 2 && n <= 4) {
      return { name: "clarity", score: 5, justification: `summary is ${n} sentences` };
    } else if (n === 1 || n === 5) {
      return {
        name: "clarity",
        score: 3,
        justification: `summary is ${n} sentence(s) — outside 2-4 ideal`,
      };
    } else {
      return { name: "clarity", score: 2, justification: `summary is ${n} sentences` };
    }
  }
}
