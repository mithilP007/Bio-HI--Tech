import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const PDF_DIR = '/home/mithil/Downloads/BIO-HI-TECH-LIMS/saran project/scratch_pdf';
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

const testOwnerEmail = `pdf-test-owner-${Date.now()}@biohitech.test`;
const testOwnerPassword = 'TestPdfPassword123!';
const testPatientId = 'BHT-PDF-001';

const testReports = [
  {
    id: 'RPT-PDF-001',
    patientId: testPatientId,
    testNames: ['Lipid Profile'],
    amount: 405,
    results: {
      'Lipid Profile:Cholesterol': '245',
      'Lipid Profile:Triglycerides': '140',
      'Lipid Profile:HDL Cholesterol': '38',
      'Lipid Profile:LDL Cholesterol': '155',
      'Lipid Profile:VLDL': '28',
      'Lipid Profile:Chol/HDL Ratio': '6.4'
    }
  },
  {
    id: 'RPT-PDF-002',
    patientId: testPatientId,
    testNames: ['Blood Sugar (unspecified)', 'HbA1c', 'HIV'],
    amount: 665,
    results: {
      'Blood Sugar (unspecified):Blood Sugar (unspecified)': '88',
      'HbA1c:HbA1c': '7.9',
      'HIV:HIV': 'Negative'
    }
  },
  {
    id: 'RPT-PDF-003',
    patientId: testPatientId,
    testNames: ['CBC / Hemogram'],
    amount: 250,
    results: {
      'CBC / Hemogram:Hemoglobin': '11.2',
      'CBC / Hemogram:Total WBC Count': '6800',
      'CBC / Hemogram:RBC Count': '4.1',
      'CBC / Hemogram:PCV': '34',
      'CBC / Hemogram:MCV': '83',
      'CBC / Hemogram:MCH': '27.3',
      'CBC / Hemogram:MCHC': '32.9',
      'CBC / Hemogram:Platelet Count': '2.8',
      'CBC / Hemogram:Neutrophils': '62',
      'CBC / Hemogram:Lymphocytes': '30',
      'CBC / Hemogram:Eosinophils': '4',
      'CBC / Hemogram:Monocytes': '4',
      'CBC / Hemogram:Basophils': '0'
    }
  },
  {
    id: 'RPT-PDF-004',
    patientId: testPatientId,
    testNames: ['CBC / Hemogram', 'Liver Function Test (LFT)', 'Lipid Profile', 'Thyroid Profile (T3, T4, TSH)'],
    amount: 1600,
    results: {
      'CBC / Hemogram:Hemoglobin': '11.2',
      'CBC / Hemogram:Total WBC Count': '6800',
      'CBC / Hemogram:RBC Count': '4.1',
      'CBC / Hemogram:PCV': '34',
      'CBC / Hemogram:MCV': '83',
      'CBC / Hemogram:MCH': '27.3',
      'CBC / Hemogram:MCHC': '32.9',
      'CBC / Hemogram:Platelet Count': '2.8',
      'CBC / Hemogram:Neutrophils': '62',
      'CBC / Hemogram:Lymphocytes': '30',
      'CBC / Hemogram:Eosinophils': '4',
      'CBC / Hemogram:Monocytes': '4',
      'CBC / Hemogram:Basophils': '0',
      'Liver Function Test (LFT):Total Bilirubin': '0.9',
      'Liver Function Test (LFT):Direct Bilirubin': '0.2',
      'Liver Function Test (LFT):Indirect Bilirubin': '0.7',
      'Liver Function Test (LFT):SGOT / AST': '32',
      'Liver Function Test (LFT):SGPT / ALT': '28',
      'Liver Function Test (LFT):Alkaline Phosphatase': '110',
      'Liver Function Test (LFT):Protein': '7.2',
      'Liver Function Test (LFT):Albumin': '4.1',
      'Liver Function Test (LFT):Globulin': '3.1',
      'Liver Function Test (LFT):A/G Ratio': '1.3',
      'Lipid Profile:Cholesterol': '210',
      'Lipid Profile:Triglycerides': '135',
      'Lipid Profile:HDL Cholesterol': '52',
      'Lipid Profile:LDL Cholesterol': '131',
      'Lipid Profile:VLDL': '27',
      'Lipid Profile:Chol/HDL Ratio': '4.0',
      'Thyroid Profile (T3, T4, TSH):T3': '1.2',
      'Thyroid Profile (T3, T4, TSH):T4': '8.5',
      'Thyroid Profile (T3, T4, TSH):TSH': '2.4'
    }
  },
  {
    id: 'RPT-PDF-005',
    patientId: testPatientId,
    testNames: ['Urine Culture'],
    amount: 765,
    results: {
      'Urine Culture:Result': 'No pathogenic organism isolated after 48 hours of aerobic incubation at 37°C. Colony count < 10,000 CFU/mL. Specimen: Clean-catch midstream urine.'
    }
  },
  {
    id: 'RPT-PDF-006',
    patientId: testPatientId,
    testNames: ['Lipid Profile'],
    amount: 405,
    results: {
      'Lipid Profile:Cholesterol': '180',
      'Lipid Profile:Triglycerides': '120',
      'Lipid Profile:HDL Cholesterol': '55',
      'Lipid Profile:LDL Cholesterol': '101',
      'Lipid Profile:VLDL': '24',
      'Lipid Profile:Chol/HDL Ratio': '3.3'
    }
  },
  {
    id: 'RPT-PDF-007',
    patientId: testPatientId,
    testNames: ['Blood Sugar (unspecified)'],
    amount: 45,
    results: {
      'Blood Sugar (unspecified):Blood Sugar (unspecified)': '92'
    }
  }
];

const scenarios = [
  {
    name: 'A_Single_Test_LOW_HIGH_NORMAL',
    reportId: 'RPT-PDF-001',
    mode: 'with-letterhead',
    expectedMaxPages: 1,
    desc: 'Single test report (Lipid Profile: LOW, HIGH, NORMAL interpretation)'
  },
  {
    name: 'B_Multiple_Test_Qualitative',
    reportId: 'RPT-PDF-002',
    mode: 'with-letterhead',
    expectedMaxPages: 1,
    desc: 'Multiple test report (Sugar + HbA1c + HIV Qualitative)'
  },
  {
    name: 'C_CBC_Sex_Specific_Ranges',
    reportId: 'RPT-PDF-003',
    mode: 'with-letterhead',
    expectedMaxPages: 1,
    desc: 'CBC report with 13 parameters (Female sex-specific ranges)'
  },
  {
    name: 'D_Long_Multi_Page_Pagination',
    reportId: 'RPT-PDF-004',
    mode: 'with-letterhead',
    expectedMinPages: 2,
    expectedMaxPages: 3,
    desc: 'Long multi-page report (CBC + LFT + Lipid + Thyroid, 32 parameters, multi-page)'
  },
  {
    name: 'E_Long_Text_Microbiology',
    reportId: 'RPT-PDF-005',
    mode: 'with-letterhead',
    expectedMaxPages: 1,
    desc: 'Report with multiline culture descriptive text (Urine Culture)'
  },
  {
    name: 'F_With_Letterhead_Mode',
    reportId: 'RPT-PDF-006',
    mode: 'with-letterhead',
    expectedMaxPages: 1,
    desc: 'Full report rendered With Letterhead (Plain Paper)'
  },
  {
    name: 'G_Without_Letterhead_Mode',
    reportId: 'RPT-PDF-007',
    mode: 'without-letterhead',
    expectedMaxPages: 1,
    desc: 'Full report rendered Without Letterhead (45mm margin for preprinted pad)'
  }
];

async function setupDatabaseFixtures() {
  console.log('--- Provisioning Isolated Synthetic Test Data ---');
  // Clean up any stale active owners or residual test data from previous runs
  await adminClient.from('report_results').delete().in('report_id', testReports.map(r => r.id));
  await adminClient.from('reports').delete().in('id', testReports.map(r => r.id));
  await adminClient.from('patients').delete().eq('id', testPatientId);
  await adminClient.from('owner_access').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await adminClient.from('owner_profile').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 1. Create owner in Supabase Auth
  const { data: ownerUser, error: ownerErr } = await adminClient.auth.admin.createUser({
    email: testOwnerEmail,
    password: testOwnerPassword,
    email_confirm: true,
    user_metadata: { full_name: 'Dr. Arun Kumar', role: 'owner' }
  });
  if (ownerErr) throw ownerErr;
  const ownerId = ownerUser.user.id;

  // 2. Grant owner access
  const { error: accessErr } = await adminClient.from('owner_access').insert({
    id: ownerId,
    email: testOwnerEmail,
    is_active: true,
    role: 'OWNER'
  });
  if (accessErr) throw accessErr;

  const { error: profErr } = await adminClient.from('owner_profile').insert({
    id: ownerId,
    email: testOwnerEmail,
    full_name: 'Dr. Arun Kumar',
    designation: 'Chief Pathologist & Lab Director'
  });
  if (profErr) throw profErr;

  // 3. Create synthetic patient
  const { error: patErr } = await adminClient.from('patients').insert({
    id: testPatientId,
    owner_id: ownerId,
    name: 'ANANYA SHARMA',
    age: 28,
    gender: 'Female',
    phone: '+91 98765 43210',
    doctor: 'DR. S. MEHTA, M.D.',
    date_of_birth: '1998-05-14'
  });
  if (patErr) {
    console.error('Failed to insert test patient:', patErr);
    throw patErr;
  }

  // 4. Create synthetic reports and report results
  for (const rpt of testReports) {
    const { error: rptErr } = await adminClient.from('reports').insert({
      id: rpt.id,
      owner_id: ownerId,
      patient_id: testPatientId,
      status: 'Issued',
      report_date: new Date().toISOString().slice(0, 10),
      payment_status: 'Paid',
      subtotal_amount: rpt.amount,
      final_amount: rpt.amount,
      paid_amount: rpt.amount
    });
    if (rptErr) {
      console.error('Failed to insert test report:', rptErr);
      throw rptErr;
    }

    const resultRows = Object.entries(rpt.results).map(([key, val]) => {
      const parts = key.split(':');
      const testName = parts[0] || '';
      const paramName = parts.slice(1).join(':') || testName;
      return {
        owner_id: ownerId,
        report_id: rpt.id,
        test_name: testName,
        parameter_name: paramName,
        result_value: val,
        unit: '',
        reference_interval: 'Range not verified',
        flag: 'Normal',
        is_abnormal: false
      };
    });

    const { error: resErr } = await adminClient.from('report_results').insert(resultRows);
    if (resErr) {
      console.error('Failed to insert test results:', resErr);
      throw resErr;
    }
  }

  // 5. Sign in to obtain genuine authenticated session JWT
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });
  const { data: signinData, error: signinErr } = await anonClient.auth.signInWithPassword({
    email: testOwnerEmail,
    password: testOwnerPassword
  });
  if (signinErr) throw signinErr;

  console.log(`   ✓ Provisioned test owner: ${ownerId}`);
  console.log(`   ✓ Provisioned synthetic patient: ${testPatientId}`);
  console.log(`   ✓ Provisioned ${testReports.length} synthetic reports with results in database\n`);

  return { ownerId, session: signinData.session };
}

async function teardownDatabaseFixtures(ownerId) {
  console.log('\n--- Teardown Synthetic Test Data ---');
  await adminClient.from('report_results').delete().eq('owner_id', ownerId);
  await adminClient.from('reports').delete().eq('owner_id', ownerId);
  await adminClient.from('patients').delete().eq('owner_id', ownerId);
  await adminClient.from('owner_profile').delete().eq('id', ownerId);
  await adminClient.from('owner_access').delete().eq('id', ownerId);
  await adminClient.auth.admin.deleteUser(ownerId);
  console.log('   ✓ Purged all synthetic test records; operational database clean.\n');
}

async function runPdfTests() {
  console.log('================================================================');
  console.log('BIO HI TECH — REAL A4 PDF PRINT & INTERPRETATION VERIFICATION');
  console.log('================================================================\n');

  const { ownerId, session } = await setupDatabaseFixtures();

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

  page.on('console', msg => console.log('   [Browser Console]', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('   [Browser Error]', err.message));

  // Authenticate test browser as authorized laboratory owner with real JWT session
  await page.evaluateOnNewDocument((authInfo) => {
    localStorage.setItem('bio_hitech_auth_token', JSON.stringify(authInfo.session));
    sessionStorage.setItem('bio_hitech_auth_session', JSON.stringify({
      id: authInfo.ownerId,
      email: authInfo.email,
      fullName: 'Dr. Arun Kumar',
      designation: 'Chief Pathologist & Lab Director'
    }));
  }, { ownerId, email: testOwnerEmail, session });

  const results = [];

  for (const sc of scenarios) {
    console.log(`Testing [${sc.name}]: ${sc.desc}...`);
    const url = `http://localhost:3000/reports/${sc.reportId}/preview`;
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Wait for the report sheet to render
    try {
      await page.waitForSelector('.report-sheet', { timeout: 10000 });
    } catch (err) {
      const bodyText = await page.evaluate(() => document.body.innerText);
      const curUrl = page.url();
      console.error(`\n[PAGE FAILED TO RENDER .report-sheet] URL: ${curUrl}`);
      console.error(`[PAGE INNER TEXT]:\n${bodyText}\n`);
      throw err;
    }

    // If without-letterhead mode is required, click the Without Letterhead button
    if (sc.mode === 'without-letterhead') {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.mode-btn'));
        const targetBtn = buttons.find(b => b.textContent.includes('Without Letterhead'));
        if (targetBtn) targetBtn.click();
      });
      await page.waitForSelector('.sheet-blank-letterhead-margin', { timeout: 5000 });
      await new Promise(r => setTimeout(r, 400));
    } else {
      await page.waitForSelector('.sheet-letterhead-banner img', { timeout: 5000 });
      await new Promise(r => setTimeout(r, 400));
    }

    // Inspect DOM dimensions in px/mm and interpretation badges
    const domMetrics = await page.evaluate((mode) => {
      const sheet = document.querySelector('.report-sheet');
      const letterheadImg = document.querySelector('.sheet-letterhead-banner img');
      const blankMargin = document.querySelector('.sheet-blank-letterhead-margin');
      const qrSvg = document.querySelector('.sheet-patient-table .qr-container svg');
      const barcodeSvg = document.querySelector('.sheet-patient-table .barcode-container svg');
      const footer = document.querySelector('.sheet-footer');
      const sigA = document.querySelector('.sig-img-a');
      const sigB = document.querySelector('.sig-img-b');
      const sheets = document.querySelectorAll('.report-sheet');
      const interpBadges = Array.from(document.querySelectorAll('.interp-badge')).map(b => b.textContent.trim());

      const bannerHeightPx = mode === 'without-letterhead' 
        ? (blankMargin ? blankMargin.getBoundingClientRect().height : 0)
        : (letterheadImg ? letterheadImg.getBoundingClientRect().height : 0);

      return {
        sheetCount: sheets.length,
        sheetWidthPx: sheet ? sheet.getBoundingClientRect().width : 0,
        sheetHeightPx: sheet ? sheet.getBoundingClientRect().height : 0,
        bannerHeightPx,
        hasQrSvg: !!qrSvg,
        hasBarcodeSvg: !!barcodeSvg,
        hasSigA: !!sigA,
        hasSigB: !!sigB,
        footerPresent: !!footer,
        interpBadges
      };
    }, sc.mode);

    // Emulate media type print for CSS @media print application
    await page.emulateMediaType('print');

    // Generate real A4 PDF file
    const pdfPath = path.join(PDF_DIR, `${sc.name}.pdf`);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    await page.emulateMediaType('screen');

    // Analyze generated PDF with pdfinfo
    const infoRaw = execSync(`pdfinfo "${pdfPath}"`).toString();
    const pagesMatch = infoRaw.match(/Pages:\s+(\d+)/);
    const sizeMatch = infoRaw.match(/Page size:\s+([0-9.]+)\s+x\s+([0-9.]+)\s+pts/);
    const actualPages = pagesMatch ? parseInt(pagesMatch[1], 10) : 0;
    const pageWidthPts = sizeMatch ? parseFloat(sizeMatch[1]) : 0;
    const pageHeightPts = sizeMatch ? parseFloat(sizeMatch[2]) : 0;

    // Analyze extracted text with pdftotext
    const textRaw = execSync(`pdftotext "${pdfPath}" -`).toString();
    const hasPatient = textRaw.includes('ANANYA SHARMA');
    const hasBarcode = textRaw.includes('BHT-') || textRaw.includes('RPT-');
    const hasSignatures = textRaw.includes('SRIDHAR');

    // Check interpretation columns and status labels
    const has5ColHeader = textRaw.toLowerCase().includes('interpretation') && textRaw.toLowerCase().includes('reference interval');
    const hasStatusLabels = domMetrics.interpBadges.length > 0;

    // A4 tolerance in pts: 595.28 x 841.89 pts (+/- 1.5 pt)
    const isA4 = Math.abs(pageWidthPts - 595.28) < 1.5 && Math.abs(pageHeightPts - 841.89) < 1.5;
    const marginMm = domMetrics.bannerHeightPx * 25.4 / 96;

    const pass = isA4 &&
      actualPages >= (sc.expectedMinPages || 1) &&
      (!sc.expectedMaxPages || actualPages <= sc.expectedMaxPages) &&
      hasPatient &&
      hasSignatures &&
      has5ColHeader &&
      hasStatusLabels;

    results.push({
      scenario: sc.name,
      desc: sc.desc,
      mode: sc.mode,
      actualPages,
      pageSize: `${pageWidthPts} x ${pageHeightPts} pts (A4: ${isA4 ? 'YES' : 'NO'})`,
      bannerHeightMm: `${marginMm.toFixed(1)} mm`,
      hasQr: domMetrics.hasQrSvg,
      hasBarcode: domMetrics.hasBarcodeSvg,
      has5ColHeader,
      badgesSample: domMetrics.interpBadges.slice(0, 3).join(', '),
      pass
    });

    console.log(`   ✓ Rendered PDF: ${pdfPath}`);
    console.log(`   ✓ Pages: ${actualPages} | Page Size: ${pageWidthPts}x${pageHeightPts} pts | Status: ${pass ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`   ✓ Badges extracted: [${domMetrics.interpBadges.slice(0, 4).join(', ')}] | 5-Col: ${has5ColHeader ? 'YES' : 'NO'}\n`);
  }

  await browser.close();
  await teardownDatabaseFixtures(ownerId);

  console.log('================================================================');
  console.log('PDF & CLINICAL INTERPRETATION VERIFICATION SUMMARY');
  console.log('================================================================');
  console.table(results.map(r => ({
    Scenario: r.scenario,
    Pages: r.actualPages,
    'Page Size (A4)': r.pageSize.includes('YES') ? 'A4 (595x842 pt) ✓' : 'Non-A4 ✗',
    'Banner / Top Margin': r.bannerHeightMm,
    QR: r.hasQr ? '✓' : '✗',
    Barcode: r.hasBarcode ? '✓' : '✗',
    '5-Col Header': r.has5ColHeader ? '✓' : '✗',
    'Status Badges': r.badgesSample,
    Overall: r.pass ? 'PASS ✓' : 'FAIL ✗'
  })));

  const allPass = results.every(r => r.pass);
  console.log(`\nOverall PDF Validation Result: ${allPass ? 'ALL SCENARIOS PASSED (7/7) ✓' : 'SOME SCENARIOS FAILED ✗'}`);
  if (!allPass) process.exit(1);
}

runPdfTests().catch(err => {
  console.error('Fatal error running PDF tests:', err);
  process.exit(1);
});
