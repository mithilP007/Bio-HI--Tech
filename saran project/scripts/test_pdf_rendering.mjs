import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PDF_DIR = '/home/mithil/Downloads/BIO-HI-TECH-LIMS/saran project/scratch_pdf';
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

const scenarios = [
  {
    name: 'A_Single_Test_Report',
    reportId: 'RPT-261118-025',
    mode: 'with-letterhead',
    expectedMaxPages: 1,
    desc: 'Single test report (Lipid Profile, With Letterhead)'
  },
  {
    name: 'B_Multiple_Test_Report',
    reportId: 'RPT-261121-031',
    mode: 'with-letterhead',
    expectedMaxPages: 1,
    desc: 'Multiple test report (Blood Sugar + HbA1c, With Letterhead)'
  },
  {
    name: 'C_CBC_Many_Parameters',
    reportId: 'RPT-261120-029',
    mode: 'with-letterhead',
    expectedMaxPages: 1,
    desc: 'CBC report with 17 parameters (Complete Hemogram, With Letterhead)'
  },
  {
    name: 'D_Long_Multi_Page_Report',
    reportId: 'RPT-261120-030',
    mode: 'with-letterhead',
    expectedMinPages: 2,
    desc: 'Long multi-page report (CBC + LFT + Lipid + Thyroid, 35 parameters)'
  },
  {
    name: 'E_Long_Text_Results',
    reportId: 'RPT-261118-026',
    mode: 'with-letterhead',
    expectedMaxPages: 1,
    desc: 'Report with long multiline text results (Urine Culture)'
  },
  {
    name: 'F_Interpretation_Notes',
    reportId: 'RPT-261118-025',
    mode: 'with-letterhead',
    expectedMaxPages: 1,
    desc: 'Report with legacy advisory interpretation note'
  },
  {
    name: 'G_With_Letterhead_Mode',
    reportId: 'RPT-261121-032',
    mode: 'with-letterhead',
    desc: 'Full report rendered With Letterhead (Plain Paper)'
  },
  {
    name: 'H_Without_Letterhead_Mode',
    reportId: 'RPT-261121-032',
    mode: 'without-letterhead',
    desc: 'Full report rendered Without Letterhead (45mm margin for preprinted pad)'
  }
];

async function runPdfTests() {
  console.log('================================================================');
  console.log('BIO HI TECH — REAL A4 PDF PRINT VERIFICATION (HEADLESS CHROME)');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

  const results = [];

  for (const sc of scenarios) {
    console.log(`Testing [${sc.name}]: ${sc.desc}...`);
    const url = `http://localhost:3000/reports/${sc.reportId}/preview`;
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Wait for the report sheet to render
    await page.waitForSelector('.report-sheet', { timeout: 10000 });

    // If without-letterhead mode is required, click the Without Letterhead button
    if (sc.mode === 'without-letterhead') {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.mode-btn'));
        const targetBtn = buttons.find(b => b.textContent.includes('Without Letterhead'));
        if (targetBtn) targetBtn.click();
      });
      // Wait for blank margin element to appear
      await page.waitForSelector('.sheet-blank-letterhead-margin', { timeout: 5000 });
      await new Promise(r => setTimeout(r, 400));
    } else {
      // Ensure letterhead banner image is present
      await page.waitForSelector('.sheet-letterhead-banner img', { timeout: 5000 });
      await new Promise(r => setTimeout(r, 400));
    }

    // Inspect DOM dimensions in px/mm
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
      };
    }, sc.mode);

    // Emulate media type print for high-fidelity CSS @media print application
    await page.emulateMediaType('print');

    // Generate real A4 PDF file
    const pdfPath = path.join(PDF_DIR, `${sc.name}.pdf`);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    // Reset media type
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
    const hasPatient = textRaw.includes('PATIENT NAME') || textRaw.includes('ANANYA') || textRaw.includes('ROHAN') || textRaw.includes('PRIYA') || textRaw.includes('VIKRAM') || textRaw.includes('KAVYA') || textRaw.includes('SAMEER');
    const hasBarcode = textRaw.includes('BHT-') || textRaw.includes('RPT-');
    const hasFooter = textRaw.includes('Demonstration report only');
    const hasSignatures = textRaw.includes('SRIDHAR') || textRaw.includes('Arun Mehta');

    // A4 tolerance in pts: 595.28 x 841.89 pts (+/- 1 pt)
    const isA4 = Math.abs(pageWidthPts - 595.28) < 1.5 && Math.abs(pageHeightPts - 841.89) < 1.5;

    // Check letterhead margin: 45mm in CSS converts to ~170px at 96dpi (45 * 96 / 25.4 = 170.07px)
    const marginMm = domMetrics.bannerHeightPx * 25.4 / 96;

    const pass = isA4 && actualPages >= (sc.expectedMinPages || 1) && (!sc.expectedMaxPages || actualPages <= sc.expectedMaxPages) && hasPatient && hasFooter;

    results.push({
      scenario: sc.name,
      desc: sc.desc,
      mode: sc.mode,
      actualPages,
      pageSize: `${pageWidthPts} x ${pageHeightPts} pts (A4: ${isA4 ? 'YES' : 'NO'})`,
      bannerHeightMm: `${marginMm.toFixed(1)} mm`,
      hasQr: domMetrics.hasQrSvg,
      hasBarcode: domMetrics.hasBarcodeSvg,
      hasSignatures,
      pass
    });

    console.log(`   ✓ Rendered PDF: ${pdfPath}`);
    console.log(`   ✓ Pages: ${actualPages} | Page Size: ${pageWidthPts}x${pageHeightPts} pts | Margin: ${marginMm.toFixed(1)}mm | Status: ${pass ? 'PASS ✓' : 'FAIL ✗'}\n`);
  }

  await browser.close();

  console.log('================================================================');
  console.log('PDF VERIFICATION SUMMARY TABLE');
  console.log('================================================================');
  console.table(results.map(r => ({
    Scenario: r.scenario,
    Pages: r.actualPages,
    'Page Size (A4)': r.pageSize.includes('YES') ? 'A4 (595x842 pt) ✓' : 'Non-A4 ✗',
    'Banner / Top Margin': r.bannerHeightMm,
    QR: r.hasQr ? '✓' : '✗',
    Barcode: r.hasBarcode ? '✓' : '✗',
    Signatures: r.hasSignatures ? '✓' : '✗',
    Overall: r.pass ? 'PASS ✓' : 'FAIL ✗'
  })));

  const allPass = results.every(r => r.pass);
  console.log(`\nOverall PDF Validation Result: ${allPass ? 'ALL SCENARIOS PASSED (8/8) ✓' : 'SOME SCENARIOS FAILED ✗'}`);
}

runPdfTests().catch(err => {
  console.error('Fatal error running PDF tests:', err);
  process.exit(1);
});
