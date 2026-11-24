/**
 * BIO HI TECH CLINICAL REFERENCE RANGE EXTRACTION & AUTOMATIC RESULT INTERPRETATION ENGINE
 *
 * STRICT CLINICAL GOVERNANCE NOTICE:
 * 1. Deterministic evaluation only — no generative AI or heuristic guessing.
 * 2. Never invent medical reference values, clinical classifications, diagnoses, or critical limits.
 * 3. Never convert input-validation bounds into biological reference intervals.
 * 4. All extracted legacy parameters remain unverified until qualified laboratory owner approval.
 * 5. Respects patient context (age at sample collection, biological sex, units).
 * 6. Supports Numeric, Qualitative, and Text / Descriptive observations.
 */

import referenceDataset from '@/data/clinical/reference-intervals.json';

export type ResultClassification =
  | 'LOW'
  | 'HIGH'
  | 'NORMAL'
  | 'BORDERLINE'
  | 'CRITICAL'
  | 'UNVERIFIED'
  | 'UNAVAILABLE'
  | 'NOT_APPLICABLE'
  | 'INVALID'
  | 'PENDING';

export type ClinicalGovernanceState =
  | 'APPROVED_NUMERIC_RANGE'
  | 'APPROVED_QUALITATIVE_REFERENCE'
  | 'OWNER_REVIEW_REQUIRED'
  | 'REFERENCE_NOT_AVAILABLE'
  | 'NOT_APPLICABLE_TO_NUMERIC_COMPARISON';

export interface ReferenceIntervalDefinition {
  testId: string;
  testName: string;
  department: string;
  parameterId: string;
  parameterName: string;
  parameterIndex: number;
  dataType: 'Numeric' | 'Qualitative' | 'Text';
  lowerLimit: number | null;
  upperLimit: number | null;
  units: string;
  ageMin: number;
  ageMax: number;
  ageUnit: string;
  applicableSex: 'Male' | 'Female' | 'Both';
  pregnancyApplicability: string;
  specimenType: string;
  methodInstrument: string;
  fastingRequirement: string;
  borderlineLimits: { low: number; high: number } | null;
  criticalLow: number | null;
  criticalHigh: number | null;
  qualitativeExpected: string | null;
  sourceFile: string;
  sourceLocation: string;
  originalSourceWording: string;
  referenceVersion: number;
  extractionDate: string;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED';
  ownerApprovalStatus: 'APPROVED' | 'PENDING_OWNER_REVIEW' | 'REJECTED';
  approvingPerson: string | null;
  approvalDate: string | null;
  clinicalGovernanceState: ClinicalGovernanceState;
}

export interface PatientContext {
  age?: number | string | null;
  gender?: string | null;
  pregnancyStatus?: string | null;
  specimenType?: string | null;
  collectionDate?: string | null;
}

export interface EvaluationResult {
  status: ResultClassification;
  statusLabel: string;
  badgeStyle: 'low' | 'high' | 'normal' | 'borderline' | 'critical' | 'unverified' | 'neutral';
  arrowSymbol: '↑' | '↓' | '';
  isAbnormal: boolean;
  referenceDisplay: string;
  unit: string;
  matchedInterval: ReferenceIntervalDefinition | null;
  governanceState: ClinicalGovernanceState;
  explanation: string;
  dbFlag: 'Normal' | 'High' | 'Low' | 'Critical' | 'Abnormal' | 'Pending';
}

const intervals: ReferenceIntervalDefinition[] = (referenceDataset as any).intervals || [];

/**
 * Stable matching algorithm to select the exact applicable reference interval.
 * Uses:
 * 1. Test name & Parameter name
 * 2. Patient biological sex (Male / Female / Both)
 * 3. Patient age within interval bounds
 * 4. Unit verification
 */
export function matchReferenceInterval(
  testName: string,
  parameterName: string,
  patientContext?: PatientContext,
  enteredUnit?: string
): {
  interval: ReferenceIntervalDefinition | null;
  ambiguous: boolean;
  unitMismatch: boolean;
  reason?: string;
} {
  const normalizedTest = (testName || '').trim().toLowerCase();
  const normalizedParam = (parameterName || '').trim().toLowerCase();

  // Find candidate intervals for this test and parameter
  const candidates = intervals.filter(
    inv =>
      inv.testName.toLowerCase() === normalizedTest &&
      inv.parameterName.toLowerCase() === normalizedParam
  );

  if (candidates.length === 0) {
    // Fallback: check by parameter name alone if test is a single-parameter test
    const paramCandidates = intervals.filter(
      inv => inv.parameterName.toLowerCase() === normalizedParam
    );
    if (paramCandidates.length === 0) {
      return { interval: null, ambiguous: false, unitMismatch: false, reason: 'No reference interval found in catalogue' };
    }
  }

  const patientSex = (patientContext?.gender || '').trim().toLowerCase();
  const patientAge = patientContext?.age != null && patientContext.age !== '' ? Number(patientContext.age) : null;

  // Filter by sex
  let sexFiltered = candidates.filter(inv => {
    if (inv.applicableSex === 'Both') return true;
    if (patientSex === 'male' && inv.applicableSex === 'Male') return true;
    if (patientSex === 'female' && inv.applicableSex === 'Female') return true;
    return false;
  });

  // If sex is not specified or other, and there are sex-specific intervals, check if both match
  if (sexFiltered.length === 0 && candidates.length > 0) {
    if (candidates.some(c => c.applicableSex !== 'Both')) {
      return {
        interval: null,
        ambiguous: true,
        unitMismatch: false,
        reason: 'Patient sex required to select gender-specific reference interval'
      };
    }
    sexFiltered = candidates;
  }

  // Filter by age if age limits exist and patient age is known
  let ageFiltered = sexFiltered;
  if (patientAge !== null && !isNaN(patientAge)) {
    const ageMatches = sexFiltered.filter(
      inv => patientAge >= inv.ageMin && patientAge <= inv.ageMax
    );
    if (ageMatches.length > 0) {
      ageFiltered = ageMatches;
    }
  }

  if (ageFiltered.length > 1) {
    // If multiple distinct intervals still match, do not guess
    return {
      interval: null,
      ambiguous: true,
      unitMismatch: false,
      reason: 'Multiple applicable intervals match ambiguously'
    };
  }

  const selectedInterval = ageFiltered[0] || null;
  if (!selectedInterval) {
    return { interval: null, ambiguous: false, unitMismatch: false, reason: 'No applicable reference interval for patient context' };
  }

  // Check unit matching if enteredUnit is provided
  let unitMismatch = false;
  if (
    enteredUnit &&
    selectedInterval.units &&
    enteredUnit.trim().toLowerCase() !== selectedInterval.units.trim().toLowerCase()
  ) {
    unitMismatch = true;
  }

  return { interval: selectedInterval, ambiguous: false, unitMismatch };
}

/**
 * Deterministic Clinical Result Interpretation Engine.
 * Evaluates raw patient measurement against approved reference interval.
 */
export function evaluateResult(
  testName: string,
  parameterName: string,
  rawValue: string | null | undefined,
  patientContext?: PatientContext,
  unit?: string,
  forceVerifiedOverride?: boolean
): EvaluationResult {
  const trimmedVal = (rawValue || '').trim();

  // If empty or null: PENDING
  if (!trimmedVal) {
    return {
      status: 'PENDING',
      statusLabel: 'Pending',
      badgeStyle: 'neutral',
      arrowSymbol: '',
      isAbnormal: false,
      referenceDisplay: 'Range not verified',
      unit: unit || '',
      matchedInterval: null,
      governanceState: 'OWNER_REVIEW_REQUIRED',
      explanation: 'Result has not been entered yet.',
      dbFlag: 'Pending'
    };
  }

  const { interval, ambiguous, unitMismatch, reason } = matchReferenceInterval(
    testName,
    parameterName,
    patientContext,
    unit
  );

  if (ambiguous) {
    return {
      status: 'UNAVAILABLE',
      statusLabel: 'AMBIGUOUS CONTEXT',
      badgeStyle: 'unverified',
      arrowSymbol: '',
      isAbnormal: false,
      referenceDisplay: 'Owner review required',
      unit: unit || '',
      matchedInterval: null,
      governanceState: 'OWNER_REVIEW_REQUIRED',
      explanation: reason || 'Patient context does not uniquely resolve an interval.',
      dbFlag: 'Pending'
    };
  }

  if (!interval) {
    return {
      status: 'UNAVAILABLE',
      statusLabel: 'UNAVAILABLE',
      badgeStyle: 'unverified',
      arrowSymbol: '',
      isAbnormal: false,
      referenceDisplay: 'Range not available',
      unit: unit || '',
      matchedInterval: null,
      governanceState: 'REFERENCE_NOT_AVAILABLE',
      explanation: 'No approved clinical reference interval is available for this parameter.',
      dbFlag: 'Pending'
    };
  }

  const isVerified = forceVerifiedOverride || interval.verificationStatus === 'VERIFIED' || interval.ownerApprovalStatus === 'APPROVED';

  // Format reference display
  let referenceDisplay = 'Range not verified';
  if (interval.dataType === 'Numeric') {
    if (interval.lowerLimit != null && interval.upperLimit != null) {
      referenceDisplay = `${interval.lowerLimit} - ${interval.upperLimit} ${interval.units}`;
    } else if (interval.lowerLimit != null) {
      referenceDisplay = `> ${interval.lowerLimit} ${interval.units}`;
    } else if (interval.upperLimit != null) {
      referenceDisplay = `< ${interval.upperLimit} ${interval.units}`;
    }
  } else if (interval.dataType === 'Qualitative') {
    referenceDisplay = interval.qualitativeExpected || 'Negative';
  } else {
    referenceDisplay = 'Descriptive observation';
  }

  if (!isVerified && interval.dataType !== 'Text') {
    referenceDisplay += ' (Unverified)';
  }

  // Handle unit mismatch: Never compare values if units differ
  if (unitMismatch) {
    return {
      status: 'UNAVAILABLE',
      statusLabel: 'UNIT MISMATCH',
      badgeStyle: 'unverified',
      arrowSymbol: '',
      isAbnormal: false,
      referenceDisplay,
      unit: unit || interval.units,
      matchedInterval: interval,
      governanceState: 'OWNER_REVIEW_REQUIRED',
      explanation: `Measurement unit (${unit}) does not match reference unit (${interval.units}). Conversion required.`,
      dbFlag: 'Pending'
    };
  }

  // TEXT / DESCRIPTIVE / CULTURE PARAMETERS
  if (interval.dataType === 'Text') {
    return {
      status: 'NOT_APPLICABLE',
      statusLabel: 'DESCRIPTIVE',
      badgeStyle: 'neutral',
      arrowSymbol: '',
      isAbnormal: false,
      referenceDisplay: 'Descriptive observation',
      unit: '',
      matchedInterval: interval,
      governanceState: 'NOT_APPLICABLE_TO_NUMERIC_COMPARISON',
      explanation: 'Observation is qualitative/descriptive and not subject to numeric classification.',
      dbFlag: 'Normal'
    };
  }

  // QUALITATIVE PARAMETERS
  if (interval.dataType === 'Qualitative') {
    const norm = trimmedVal.toLowerCase();
    const expected = (interval.qualitativeExpected || 'Negative').toLowerCase();

    // Check abnormal (e.g. Positive, Reactive, Detected)
    const isAbnormalPositive =
      norm === 'positive' ||
      norm === 'reactive' ||
      norm === 'detected';

    const isNormalNegative =
      norm === 'negative' ||
      norm === 'non-reactive' ||
      norm === 'not detected';

    if (isAbnormalPositive) {
      return {
        status: isVerified ? 'HIGH' : 'UNVERIFIED',
        statusLabel: isVerified ? 'POSITIVE / ABNORMAL' : 'POSITIVE (UNVERIFIED)',
        badgeStyle: 'high',
        arrowSymbol: '',
        isAbnormal: true,
        referenceDisplay,
        unit: '',
        matchedInterval: interval,
        governanceState: isVerified ? 'APPROVED_QUALITATIVE_REFERENCE' : 'OWNER_REVIEW_REQUIRED',
        explanation: 'Qualitative observation deviates from expected reference value.',
        dbFlag: 'Abnormal'
      };
    }

    if (isNormalNegative) {
      return {
        status: isVerified ? 'NORMAL' : 'UNVERIFIED',
        statusLabel: isVerified ? 'NEGATIVE / WITHIN RANGE' : 'NEGATIVE (UNVERIFIED)',
        badgeStyle: 'normal',
        arrowSymbol: '',
        isAbnormal: false,
        referenceDisplay,
        unit: '',
        matchedInterval: interval,
        governanceState: isVerified ? 'APPROVED_QUALITATIVE_REFERENCE' : 'OWNER_REVIEW_REQUIRED',
        explanation: 'Qualitative observation matches expected negative reference value.',
        dbFlag: 'Normal'
      };
    }

    // Unrecognized qualitative text
    return {
      status: 'INVALID',
      statusLabel: 'UNCLASSIFIED',
      badgeStyle: 'neutral',
      arrowSymbol: '',
      isAbnormal: false,
      referenceDisplay,
      unit: '',
      matchedInterval: interval,
      governanceState: 'OWNER_REVIEW_REQUIRED',
      explanation: `Observation "${trimmedVal}" is not recognized as standard qualitative result.`,
      dbFlag: 'Pending'
    };
  }

  // NUMERIC PARAMETERS
  const numValue = Number(trimmedVal);
  if (isNaN(numValue)) {
    return {
      status: 'INVALID',
      statusLabel: 'NON-NUMERIC',
      badgeStyle: 'unverified',
      arrowSymbol: '',
      isAbnormal: false,
      referenceDisplay,
      unit: interval.units,
      matchedInterval: interval,
      governanceState: 'OWNER_REVIEW_REQUIRED',
      explanation: `Entered value "${trimmedVal}" is not a valid number.`,
      dbFlag: 'Pending'
    };
  }

  const { lowerLimit, upperLimit, criticalLow, criticalHigh, borderlineLimits } = interval;

  // 1. Critical Value Check (only if explicitly defined in reference document)
  if (criticalLow !== null && numValue < criticalLow) {
    return {
      status: 'CRITICAL',
      statusLabel: isVerified ? 'CRITICAL LOW' : 'CRITICAL (UNVERIFIED)',
      badgeStyle: 'critical',
      arrowSymbol: '↓',
      isAbnormal: true,
      referenceDisplay,
      unit: interval.units,
      matchedInterval: interval,
      governanceState: isVerified ? 'APPROVED_NUMERIC_RANGE' : 'OWNER_REVIEW_REQUIRED',
      explanation: `Result ${numValue} is below approved critical threshold of ${criticalLow}. Immediate clinical review required.`,
      dbFlag: 'Critical'
    };
  }

  if (criticalHigh !== null && numValue > criticalHigh) {
    return {
      status: 'CRITICAL',
      statusLabel: isVerified ? 'CRITICAL HIGH' : 'CRITICAL (UNVERIFIED)',
      badgeStyle: 'critical',
      arrowSymbol: '↑',
      isAbnormal: true,
      referenceDisplay,
      unit: interval.units,
      matchedInterval: interval,
      governanceState: isVerified ? 'APPROVED_NUMERIC_RANGE' : 'OWNER_REVIEW_REQUIRED',
      explanation: `Result ${numValue} exceeds approved critical threshold of ${criticalHigh}. Immediate clinical review required.`,
      dbFlag: 'Critical'
    };
  }

  // 2. Borderline / Moderate Check (only if explicitly defined in reference document)
  if (borderlineLimits !== null) {
    if (numValue >= borderlineLimits.low && numValue <= borderlineLimits.high) {
      return {
        status: 'BORDERLINE',
        statusLabel: isVerified ? 'BORDERLINE' : 'BORDERLINE (UNVERIFIED)',
        badgeStyle: 'borderline',
        arrowSymbol: '',
        isAbnormal: false,
        referenceDisplay,
        unit: interval.units,
        matchedInterval: interval,
        governanceState: isVerified ? 'APPROVED_NUMERIC_RANGE' : 'OWNER_REVIEW_REQUIRED',
        explanation: `Result falls in source-defined borderline range [${borderlineLimits.low} - ${borderlineLimits.high}].`,
        dbFlag: 'Normal'
      };
    }
  }

  // 3. Standard Interval Comparison [L, U]
  if (lowerLimit !== null && numValue < lowerLimit) {
    return {
      status: isVerified ? 'LOW' : 'UNVERIFIED',
      statusLabel: isVerified ? 'LOW' : 'LOW (UNVERIFIED)',
      badgeStyle: 'low',
      arrowSymbol: '↓',
      isAbnormal: true,
      referenceDisplay,
      unit: interval.units,
      matchedInterval: interval,
      governanceState: isVerified ? 'APPROVED_NUMERIC_RANGE' : 'OWNER_REVIEW_REQUIRED',
      explanation: `Result ${numValue} is below reference interval lower limit (${lowerLimit} ${interval.units}).`,
      dbFlag: 'Low'
    };
  }

  if (upperLimit !== null && numValue > upperLimit) {
    return {
      status: isVerified ? 'HIGH' : 'UNVERIFIED',
      statusLabel: isVerified ? 'HIGH' : 'HIGH (UNVERIFIED)',
      badgeStyle: 'high',
      arrowSymbol: '↑',
      isAbnormal: true,
      referenceDisplay,
      unit: interval.units,
      matchedInterval: interval,
      governanceState: isVerified ? 'APPROVED_NUMERIC_RANGE' : 'OWNER_REVIEW_REQUIRED',
      explanation: `Result ${numValue} exceeds reference interval upper limit (${upperLimit} ${interval.units}).`,
      dbFlag: 'High'
    };
  }

  // 4. Within Reference Range [lowerLimit <= numValue <= upperLimit]
  return {
    status: isVerified ? 'NORMAL' : 'UNVERIFIED',
    statusLabel: isVerified ? 'WITHIN RANGE' : 'WITHIN RANGE (UNVERIFIED)',
    badgeStyle: 'normal',
    arrowSymbol: '',
    isAbnormal: false,
    referenceDisplay,
    unit: interval.units,
    matchedInterval: interval,
    governanceState: isVerified ? 'APPROVED_NUMERIC_RANGE' : 'OWNER_REVIEW_REQUIRED',
    explanation: `Result ${numValue} is within the applicable biological reference interval.`,
    dbFlag: 'Normal'
  };
}
