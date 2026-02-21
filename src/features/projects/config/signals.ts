/** Thresholds for auto-generating signals from survey response data. */
export const SIGNAL_THRESHOLDS = {
  /** Yes/No question thresholds (fraction of "yes" answers). */
  yesNo: {
    /** >70% yes = strength. */
    strengthMin: 0.7,
    /** <40% yes = threat. */
    threatMax: 0.4,
  },
  /** Rating question thresholds (average score). */
  rating: {
    /** avg >= 4.0 = strength. */
    strengthMin: 4.0,
    /** avg <= 2.5 = threat. */
    threatMax: 2.5,
  },
  /** Multiple choice thresholds (fraction of respondents picking dominant option). */
  multipleChoice: {
    /** >50% picking one option = signal. */
    dominantMin: 0.5,
  },
  /** Completion rate thresholds (fraction of started responses that were submitted). */
  completionRate: {
    /** <50% = threat. */
    threatMax: 0.5,
  },
  /** Minimum completed responses for a phase to be considered "validated". */
  minResponses: 5,
} as const;
