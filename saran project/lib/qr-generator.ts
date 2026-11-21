import QRCode from 'qrcode'

/**
 * Offline SVG QR Code generator using standard error correction.
 * Encodes an opaque demonstration verification URL/ID without any sensitive patient PII.
 */
export async function generateQrCodeSvg(data: string): Promise<string> {
  try {
    return await QRCode.toString(data, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
  } catch (error) {
    console.error('Failed to generate QR code SVG:', error)
    return ''
  }
}
