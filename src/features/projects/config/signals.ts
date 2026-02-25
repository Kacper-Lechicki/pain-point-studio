/** Thresholds for auto-generating findings from survey response data. */
export const FINDING_THRESHOLDS = {
  /** Yes/No question thresholds (fraction of "yes" answers). */
  yesNo: {
    /** Emit finding when yes% >= 70%. */
    highMin: 0.7,
    /** Emit finding when yes% <= 40%. */
    lowMax: 0.4,
  },
  /** Rating question thresholds (average score). */
  rating: {
    /** Emit finding when avg >= 4.0. */
    highMin: 4.0,
    /** Emit finding when avg <= 2.5. */
    lowMax: 2.5,
  },
  /** Multiple choice thresholds (fraction of respondents picking dominant option). */
  multipleChoice: {
    /** Emit finding when >50% pick one option. */
    dominantMin: 0.5,
  },
  /** Completion rate thresholds (fraction of started responses that were submitted). */
  completionRate: {
    /** Emit finding when completion rate <= 50%. */
    lowMax: 0.5,
  },
  /** Minimum completed responses for a phase to be considered "validated". */
  minResponses: 5,
} as const;
