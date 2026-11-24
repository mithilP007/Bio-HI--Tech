import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface DownloadPdfOptions {
  filename?: string;
  onProgress?: (status: string) => void;
}

/**
 * Generates and downloads a real physical A4 PDF file directly from the rendered report DOM.
 * Does NOT call window.print(); produces an authentic .pdf file saved to the user's downloads.
 */
export async function downloadReportPdf(
  reportId: string,
  options?: DownloadPdfOptions
): Promise<boolean> {
  const onProgress = options?.onProgress || (() => {});
  onProgress('Preparing A4 PDF export...');

  // 1. Locate report sheet pages in the DOM
  const sheetContainer = document.getElementById('printable-report');
  let pageElements = Array.from(document.querySelectorAll<HTMLElement>('.report-sheet'));

  if (!pageElements.length && sheetContainer) {
    pageElements = [sheetContainer];
  }

  if (!pageElements.length) {
    throw new Error('Report print sheet is not rendered in DOM. Open the report preview before downloading.');
  }

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const totalPages = pageElements.length;

    // Ensure all fonts and images are fully decoded and ready before capture
    if (typeof document !== 'undefined') {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('#printable-report img, .report-sheet img'));
      await Promise.all(
        imgs.map(async (img) => {
          if (!img.complete) {
            await new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          }
          if (typeof img.decode === 'function') {
            try {
              await img.decode();
            } catch {
              // Ignore decode error if already rendered
            }
          }
        })
      );
    }

    for (let i = 0; i < totalPages; i++) {
      const pageEl = pageElements[i];
      onProgress(`Rendering page ${i + 1} of ${totalPages}...`);

      // Ensure elements are visible during capture
      const originalDisplay = pageEl.style.display;
      if (window.getComputedStyle(pageEl).display === 'none') {
        pageEl.style.display = 'block';
      }

      const canvas = await html2canvas(pageEl, {
        scale: 2, // 2x retina scale for crisp typography and sharp barcodes
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794, // Standard A4 at 96 DPI (210mm)
      });

      pageEl.style.display = originalDisplay;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) {
        doc.addPage('a4', 'portrait');
      }

      // Exact A4 dimensions in mm: 210 x 297
      doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    const defaultName = reportId.startsWith('RPT-') ? `BIO-HI-TECH-${reportId}.pdf` : `BIO-HI-TECH-RPT-${reportId}.pdf`;
    const outputName = options?.filename || defaultName;
    onProgress('Saving PDF file...');
    doc.save(outputName);
    onProgress('Download complete.');
    return true;
  } catch (error) {
    console.error('[downloadReportPdf] Failed to generate PDF:', error);
    throw error instanceof Error ? error : new Error('Failed to generate PDF file.');
  }
}
