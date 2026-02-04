import QRCode from 'qrcode';
import jsPDF from 'jspdf';

export interface QRCodeOptions {
  tableId: string;
  tenantId: string;
  baseUrl: string;
  qrVersion?: string;
  logoUrl?: string;
}

export interface QRCodeResult {
  pngDataUrl: string;
  pdfBuffer: Buffer;
  qrUrl: string;
  qrVersion: string;
}

/**
 * Generate QR code for table with versioned URL
 */
export async function generateTableQRCode(options: QRCodeOptions): Promise<QRCodeResult> {
  const { tableId, tenantId, baseUrl, qrVersion, logoUrl } = options;
  
  // Generate versioned QR URL
  const currentVersion = qrVersion || generateQRVersion();
  const qrUrl = `${baseUrl}/o/${tenantId}/${tableId}?v=${currentVersion}`;
  
  // Generate QR code as PNG data URL
  const pngDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
  
  // Generate PDF with QR code
  const pdfBuffer = await generateQRCodePDF({
    tableId,
    qrDataUrl: pngDataUrl,
    qrUrl,
    logoUrl,
  });
  
  return {
    pngDataUrl,
    pdfBuffer,
    qrUrl,
    qrVersion: currentVersion,
  };
}

/**
 * Generate PDF with QR code and table information
 */
async function generateQRCodePDF(options: {
  tableId: string;
  qrDataUrl: string;
  qrUrl: string;
  logoUrl?: string;
}): Promise<Buffer> {
  const { tableId, qrDataUrl, qrUrl, logoUrl } = options;
  
  // Create new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Add logo if provided
  if (logoUrl) {
    try {
      // Note: In a real implementation, you'd fetch and convert the logo
      // pdf.addImage(logoData, 'PNG', 20, 20, 40, 20);
    } catch (error) {
      console.warn('Failed to add logo to PDF:', error);
    }
  }
  
  // Add title
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('IOMS Table QR Code', 105, 40, { align: 'center' });
  
  // Add table information
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Table: ${tableId}`, 105, 60, { align: 'center' });
  
  // Add QR code
  const qrSize = 100; // 100mm x 100mm
  const qrX = (210 - qrSize) / 2; // Center on A4 width (210mm)
  const qrY = 80;
  
  // Convert data URL to format jsPDF can use
  const qrImage = qrDataUrl.split(',')[1]; // Remove data:image/png;base64, prefix
  pdf.addImage(qrImage, 'PNG', qrX, qrY, qrSize, qrSize);
  
  // Add instructions
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const instructions = [
    'Scan this QR code with your phone to:',
    '• View menu and place orders',
    '• Call for service',
    '• Request the bill',
    '• Leave feedback',
  ];
  
  let instructionY = qrY + qrSize + 20;
  instructions.forEach((instruction, index) => {
    pdf.text(instruction, 105, instructionY + (index * 8), { align: 'center' });
  });
  
  // Add URL as text (for manual entry if needed)
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('URL: ' + qrUrl, 105, instructionY + 50, { align: 'center' });
  
  // Add footer
  pdf.setFontSize(10);
  pdf.text('Powered by IOMS', 105, 280, { align: 'center' });
  
  // Return PDF as buffer
  const pdfOutput = pdf.output('arraybuffer');
  return Buffer.from(pdfOutput);
}

/**
 * Generate QR version string
 */
function generateQRVersion(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Batch generate QR codes for multiple tables
 */
export async function generateBatchQRCodes(
  tables: Array<{ id: string; label?: string }>,
  options: Omit<QRCodeOptions, 'tableId'>
): Promise<Array<QRCodeResult & { tableId: string; label?: string }>> {
  const results = [];
  
  for (const table of tables) {
    try {
      const qrResult = await generateTableQRCode({
        ...options,
        tableId: table.id,
      });
      
      results.push({
        ...qrResult,
        tableId: table.id,
        label: table.label,
      });
    } catch (error) {
      console.error(`Failed to generate QR code for table ${table.id}:`, error);
      // Continue with other tables
    }
  }
  
  return results;
}

/**
 * Create ZIP archive with all QR codes
 */
export async function createQRCodeZip(
  qrResults: Array<QRCodeResult & { tableId: string; label?: string }>
): Promise<Buffer> {
  // Note: You would need to install 'jszip' package for this
  // const JSZip = require('jszip');
  // const zip = new JSZip();
  
  // qrResults.forEach(result => {
  //   const fileName = `${result.label || result.tableId}-qr`;
  //   zip.file(`${fileName}.png`, result.pngDataUrl.split(',')[1], { base64: true });
  //   zip.file(`${fileName}.pdf`, result.pdfBuffer);
  // });
  
  // return zip.generateAsync({ type: 'nodebuffer' });
  
  // Placeholder implementation
  return Buffer.from('ZIP functionality requires jszip package');
}

export default {
  generateTableQRCode,
  generateBatchQRCodes,
  createQRCodeZip,
};
