import { FINDING_THRESHOLDS } from '@/features/projects/config/signals';
import type { VerdictResult } from '@/features/projects/config/verdict';
import type { Finding, ProjectInsight } from '@/features/projects/types';

// ── Input ────────────────────────────────────────────────────────────

export interface VerdictInput {
  totalResponses: number;
  responseLimit: number;
  /** Count of manually-created insights (from the Insights tab). */
  insightCount: number;
  /** Auto-generated findings from survey data. */
  findings: Finding[];
  /** Manual insights with type info for sentiment analysis. */
  insights: ProjectInsight[];
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Count auto-findings that carry a negative signal. */
function countNegativeFindings(findings: Finding[]): number {
  return findings.filter((f) => {
    if (f.source === 'yes_no') {
      return f.value <= FINDING_THRESHOLDS.yesNo.lowMax;
    }

    if (f.source === 'rating') {
      return f.value <= FINDING_THRESHOLDS.rating.lowMax;
    }

    if (f.source === 'completion_rate') {
      return f.value <= FINDING_THRESHOLDS.completionRate.lowMax;
    }

    return false;
  }).length;
}

// ── Main ─────────────────────────────────────────────────────────────

/**
 * Compute a verdict for a project based on response completeness, insights,
 * and auto-generated findings. Pure function — no side-effects.
 *
 * MVP heuristic; intentionally simple and interpretable.
 */
export function computeVerdict(input: VerdictInput): VerdictResult {
  const { totalResponses, responseLimit, insightCount, findings, insights } = input;

  // ── No data ─────────────────────────────────────────
  if (totalResponses === 0) {
    return { status: 'no-data', confidence: 0, summaryKey: 'projects.verdict.noData.summary' };
  }

  const confidence = Math.min(totalResponses / Math.max(responseLimit, 1), 1);
  const totalSignals = findings.length + insightCount;

  // ── Early exploration (little data) ─────────────────
  if (confidence < 0.3) {
    return { status: 'exploring', confidence, summaryKey: 'projects.verdict.exploring.summary' };
  }

  if (confidence < 0.7 && totalSignals < 3) {
    return { status: 'exploring', confidence, summaryKey: 'projects.verdict.exploringLow.summary' };
  }

  // ── Enough signals to analyse ───────────────────────
  if (totalSignals >= 3) {
    const threatCount = insights.filter((i) => i.type === 'threat').length;
    const negativeFindings = countNegativeFindings(findings);

    // Strong validation
    if (confidence >= 0.9 && threatCount === 0 && negativeFindings === 0) {
      return {
        status: 'validated',
        confidence,
        summaryKey: 'projects.verdict.validated.summary',
      };
    }

    // Strong invalidation
    if (confidence >= 0.9 && (threatCount >= 2 || negativeFindings >= 3)) {
      return {
        status: 'invalidated',
        confidence,
        summaryKey: 'projects.verdict.invalidated.summary',
      };
    }

    // Some concerns
    if (threatCount > 0 || negativeFindings > 0) {
      return {
        status: 'needs-attention',
        confidence,
        summaryKey: 'projects.verdict.needsAttention.summary',
      };
    }

    // Positive trend
    return {
      status: 'promising',
      confidence,
      summaryKey: 'projects.verdict.promising.summary',
    };
  }

  // ── Default: still exploring ────────────────────────
  return { status: 'exploring', confidence, summaryKey: 'projects.verdict.moreData.summary' };
}
