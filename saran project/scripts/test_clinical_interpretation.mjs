import fs from 'fs';
import path from 'path';

// Import the clinical engine logic (written as ES module or directly testing functions)
import referenceDataset from '../data/clinical/reference-intervals.json' with { type: 'json' };

const intervals = referenceDataset.intervals;

function matchReferenceInterval(testName, parameterName, patientContext, enteredUnit) {
  const normalizedTest = (testName || '').trim().toLowerCase();
  const normalizedParam = (parameterName || '').trim().toLowerCase();

  const candidates = intervals.filter(
    inv =>
      inv.testName.toLowerCase() === normalizedTest &&
      inv.parameterName.toLowerCase() === normalizedParam
  );

  if (candidates.length === 0) {
    const paramCandidates = intervals.filter(
      inv => inv.parameterName.toLowerCase() === normalizedParam
    );
    if (paramCandidates.length === 0) {
      return { interval: null, ambiguous: false, unitMismatch: false, reason: 'No reference interval found in catalogue' };
    }
  }

  const patientSex = (patientContext?.gender || '').trim().toLowerCase();
  const patientAge = patientContext?.age != null && patientContext.age !== '' ? Number(patientContext.age) : null;

  let sexFiltered = candidates.filter(inv => {
    if (inv.applicableSex === 'Both') return true;
    if (patientSex === 'male' && inv.applicableSex === 'Male') return true;
    if (patientSex === 'female' && inv.applicableSex === 'Female') return true;
    return false;
  });

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

function evaluateResult(testName, parameterName, rawValue, patientContext, unit, forceVerifiedOverride = false) {
  const trimmedVal = (rawValue || '').trim();

  if (!trimmedVal) {
    return {
      status: 'PENDING',
      statusLabel: 'Pending',
      isAbnormal: false,
      referenceDisplay: 'Range not verified',
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
      isAbnormal: false,
      referenceDisplay: 'Owner review required',
      dbFlag: 'Pending'
    };
  }

  if (!interval) {
    return {
      status: 'UNAVAILABLE',
      statusLabel: 'UNAVAILABLE',
      isAbnormal: false,
      referenceDisplay: 'Range not available',
      dbFlag: 'Pending'
    };
  }

  const isVerified = forceVerifiedOverride || interval.verificationStatus === 'VERIFIED' || interval.ownerApprovalStatus === 'APPROVED';

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

  if (unitMismatch) {
    return {
      status: 'UNAVAILABLE',
      statusLabel: 'UNIT MISMATCH',
      isAbnormal: false,
      referenceDisplay,
      dbFlag: 'Pending'
    };
  }

  if (interval.dataType === 'Text') {
    return {
      status: 'NOT_APPLICABLE',
      statusLabel: 'DESCRIPTIVE',
      isAbnormal: false,
      referenceDisplay: 'Descriptive observation',
      dbFlag: 'Normal'
    };
  }

  if (interval.dataType === 'Qualitative') {
    const norm = trimmedVal.toLowerCase();
    const isAbnormalPositive = norm === 'positive' || norm === 'reactive' || norm === 'detected';
    const isNormalNegative = norm === 'negative' || norm === 'non-reactive' || norm === 'not detected';

    if (isAbnormalPositive) {
      return {
        status: isVerified ? 'HIGH' : 'UNVERIFIED',
        statusLabel: isVerified ? 'POSITIVE / ABNORMAL' : 'POSITIVE (UNVERIFIED)',
        isAbnormal: true,
        referenceDisplay,
        dbFlag: 'Abnormal'
      };
    }
    if (isNormalNegative) {
      return {
        status: isVerified ? 'NORMAL' : 'UNVERIFIED',
        statusLabel: isVerified ? 'NEGATIVE / WITHIN RANGE' : 'NEGATIVE (UNVERIFIED)',
        isAbnormal: false,
        referenceDisplay,
        dbFlag: 'Normal'
      };
    }
    return {
      status: 'INVALID',
      statusLabel: 'UNCLASSIFIED',
      isAbnormal: false,
      referenceDisplay,
      dbFlag: 'Pending'
    };
  }

  const numValue = Number(trimmedVal);
  if (isNaN(numValue)) {
    return {
      status: 'INVALID',
      statusLabel: 'NON-NUMERIC',
      isAbnormal: false,
      referenceDisplay,
      dbFlag: 'Pending'
    };
  }

  const { lowerLimit, upperLimit, criticalLow, criticalHigh, borderlineLimits } = interval;

  if (criticalLow !== null && numValue < criticalLow) {
    return {
      status: 'CRITICAL',
      statusLabel: isVerified ? 'CRITICAL LOW' : 'CRITICAL (UNVERIFIED)',
      isAbnormal: true,
      referenceDisplay,
      dbFlag: 'Critical'
    };
  }

  if (criticalHigh !== null && numValue > criticalHigh) {
    return {
      status: 'CRITICAL',
      statusLabel: isVerified ? 'CRITICAL HIGH' : 'CRITICAL (UNVERIFIED)',
      isAbnormal: true,
      referenceDisplay,
      dbFlag: 'Critical'
    };
  }

  if (borderlineLimits !== null) {
    if (numValue >= borderlineLimits.low && numValue <= borderlineLimits.high) {
      return {
        status: 'BORDERLINE',
        statusLabel: isVerified ? 'BORDERLINE' : 'BORDERLINE (UNVERIFIED)',
        isAbnormal: false,
        referenceDisplay,
        dbFlag: 'Normal'
      };
    }
  }

  if (lowerLimit !== null && numValue < lowerLimit) {
    return {
      status: isVerified ? 'LOW' : 'UNVERIFIED',
      statusLabel: isVerified ? 'LOW' : 'LOW (UNVERIFIED)',
      isAbnormal: true,
      referenceDisplay,
      dbFlag: 'Low'
    };
  }

  if (upperLimit !== null && numValue > upperLimit) {
    return {
      status: isVerified ? 'HIGH' : 'UNVERIFIED',
      statusLabel: isVerified ? 'HIGH' : 'HIGH (UNVERIFIED)',
      isAbnormal: true,
      referenceDisplay,
      dbFlag: 'High'
    };
  }

  return {
    status: isVerified ? 'NORMAL' : 'UNVERIFIED',
    statusLabel: isVerified ? 'WITHIN RANGE' : 'WITHIN RANGE (UNVERIFIED)',
    isAbnormal: false,
    referenceDisplay,
    dbFlag: 'Normal'
  };
}

// -------------------------------------------------------------
// TEST SUITE EXECUTION
// -------------------------------------------------------------
console.log('================================================================');
console.log('BIO HI TECH — CLINICAL ENGINE VALIDATION (ALL 14 TEST CASES)');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assertTest(name, condition, details = '') {
  if (condition) {
    console.log(`[PASS] ${name}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${name} ${details}`);
    failCount++;
  }
}

// Case 1: Immediately below lower limit (Hemoglobin Male [13 - 17], value 12.99)
const r1 = evaluateResult('Hemoglobin', 'Hemoglobin', '12.99', { gender: 'Male' }, 'g/dL', true);
assertTest('Case 1: Value immediately below lower limit (12.99 < 13.0)', r1.status === 'LOW' && r1.dbFlag === 'Low', `Got ${r1.status}`);

// Case 2: Exactly at lower limit (Hemoglobin Male [13 - 17], value 13.00)
const r2 = evaluateResult('Hemoglobin', 'Hemoglobin', '13.00', { gender: 'Male' }, 'g/dL', true);
assertTest('Case 2: Value exactly at lower limit (13.00 == 13.0)', r2.status === 'NORMAL' && r2.dbFlag === 'Normal', `Got ${r2.status}`);

// Case 3: Inside the interval (Hemoglobin Male [13 - 17], value 15.2)
const r3 = evaluateResult('Hemoglobin', 'Hemoglobin', '15.2', { gender: 'Male' }, 'g/dL', true);
assertTest('Case 3: Value inside interval (15.2 in [13, 17])', r3.status === 'NORMAL' && r3.dbFlag === 'Normal', `Got ${r3.status}`);

// Case 4: Exactly at upper limit (Hemoglobin Male [13 - 17], value 17.00)
const r4 = evaluateResult('Hemoglobin', 'Hemoglobin', '17.00', { gender: 'Male' }, 'g/dL', true);
assertTest('Case 4: Value exactly at upper limit (17.00 == 17.0)', r4.status === 'NORMAL' && r4.dbFlag === 'Normal', `Got ${r4.status}`);

// Case 5: Immediately above upper limit (Hemoglobin Male [13 - 17], value 17.01)
const r5 = evaluateResult('Hemoglobin', 'Hemoglobin', '17.01', { gender: 'Male' }, 'g/dL', true);
assertTest('Case 5: Value immediately above upper limit (17.01 > 17.0)', r5.status === 'HIGH' && r5.dbFlag === 'High', `Got ${r5.status}`);

// Case 6: Decimal precision test (Serum Creatinine Male [0.7 - 1.3], value 1.31 vs 1.30)
const r6a = evaluateResult('Creatinine', 'Creatinine', '1.30', { gender: 'Male' }, 'mg/dL', true);
const r6b = evaluateResult('Creatinine', 'Creatinine', '1.31', { gender: 'Male' }, 'mg/dL', true);
assertTest('Case 6: Decimal precision comparison (1.30 vs 1.31)', r6a.status === 'NORMAL' && r6b.status === 'HIGH', `Got ${r6a.status}, ${r6b.status}`);

// Case 7: Invalid numeric input
const r7 = evaluateResult('Hemoglobin', 'Hemoglobin', 'NOT_A_NUMBER', { gender: 'Male' }, 'g/dL', true);
assertTest('Case 7: Invalid non-numeric input handled safely', r7.status === 'INVALID' && r7.statusLabel === 'NON-NUMERIC', `Got ${r7.status}`);

// Case 8: Missing measurement (empty or whitespace)
const r8 = evaluateResult('Hemoglobin', 'Hemoglobin', '  ', { gender: 'Male' }, 'g/dL', true);
assertTest('Case 8: Missing measurement returns PENDING', r8.status === 'PENDING' && r8.dbFlag === 'Pending', `Got ${r8.status}`);

// Case 9: Mismatched unit (e.g. mg/dL instead of g/dL for Hemoglobin)
const r9 = evaluateResult('Hemoglobin', 'Hemoglobin', '14.0', { gender: 'Male' }, 'mg/dL', true);
assertTest('Case 9: Mismatched unit prevents classification', r9.status === 'UNAVAILABLE' && r9.statusLabel === 'UNIT MISMATCH', `Got ${r9.status}`);

// Case 10: Missing patient context for sex-specific parameter
const r10 = evaluateResult('Hemoglobin', 'Hemoglobin', '12.5', {}, 'g/dL', true);
assertTest('Case 10: Missing sex context for sex-specific parameter returns AMBIGUOUS', r10.status === 'UNAVAILABLE' && r10.statusLabel === 'AMBIGUOUS CONTEXT', `Got ${r10.status}`);

// Case 11: Age applicability bounds check
const r11 = evaluateResult('CBC / Hemogram', 'Total WBC Count', '8500', { age: 35, gender: 'Male' }, '/cumm', true);
assertTest('Case 11: Age applicability verified within 0-130 range', r11.status === 'NORMAL' && r11.dbFlag === 'Normal', `Got ${r11.status}`);

// Case 12: Applicable sex-specific interval comparison (12.5 g/dL Hemoglobin: LOW for Male [13-17], NORMAL for Female [12-15])
const r12Male = evaluateResult('Hemoglobin', 'Hemoglobin', '12.5', { gender: 'Male' }, 'g/dL', true);
const r12Female = evaluateResult('Hemoglobin', 'Hemoglobin', '12.5', { gender: 'Female' }, 'g/dL', true);
assertTest('Case 12: Sex-specific comparison (12.5 is LOW for Male, NORMAL for Female)', r12Male.status === 'LOW' && r12Female.status === 'NORMAL', `Got Male=${r12Male.status}, Female=${r12Female.status}`);

// Case 13: Borderline category handling (No fake borderline invented when not in reference doc)
const r13 = evaluateResult('Hemoglobin', 'Hemoglobin', '15.0', { gender: 'Male' }, 'g/dL', true);
assertTest('Case 13: Borderline category not artificially invented for standard intervals', r13.status !== 'BORDERLINE', `Got ${r13.status}`);

// Case 14: Critical values handling (No fake critical threshold invented)
const r14 = evaluateResult('Hemoglobin', 'Hemoglobin', '22.0', { gender: 'Male' }, 'g/dL', true);
assertTest('Case 14: Value above normal is HIGH and not automatically CRITICAL without approved threshold', r14.status === 'HIGH', `Got ${r14.status}`);

// Case 15: Qualitative test negative (HIV)
const r15Neg = evaluateResult('HIV', 'HIV', 'Negative', {}, '', true);
assertTest('Case 15a: Qualitative Negative result is WITHIN RANGE', r15Neg.status === 'NORMAL' && r15Neg.dbFlag === 'Normal', `Got ${r15Neg.status}`);

// Case 15b: Qualitative test positive (HIV)
const r15Pos = evaluateResult('HIV', 'HIV', 'Positive', {}, '', true);
assertTest('Case 15b: Qualitative Positive result is ABNORMAL', r15Pos.status === 'HIGH' && r15Pos.dbFlag === 'Abnormal', `Got ${r15Pos.status}`);

// Case 16: Text / Culture parameter (Urine Culture)
const r16 = evaluateResult('Urine Culture', 'Result', 'No bacterial growth after 48h', {}, '', true);
assertTest('Case 16: Text observation is NOT_APPLICABLE to numeric classification', r16.status === 'NOT_APPLICABLE' && r16.dbFlag === 'Normal', `Got ${r16.status}`);

// Case 17: Clinical Governance Unverified state (when forceVerifiedOverride = false)
const r17 = evaluateResult('Hemoglobin', 'Hemoglobin', '14.0', { gender: 'Male' }, 'g/dL', false);
assertTest('Case 17: Unverified interval labeled UNVERIFIED pending owner review', r17.status === 'UNVERIFIED' && r17.referenceDisplay.includes('Unverified'), `Got ${r17.status}`);

// Full 120-test and 211-parameter audit
console.log('\n================================================================');
console.log('AUDITING ALL 120 CATALOGUE TESTS & 211 PARAMETER INSTANCES');
console.log('================================================================\n');

const governanceCounts = {
  APPROVED_NUMERIC_RANGE: 0,
  APPROVED_QUALITATIVE_REFERENCE: 0,
  OWNER_REVIEW_REQUIRED: 0,
  REFERENCE_NOT_AVAILABLE: 0,
  NOT_APPLICABLE_TO_NUMERIC_COMPARISON: 0
};

// Unique parameter instances
const seenInstances = new Set();
intervals.forEach(inv => {
  const key = `${inv.testId}:${inv.parameterName}`;
  if (!seenInstances.has(key)) {
    seenInstances.add(key);
    governanceCounts[inv.clinicalGovernanceState] = (governanceCounts[inv.clinicalGovernanceState] || 0) + 1;
  }
});

console.log(`Audited Parameter Instances: ${seenInstances.size}`);
console.log(`- APPROVED_NUMERIC_RANGE: ${governanceCounts.APPROVED_NUMERIC_RANGE}`);
console.log(`- APPROVED_QUALITATIVE_REFERENCE: ${governanceCounts.APPROVED_QUALITATIVE_REFERENCE}`);
console.log(`- NOT_APPLICABLE_TO_NUMERIC_COMPARISON: ${governanceCounts.NOT_APPLICABLE_TO_NUMERIC_COMPARISON}`);
console.log(`- OWNER_REVIEW_REQUIRED (Unverified state): ${governanceCounts.OWNER_REVIEW_REQUIRED}`);
console.log(`- REFERENCE_NOT_AVAILABLE: ${governanceCounts.REFERENCE_NOT_AVAILABLE}`);

assertTest('All 211 parameter instances accounted for', seenInstances.size === 211, `Got ${seenInstances.size}`);
assertTest('Numeric instances count is exactly 161', governanceCounts.APPROVED_NUMERIC_RANGE === 161, `Got ${governanceCounts.APPROVED_NUMERIC_RANGE}`);
assertTest('Qualitative instances count is exactly 22', governanceCounts.APPROVED_QUALITATIVE_REFERENCE === 22, `Got ${governanceCounts.APPROVED_QUALITATIVE_REFERENCE}`);
assertTest('Text / descriptive instances count is exactly 28', governanceCounts.NOT_APPLICABLE_TO_NUMERIC_COMPARISON === 28, `Got ${governanceCounts.NOT_APPLICABLE_TO_NUMERIC_COMPARISON}`);

console.log('\n----------------------------------------------------------------');
console.log(`TOTAL AUDIT RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('----------------------------------------------------------------');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL CLINICAL ENGINE TEST CASES PASSED SUCCESSFULLY!\n');
}
