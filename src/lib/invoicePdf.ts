import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import QRCode from 'qrcode';

export type InvoicePdfBusiness = {
  business_name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  gst_number?: string | null;
  upi_id?: string | null;
  logo_url?: string | null;
};

export type InvoicePdfCustomer = {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  gst_number?: string | null;
};

export type InvoicePdfLine = {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type InvoicePdfData = {
  invoiceNumber: string;
  createdAt: string | Date;
  jobTitle?: string | null;
  serviceType?: string | null;
  business: InvoicePdfBusiness;
  customer: InvoicePdfCustomer;
  serviceCharge: number;
  parts: InvoicePdfLine[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  isPaid: boolean;
  paymentLinkUrl?: string | null;
  notes?: string | null;
};

const inr = (n: number) =>
  'Rs. ' +
  Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const PRIMARY: [number, number, number] = [234, 88, 12]; // orange-600, matches brand
const ACCENT: [number, number, number] = [13, 47, 92];
const MUTED: [number, number, number] = [100, 116, 139];
const LIGHT: [number, number, number] = [243, 244, 246];

async function imageUrlToDataUrl(url: string): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' } | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const fmt = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        resolve({ dataUrl, format: fmt });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function monogram(name?: string | null): string {
  if (!name) return 'FF';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('') || 'FF';
}

function buildUpiUri(upiId: string, name: string, amount: number, note: string): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;

  // Top accent bar with subtle gradient stripes
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 10, 'F');
  doc.setFillColor(...ACCENT);
  doc.rect(0, 10, pageW, 2, 'F');

  // Logo or monogram
  const logoSize = 52;
  const logoX = margin;
  const logoY = 28;
  let logoLoaded = false;
  if (data.business.logo_url) {
    const img = await imageUrlToDataUrl(data.business.logo_url);
    if (img) {
      try {
        doc.addImage(img.dataUrl, img.format, logoX, logoY, logoSize, logoSize);
        logoLoaded = true;
      } catch {
        logoLoaded = false;
      }
    }
  }
  if (!logoLoaded) {
    doc.setFillColor(...PRIMARY);
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 10, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text(monogram(data.business.business_name), logoX + logoSize / 2, logoY + logoSize / 2 + 7, { align: 'center' });
  }

  // Brand text block
  const brandX = logoX + logoSize + 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...ACCENT);
  doc.text(data.business.business_name || 'Field Service Business', brandX, logoY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const bizLines = [
    data.business.address,
    [data.business.city, data.business.state, data.business.pincode].filter(Boolean).join(', '),
    [data.business.phone && `Ph: ${data.business.phone}`, data.business.email].filter(Boolean).join('  |  '),
    data.business.gst_number && `GSTIN: ${data.business.gst_number}`,
  ].filter(Boolean) as string[];
  bizLines.forEach((line, i) => doc.text(line, brandX, logoY + 32 + i * 11));

  // Invoice meta box (right)
  const metaW = 200;
  const metaX = pageW - margin - metaW;
  const metaY = 28;
  doc.setFillColor(...ACCENT);
  doc.roundedRect(metaX, metaY, metaW, 28, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', metaX + 12, metaY + 19);

  doc.setFillColor(...LIGHT);
  doc.roundedRect(metaX, metaY + 30, metaW, 50, 6, 6, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('Invoice #', metaX + 12, metaY + 46);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text(data.invoiceNumber, metaX + 70, metaY + 46);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text('Date', metaX + 12, metaY + 62);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text(format(new Date(data.createdAt), 'dd MMM yyyy'), metaX + 70, metaY + 62);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text('Status', metaX + 12, metaY + 76);
  doc.setFont('helvetica', 'bold');
  if (data.isPaid) {
    doc.setTextColor(22, 163, 74);
    doc.text('PAID', metaX + 70, metaY + 76);
  } else {
    doc.setTextColor(217, 119, 6);
    doc.text('UNPAID', metaX + 70, metaY + 76);
  }

  // Bill-to block
  let y = 165;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageW - margin, y);
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text('BILL TO', margin, y);
  doc.text('SERVICE', pageW / 2, y);

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text(data.customer.name || 'Customer', margin, y);
  doc.text(data.jobTitle || 'Service job', pageW / 2, y);

  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const custLines = [
    data.customer.phone && `Ph: ${data.customer.phone}`,
    data.customer.address,
    [data.customer.city].filter(Boolean).join(', '),
    data.customer.gst_number && `GSTIN: ${data.customer.gst_number}`,
  ].filter(Boolean) as string[];
  custLines.forEach((line, i) => doc.text(line, margin, y + i * 11));
  if (data.serviceType) doc.text(`Type: ${data.serviceType}`, pageW / 2, y);

  // Line items
  const tableY = y + Math.max(custLines.length * 11, 20) + 18;
  const rows: (string | number)[][] = [];
  if (data.serviceCharge > 0) {
    rows.push(['Service charge', '1', inr(data.serviceCharge), inr(data.serviceCharge)]);
  }
  data.parts.forEach(p =>
    rows.push([p.name, String(p.quantity), inr(Number(p.unit_price)), inr(Number(p.total))]),
  );

  autoTable(doc, {
    startY: tableY,
    head: [['Description', 'Qty', 'Unit price', 'Amount']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: 'bold', fontSize: 10, cellPadding: 8 },
    bodyStyles: { fontSize: 10, textColor: [30, 41, 59], cellPadding: 7 },
    alternateRowStyles: { fillColor: [250, 250, 251] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 50 },
      2: { halign: 'right', cellWidth: 90 },
      3: { halign: 'right', cellWidth: 90 },
    },
    margin: { left: margin, right: margin },
  });

  // Totals
  // @ts-expect-error injected by autoTable
  let afterY = doc.lastAutoTable.finalY + 14;
  const totalsX = pageW - margin - 220;
  const totalsW = 220;

  const totalRow = (label: string, value: string, opts?: { bold?: boolean; bg?: boolean }) => {
    if (opts?.bg) {
      doc.setFillColor(...LIGHT);
      doc.rect(totalsX, afterY - 12, totalsW, 22, 'F');
    }
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    doc.setFontSize(opts?.bold ? 11 : 10);
    doc.setTextColor(...ACCENT);
    doc.text(label, totalsX + 8, afterY);
    doc.text(value, totalsX + totalsW - 8, afterY, { align: 'right' });
    afterY += 18;
  };

  totalRow('Subtotal', inr(data.subtotal));
  totalRow(`GST @ ${data.gstRate}%`, inr(data.gstAmount));
  afterY += 4;
  totalRow('TOTAL', inr(data.total), { bold: true, bg: true });

  // Payment info with UPI QR
  afterY += 16;
  if (!data.isPaid && (data.business.upi_id || data.paymentLinkUrl)) {
    const boxH = 96;
    doc.setFillColor(255, 247, 237);
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, afterY, pageW - margin * 2, boxH, 8, 8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY);
    doc.text('SCAN & PAY', margin + 14, afterY + 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...ACCENT);
    let py = afterY + 38;
    if (data.business.upi_id) {
      doc.setFont('helvetica', 'bold');
      doc.text('UPI ID', margin + 14, py);
      doc.setFont('helvetica', 'normal');
      doc.text(data.business.upi_id, margin + 60, py);
      py += 14;
    }
    if (data.paymentLinkUrl) {
      doc.setFont('helvetica', 'bold');
      doc.text('Online', margin + 14, py);
      doc.setFont('helvetica', 'normal');
      doc.text(data.paymentLinkUrl, margin + 60, py, { maxWidth: pageW - margin * 2 - 180 });
      py += 14;
    }
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Reference: ${data.invoiceNumber}`, margin + 14, afterY + boxH - 12);

    // QR code on the right of the box
    if (data.business.upi_id) {
      try {
        const upiUri = buildUpiUri(
          data.business.upi_id,
          data.business.business_name || 'Payment',
          data.total,
          data.invoiceNumber,
        );
        const qrDataUrl = await QRCode.toDataURL(upiUri, { margin: 0, width: 240 });
        const qrSize = 76;
        const qrX = pageW - margin - qrSize - 14;
        const qrY = afterY + (boxH - qrSize) / 2;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 4, 4, 'F');
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      } catch {
        // ignore QR failures
      }
    }
    afterY += boxH + 12;
  }

  // Signature line
  const sigY = pageH - 90;
  if (afterY < sigY - 20) {
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(pageW - margin - 160, sigY, pageW - margin, sigY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text('Authorised signatory', pageW - margin - 80, sigY + 12, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ACCENT);
    doc.text(
      `for ${data.business.business_name || 'Field Service Business'}`,
      pageW - margin - 80,
      sigY + 24,
      { align: 'center' },
    );
  }

  if (data.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text('NOTES', margin, afterY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...ACCENT);
    const wrapped = doc.splitTextToSize(data.notes, pageW - margin * 2);
    doc.text(wrapped, margin, afterY + 14);
  }

  // Diagonal status watermark
  doc.saveGraphicsState();
  // @ts-expect-error jsPDF GState typing
  doc.setGState(new doc.GState({ opacity: 0.06 }));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(120);
  if (data.isPaid) {
    doc.setTextColor(22, 163, 74);
    doc.text('PAID', pageW / 2, pageH / 2 + 40, { align: 'center', angle: -22 });
  } else {
    doc.setTextColor(...PRIMARY);
    doc.text('UNPAID', pageW / 2, pageH / 2 + 40, { align: 'center', angle: -22 });
  }
  doc.restoreGraphicsState();

  // Footer
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, pageH - 50, pageW - margin, pageH - 50);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    'Thank you for your business. This is a computer-generated invoice and does not require a signature.',
    pageW / 2,
    pageH - 32,
    { align: 'center' },
  );
  doc.setFillColor(...PRIMARY);
  doc.rect(0, pageH - 6, pageW, 6, 'F');

  return doc;
}

export async function downloadInvoicePdf(data: InvoicePdfData) {
  const doc = await generateInvoicePdf(data);
  doc.save(`${data.invoiceNumber}.pdf`);
}

export async function openInvoicePdf(data: InvoicePdfData) {
  const doc = await generateInvoicePdf(data);
  window.open(doc.output('bloburl'), '_blank');
}