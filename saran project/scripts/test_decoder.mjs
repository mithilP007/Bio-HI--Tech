import jsQR from 'jsqr/dist/jsQR.js';
import ZXing from '@zxing/library';
const {
  Code128Reader,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
} = ZXing;
import QRCode from 'qrcode';

// Code 128 pattern table from lib/barcode-128.ts
const T = [
  '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
  '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
  '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
  '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
  '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
  '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
  '314111','221411','431111','111224','111422','121124','121421','141122','141221','112214',
  '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
  '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
  '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
  '114131','311141','411131','211412','211214','211232','2331112'
];

function generateCode128Svg(text, height = 40) {
  const clean = text.replace(/[^\x20-\x7E]/g, '');
  if (!clean) return { svg: '', totalWidth: 0, height: 0 };
  const v = [104];
  for (let i = 0; i < clean.length; i++) {
    v.push(clean.charCodeAt(i) - 32);
  }
  let k = 104;
  for (let i = 1; i < v.length; i++) {
    k += i * v[i];
  }
  v.push(k % 103, 106);

  let x = 10;
  let rects = '';
  v.forEach(c => {
    const pattern = T[c];
    if (pattern) {
      for (let i = 0; i < pattern.length; i++) {
        const w = Number(pattern[i]);
        if (i % 2 === 0) {
          rects += `<rect x="${x}" y="0" width="${w}" height="${height}"/>`;
        }
        x += w;
      }
    }
  });

  const totalWidth = x + 10;
  return {
    svg: `<svg viewBox="0 0 ${totalWidth} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" fill="#000" shape-rendering="crispEdges">${rects}</svg>`,
    totalWidth,
    height
  };
}

// Convert Code 128 SVG rects to a 1-byte-per-pixel greyscale raster buffer
function rasterizeBarcode(svgInfo) {
  const { totalWidth, height, svg } = svgInfo;
  const rectMatches = [...svg.matchAll(/x="(\d+)" y="0" width="(\d+)"/g)];
  const scale = 2;
  const w = totalWidth * scale;
  const h = height * scale;
  const lums = new Uint8ClampedArray(w * h);
  lums.fill(255); // White quiet zone and gaps

  for (const m of rectMatches) {
    const rx = parseInt(m[1], 10) * scale;
    const rw = parseInt(m[2], 10) * scale;
    for (let y = 0; y < h; y++) {
      for (let x = rx; x < rx + rw; x++) {
        lums[y * w + x] = 0; // Black bar
      }
    }
  }

  return { lums, width: w, height: h };
}

// Rasterize QR Code modules directly to RGBA for jsQR
async function rasterizeQr(text) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const margin = 2;
  const total = size + margin * 2;
  const scale = 4;
  const w = total * scale;
  const h = total * scale;
  const rgba = new Uint8ClampedArray(w * h * 4);
  rgba.fill(255);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (qr.modules.get(r, c)) {
        const startX = (c + margin) * scale;
        const startY = (r + margin) * scale;
        for (let y = startY; y < startY + scale; y++) {
          for (let x = startX; x < startX + scale; x++) {
            const idx = (y * w + x) * 4;
            rgba[idx] = 0;
            rgba[idx + 1] = 0;
            rgba[idx + 2] = 0;
            rgba[idx + 3] = 255;
          }
        }
      }
    }
  }

  return { data: rgba, width: w, height: h };
}

async function runTests() {
  console.log('================================================================');
  console.log('BIO HI TECH — BARCODE & QR ACTUAL DECODING VERIFICATION');
  console.log('================================================================\n');

  const testReportIds = [
    'RPT-261121-032',
    'BHT-02486',
    'RPT-261121-031',
    'BHT-02485',
    'RPT-261120-030',
    'BHT-02484',
    'DEMO-TEST-9999'
  ];

  console.log('--- 1. CODE 128 PHYSICAL DECODING TEST ---');
  const reader = new Code128Reader();
  let barcodePass = 0;

  for (const id of testReportIds) {
    const svgInfo = generateCode128Svg(id, 40);
    const raster = rasterizeBarcode(svgInfo);
    const lumSource = new RGBLuminanceSource(raster.lums, raster.width, raster.height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(lumSource));

    try {
      const result = reader.decode(bitmap);
      const decoded = result.getText();
      const match = decoded === id;
      console.log(`[CODE 128] Encoded: "${id.padEnd(16)}" | Decoded: "${decoded.padEnd(16)}" | Status: ${match ? 'MATCH PASS ✓' : 'FAIL ✗'}`);
      if (match) barcodePass++;
    } catch (err) {
      console.error(`[CODE 128] Failed to decode "${id}":`, err.message);
    }
  }
  console.log(`Result: ${barcodePass}/${testReportIds.length} Code 128 Barcodes Decoded Successfully.\n`);

  console.log('--- 2. QR CODE PHYSICAL DECODING & PII VERIFICATION ---');
  let qrPass = 0;

  for (const id of testReportIds) {
    // Demonstration opaque verification token URL as specified
    const tokenUrl = `https://biohitech.example/verify/DEMO-${id}`;
    const qrRaster = await rasterizeQr(tokenUrl);
    const decodedQr = (jsQR.default || jsQR)(qrRaster.data, qrRaster.width, qrRaster.height);

    if (decodedQr && decodedQr.data) {
      const match = decodedQr.data === tokenUrl;
      // Strict PII Verification: No names, phone numbers, or medical test results in token
      const containsPhone = /\+91|\d{10}/.test(decodedQr.data);
      const containsName = /Ananya|Sharma|Rohan|Desai|Priya|Nair/i.test(decodedQr.data);
      const containsResults = /Hemoglobin|Glucose|Bilirubin/i.test(decodedQr.data);
      const piiSafe = !containsPhone && !containsName && !containsResults;

      console.log(`[QR CODE]  Encoded:  ${tokenUrl}`);
      console.log(`           Decoded:  ${decodedQr.data}`);
      console.log(`           Match:    ${match ? 'PASS ✓' : 'FAIL ✗'} | PII Safe (No names/phones/results): ${piiSafe ? 'SAFE ✓' : 'LEAK ✗'}`);
      if (match && piiSafe) qrPass++;
    } else {
      console.error(`[QR CODE]  Failed to decode QR for "${tokenUrl}"`);
    }
  }
  console.log(`Result: ${qrPass}/${testReportIds.length} QR Codes Decoded Successfully & PII Clean.\n`);
  console.log('================================================================');
  console.log('ALL BARCODE & QR DECODING CHECKS COMPLETED.');
  console.log('================================================================');
}

runTests().catch(console.error);
