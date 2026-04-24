import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

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

export function generateInvoicePdf(data: InvoicePdfData): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;

  // Header bar
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 8, 'F');

  // Brand block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...ACCENT);
  doc.text(data.business.business_name || 'Field Service Business', margin, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const bizLines = [
    data.business.address,
    [data.business.city, data.business.state, data.business.pincode].filter(Boolean).join(', '),
    [data.business.phone && `Ph: ${data.business.phone}`, data.business.email].filter(Boolean).join('  |  '),
    data.business.gst_number && `GSTIN: ${data.business.gst_number}`,
  ].filter(Boolean) as string[];
  bizLines.forEach((line, i) => doc.text(line, margin, 66 + i * 12));

  // Invoice meta box (right)
  const metaX = pageW - margin - 200;
  const metaY = 40;
  doc.setFillColor(...LIGHT);
  doc.roundedRect(metaX, metaY, 200, 80, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...ACCENT);
  doc.text('TAX INVOICE', metaX + 12, metaY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('Invoice #', metaX + 12, metaY + 42);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text(data.invoiceNumber, metaX + 70, metaY + 42);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text('Date', metaX + 12, metaY + 58);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text(format(new Date(data.createdAt), 'dd MMM yyyy'), metaX + 70, metaY + 58);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text('Status', metaX + 12, metaY + 72);
  doc.setFont('helvetica', 'bold');
  if (data.isPaid) {
    doc.setTextColor(22, 163, 74);
    doc.text('PAID', metaX + 70, metaY + 72);
  } else {
    doc.setTextColor(217, 119, 6);
    doc.text('UNPAID', metaX + 70, metaY + 72);
  }

  // Bill-to block
  let y = 150;
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
    headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 10, textColor: [30, 41, 59] },
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

  // Payment info
  afterY += 16;
  if (!data.isPaid && (data.business.upi_id || data.paymentLinkUrl)) {
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, afterY, pageW - margin * 2, 56, 6, 6, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY);
    doc.text('PAYMENT', margin + 12, afterY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...ACCENT);
    let py = afterY + 32;
    if (data.business.upi_id) {
      doc.text(`UPI: ${data.business.upi_id}`, margin + 12, py);
      py += 12;
    }
    if (data.paymentLinkUrl) {
      doc.text(`Pay online: ${data.paymentLinkUrl}`, margin + 12, py);
    }
    afterY += 70;
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

export function downloadInvoicePdf(data: InvoicePdfData) {
  const doc = generateInvoicePdf(data);
  doc.save(`${data.invoiceNumber}.pdf`);
}

export function openInvoicePdf(data: InvoicePdfData) {
  const doc = generateInvoicePdf(data);
  window.open(doc.output('bloburl'), '_blank');
}