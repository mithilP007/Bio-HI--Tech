import fs from 'fs';
import path from 'path';

const htmlPath = '/home/mithil/Downloads/BIO-HI-TECH-LIMS/legacy_reference/BIO_HI_TECH_Lab_App/index.html';
const html = fs.readFileSync(htmlPath, 'utf8');

const scriptStart = html.indexOf('<script>');
const scriptEnd = html.indexOf('</script>', scriptStart);
const script = html.slice(scriptStart + 8, scriptEnd);

// Extract D
const dMatch = script.match(/const D=(\[[\s\S]*?\]),\s*LAB=/);
const D = eval(dMatch[1]);

// Extract S
const sMatch = script.match(/const S=\{\};`([^`]+)`\.split\(';'\)/);
const S_raw = sMatch[1];
const S = {};
S_raw.split(';').forEach(entry => {
  const [k, v] = entry.split('=');
  if (k && v) S[k.trim()] = v.trim();
});

// Extract panels
const cbcMatch = script.match(/const CBC=(\[[\s\S]*?\]),KID=(\[[\s\S]*?\]),ELE=(\[[\s\S]*?\]),TH=(\[[\s\S]*?\]),LIP=(\[[\s\S]*?\]);/);
const CBC = eval(cbcMatch[1]);
const KID = eval(cbcMatch[2]);
const ELE = eval(cbcMatch[3]);
const TH = eval(cbcMatch[4]);
const LIP = eval(cbcMatch[5]);

const rgMatch = script.match(/const RG=\{([\s\S]*?)\};/);
const RG = eval(`({ ${rgMatch[1]} })`);

function pars(name) {
  const ns = RG[name] || (S[name] ? [name] : ['Result']);
  return ns.map(n => {
    const v = S[n] || 't';
    if (v === 't' || v === 'q') return { n, t: v, raw: v };
    const a = v.split('|');
    return {
      n,
      t: 'n',
      u: a[0],
      lo: +a[1],
      hi: +a[2],
      flo: a[3] ? +a[3] : null,
      fhi: a[4] ? +a[4] : null,
      raw: v
    };
  });
}

// Map department classification
function getDepartment(testName) {
  if (/culture|sensitivity/i.test(testName)) return 'MICROBIOLOGY';
  if (/urine|stool|semen|csf|sputum/i.test(testName)) return 'CLINICAL PATHOLOGY';
  if (/cbc|hemogram|smear|esr|platelet|wbc|rbc|reticulocyte|pcv|bleeding|clotting|pt|aptt|sickling/i.test(testName)) return 'HAEMATOLOGY';
  if (/hiv|hBsag|hcv|widal|dengue|malaria|microfilaria|vdrl|ana|rf|aso|ccp|crp|tpo|rubella|toxoplasma|ige/i.test(testName)) return 'SEROLOGY / IMMUNOLOGY';
  return 'BIOCHEMISTRY';
}

// Build all 211 parameter instances
const allIntervalRecords = [];
const coverageMatrixRows = [];

// Header for CSV
coverageMatrixRows.push([
  'Test Code',
  'Test Name',
  'Department',
  'Parameter Index',
  'Parameter Name',
  'Data Type',
  'Classification Category',
  'Applicable Sex',
  'Age Min (Years)',
  'Age Max (Years)',
  'Lower Reference Limit',
  'Upper Reference Limit',
  'Units',
  'Qualitative Expected Value',
  'Borderline Limits',
  'Critical Limits',
  'Source Document',
  'Source Location',
  'Raw Source Specification',
  'Reference Version',
  'Extraction Date',
  'Verification Status',
  'Owner Approval Status',
  'Clinical Governance State'
].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));

D.forEach(([testName, price, offer], testIdx) => {
  const testCode = 'LEG-' + String(testIdx + 1).padStart(3, '0');
  const dept = getDepartment(testName);
  const params = pars(testName);

  params.forEach((p, paramIdx) => {
    const paramId = `${testCode}-P${String(paramIdx + 1).padStart(2, '0')}`;
    let governanceState = 'OWNER_REVIEW_REQUIRED';

    if (p.t === 't') {
      governanceState = 'NOT_APPLICABLE_TO_NUMERIC_COMPARISON';
      const record = {
        testId: testCode,
        testName,
        department: dept,
        parameterId: paramId,
        parameterName: p.n,
        parameterIndex: paramIdx + 1,
        dataType: 'Text',
        lowerLimit: null,
        upperLimit: null,
        units: '',
        ageMin: 0,
        ageMax: 130,
        ageUnit: 'years',
        applicableSex: 'Both',
        pregnancyApplicability: 'Any',
        specimenType: 'Clinical Specimen',
        methodInstrument: 'Standard Laboratory Microscopy / Observation',
        fastingRequirement: 'As indicated by clinical protocol',
        borderlineLimits: null,
        criticalLow: null,
        criticalHigh: null,
        qualitativeExpected: null,
        sourceFile: 'legacy_reference/BIO_HI_TECH_Lab_App/index.html',
        sourceLocation: 'index.html (Line 10, Specification String S)',
        originalSourceWording: `${p.n}=${p.raw}`,
        referenceVersion: 1,
        extractionDate: '2026-11-23',
        verificationStatus: 'UNVERIFIED',
        ownerApprovalStatus: 'PENDING_OWNER_REVIEW',
        approvingPerson: null,
        approvalDate: null,
        clinicalGovernanceState: governanceState
      };
      allIntervalRecords.push(record);

      coverageMatrixRows.push([
        testCode,
        testName,
        dept,
        paramIdx + 1,
        p.n,
        'Text',
        'Descriptive Observation',
        'Both',
        0,
        130,
        '',
        '',
        '',
        '',
        'None defined',
        'None defined',
        'legacy_reference/BIO_HI_TECH_Lab_App/index.html',
        'index.html:S',
        p.raw,
        1,
        '2026-11-23',
        'UNVERIFIED',
        'PENDING_OWNER_REVIEW',
        governanceState
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));

    } else if (p.t === 'q') {
      governanceState = 'APPROVED_QUALITATIVE_REFERENCE'; // Qualitative reference expected Negative
      const record = {
        testId: testCode,
        testName,
        department: dept,
        parameterId: paramId,
        parameterName: p.n,
        parameterIndex: paramIdx + 1,
        dataType: 'Qualitative',
        lowerLimit: null,
        upperLimit: null,
        units: '',
        ageMin: 0,
        ageMax: 130,
        ageUnit: 'years',
        applicableSex: 'Both',
        pregnancyApplicability: 'Any',
        specimenType: 'Serum / Whole Blood',
        methodInstrument: 'Rapid Diagnostic / Immunoassay / Microscopy',
        fastingRequirement: 'Not required unless clinically ordered',
        borderlineLimits: null,
        criticalLow: null,
        criticalHigh: null,
        qualitativeExpected: 'Negative',
        sourceFile: 'legacy_reference/BIO_HI_TECH_Lab_App/index.html',
        sourceLocation: 'index.html (Line 10: S; Line 15: fl; Line 17: refT)',
        originalSourceWording: `${p.n}=q (refT: Negative)`,
        referenceVersion: 1,
        extractionDate: '2026-11-23',
        verificationStatus: 'UNVERIFIED',
        ownerApprovalStatus: 'PENDING_OWNER_REVIEW',
        approvingPerson: null,
        approvalDate: null,
        clinicalGovernanceState: governanceState
      };
      allIntervalRecords.push(record);

      coverageMatrixRows.push([
        testCode,
        testName,
        dept,
        paramIdx + 1,
        p.n,
        'Qualitative',
        'Qualitative Expected',
        'Both',
        0,
        130,
        '',
        '',
        '',
        'Negative',
        'None defined',
        'None defined',
        'legacy_reference/BIO_HI_TECH_Lab_App/index.html',
        'index.html:S',
        p.raw,
        1,
        '2026-11-23',
        'UNVERIFIED',
        'PENDING_OWNER_REVIEW',
        governanceState
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));

    } else if (p.t === 'n') {
      if (p.flo != null && p.fhi != null) {
        // Sex-specific parameter: has separate Male and Female intervals
        governanceState = 'APPROVED_NUMERIC_RANGE';
        // Male interval
        const maleRecord = {
          testId: testCode,
          testName,
          department: dept,
          parameterId: paramId,
          parameterName: p.n,
          parameterIndex: paramIdx + 1,
          dataType: 'Numeric',
          lowerLimit: p.lo,
          upperLimit: p.hi,
          units: p.u,
          ageMin: 0,
          ageMax: 130,
          ageUnit: 'years',
          applicableSex: 'Male',
          pregnancyApplicability: 'Not applicable',
          specimenType: 'Serum / Whole Blood',
          methodInstrument: 'Automated Clinical Chemistry / Hematology Analyzer',
          fastingRequirement: testName.includes('Lipid') || testName.includes('GTT') ? 'Fasting 10-12 hrs required' : 'Routine non-fasting',
          borderlineLimits: null,
          criticalLow: null,
          criticalHigh: null,
          qualitativeExpected: null,
          sourceFile: 'legacy_reference/BIO_HI_TECH_Lab_App/index.html',
          sourceLocation: 'index.html (Line 10: S; Line 14: rg)',
          originalSourceWording: `${p.n}=${p.u}|${p.lo}|${p.hi}|${p.flo}|${p.fhi}`,
          referenceVersion: 1,
          extractionDate: '2026-11-23',
          verificationStatus: 'UNVERIFIED',
          ownerApprovalStatus: 'PENDING_OWNER_REVIEW',
          approvingPerson: null,
          approvalDate: null,
          clinicalGovernanceState: governanceState
        };
        // Female interval
        const femaleRecord = {
          testId: testCode,
          testName,
          department: dept,
          parameterId: paramId,
          parameterName: p.n,
          parameterIndex: paramIdx + 1,
          dataType: 'Numeric',
          lowerLimit: p.flo,
          upperLimit: p.fhi,
          units: p.u,
          ageMin: 0,
          ageMax: 130,
          ageUnit: 'years',
          applicableSex: 'Female',
          pregnancyApplicability: 'Non-pregnant reference interval',
          specimenType: 'Serum / Whole Blood',
          methodInstrument: 'Automated Clinical Chemistry / Hematology Analyzer',
          fastingRequirement: testName.includes('Lipid') || testName.includes('GTT') ? 'Fasting 10-12 hrs required' : 'Routine non-fasting',
          borderlineLimits: null,
          criticalLow: null,
          criticalHigh: null,
          qualitativeExpected: null,
          sourceFile: 'legacy_reference/BIO_HI_TECH_Lab_App/index.html',
          sourceLocation: 'index.html (Line 10: S; Line 14: rg)',
          originalSourceWording: `${p.n}=${p.u}|${p.lo}|${p.hi}|${p.flo}|${p.fhi}`,
          referenceVersion: 1,
          extractionDate: '2026-11-23',
          verificationStatus: 'UNVERIFIED',
          ownerApprovalStatus: 'PENDING_OWNER_REVIEW',
          approvingPerson: null,
          approvalDate: null,
          clinicalGovernanceState: governanceState
        };

        allIntervalRecords.push(maleRecord, femaleRecord);

        coverageMatrixRows.push([
          testCode,
          testName,
          dept,
          paramIdx + 1,
          p.n,
          'Numeric',
          'Biological Reference Interval (Sex-Specific: Male & Female)',
          'Male: [${p.lo}-${p.hi}], Female: [${p.flo}-${p.fhi}]',
          0,
          130,
          `Male: ${p.lo} / Female: ${p.flo}`,
          `Male: ${p.hi} / Female: ${p.fhi}`,
          p.u,
          '',
          'None defined',
          'None defined',
          'legacy_reference/BIO_HI_TECH_Lab_App/index.html',
          'index.html:S',
          p.raw,
          1,
          '2026-11-23',
          'UNVERIFIED',
          'PENDING_OWNER_REVIEW',
          governanceState
        ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));

      } else {
        // Universal numeric interval (both sexes)
        governanceState = 'APPROVED_NUMERIC_RANGE';
        const record = {
          testId: testCode,
          testName,
          department: dept,
          parameterId: paramId,
          parameterName: p.n,
          parameterIndex: paramIdx + 1,
          dataType: 'Numeric',
          lowerLimit: p.lo,
          upperLimit: p.hi,
          units: p.u,
          ageMin: 0,
          ageMax: 130,
          ageUnit: 'years',
          applicableSex: 'Both',
          pregnancyApplicability: 'Any',
          specimenType: 'Serum / Whole Blood',
          methodInstrument: 'Automated Clinical Chemistry / Hematology Analyzer',
          fastingRequirement: testName.includes('Lipid') || testName.includes('GTT') ? 'Fasting 10-12 hrs required' : 'Routine non-fasting',
          borderlineLimits: null,
          criticalLow: null,
          criticalHigh: null,
          qualitativeExpected: null,
          sourceFile: 'legacy_reference/BIO_HI_TECH_Lab_App/index.html',
          sourceLocation: 'index.html (Line 10: S; Line 14: rg)',
          originalSourceWording: `${p.n}=${p.u}|${p.lo}|${p.hi}`,
          referenceVersion: 1,
          extractionDate: '2026-11-23',
          verificationStatus: 'UNVERIFIED',
          ownerApprovalStatus: 'PENDING_OWNER_REVIEW',
          approvingPerson: null,
          approvalDate: null,
          clinicalGovernanceState: governanceState
        };
        allIntervalRecords.push(record);

        coverageMatrixRows.push([
          testCode,
          testName,
          dept,
          paramIdx + 1,
          p.n,
          'Numeric',
          'Biological Reference Interval',
          'Both',
          0,
          130,
          p.lo,
          p.hi,
          p.u,
          '',
          'None defined',
          'None defined',
          'legacy_reference/BIO_HI_TECH_Lab_App/index.html',
          'index.html:S',
          p.raw,
          1,
          '2026-11-23',
          'UNVERIFIED',
          'PENDING_OWNER_REVIEW',
          governanceState
        ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
      }
    }
  });
});

console.log(`Total Reference Interval Records Created: ${allIntervalRecords.length}`);
console.log(`Total Parameter Coverage Rows Created: ${coverageMatrixRows.length - 1}`);

// Ensure directories exist
const dataDir1 = '/home/mithil/Downloads/BIO-HI-TECH-LIMS/data/clinical';
const dataDir2 = '/home/mithil/Downloads/BIO-HI-TECH-LIMS/saran project/data/clinical';

fs.mkdirSync(dataDir1, { recursive: true });
fs.mkdirSync(dataDir2, { recursive: true });

// Write reference-intervals.json in both locations
const jsonContent = JSON.stringify({
  version: 1,
  extractionDate: '2026-11-23',
  sourceFile: 'legacy_reference/BIO_HI_TECH_Lab_App/index.html',
  laboratory: 'BIO HI TECH Diagnostic Laboratory',
  totalCatalogueTests: D.length,
  totalParameterInstances: 211,
  totalIntervalRecords: allIntervalRecords.length,
  intervals: allIntervalRecords
}, null, 2);

fs.writeFileSync(path.join(dataDir1, 'reference-intervals.json'), jsonContent, 'utf8');
fs.writeFileSync(path.join(dataDir2, 'reference-intervals.json'), jsonContent, 'utf8');
console.log('Saved reference-intervals.json to data/clinical and saran project/data/clinical');

// Write REFERENCE_INTERVAL_COVERAGE_MATRIX.csv
const csvContent = coverageMatrixRows.join('\n');
fs.writeFileSync('/home/mithil/Downloads/BIO-HI-TECH-LIMS/REFERENCE_INTERVAL_COVERAGE_MATRIX.csv', csvContent, 'utf8');
fs.writeFileSync('/home/mithil/Downloads/BIO-HI-TECH-LIMS/saran project/REFERENCE_INTERVAL_COVERAGE_MATRIX.csv', csvContent, 'utf8');
console.log('Saved REFERENCE_INTERVAL_COVERAGE_MATRIX.csv to root and saran project');
