
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/utils/formatters';
import { Order } from '@/lib/data';

export const exportInvoiceToPDF = (
  order: Order,
  options: {
    includeHeader?: boolean;
    includeCompanyDetails?: boolean;
    includePaymentTerms?: boolean;
    includeLogo?: boolean;
    includeSignature?: boolean;
    dueDate?: string;
    invoiceTemplate?: string;
  } = {}
) => {
  const {
    includeHeader = true,
    includeCompanyDetails = true,
    includePaymentTerms = true,
    includeLogo = true,
    includeSignature = false,
    dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    invoiceTemplate = 'standard'
  } = options;

  const doc = new jsPDF();

  const PAGE_WIDTH = doc.internal.pageSize.width;
  const MARGIN = 12; // Reduced margin
  const CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN);
  const centerX = PAGE_WIDTH / 2;
  const rightX = PAGE_WIDTH - MARGIN;
  const leftX = MARGIN;


  let yPos = 15; // Reduced top margin
  if (includeLogo) {
    const logoUrl = "/logg.png";
    const logoHeight = 23;
    const logoWidth = 0; // Assuming square logo. You can adjust this as per your actual image ratio.
  
    // Center the logo horizontally
    const centerX = PAGE_WIDTH / 2;
    doc.addImage(logoUrl, "PNG", centerX - 23 / 2, 5, logoWidth, logoHeight);
  }
  
  // MARGIN - 8, 0, 0, 23

  
  // ----------- LEFT SIDE: INVOICE DETAILS -----------
  if (order) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(invoiceTemplate === 'professional' ? 41 : 0, 98, 255);
    doc.text('INVOICE', leftX, yPos + 2);
  
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Invoice #: ${order.id}`, leftX, yPos + 7);
    doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`, leftX, yPos + 11);
  
    if (includePaymentTerms && dueDate) {
      const dueDateObj = new Date(dueDate);
      doc.text(`Due Date: ${dueDateObj.toLocaleDateString()}`, leftX, yPos + 15);
    }
  }
  
  // ----------- RIGHT SIDE: COMPANY DETAILS -----------
  if (includeCompanyDetails) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 98, 255);
    doc.text('Vali Produce', rightX, yPos + 2, { align: 'right' });
  
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('4300 Pleasantdale Rd,', rightX, yPos + 7, { align: 'right' });
    doc.text('Atlanta, GA 30340, USA', rightX, yPos + 11, { align: 'right' });
    doc.text('order@valiproduce.shop', rightX, yPos + 15, { align: 'right' });
  }
  
  // Update yPos for next content
  yPos += 25;
  
  
  
 
  // ----------- INVOICE DETAILS UNDERNEATH -----------







  // Client info section - more compact
  doc.setFillColor(245, 245, 245);
  if (invoiceTemplate === 'professional') {
    doc.setFillColor(240, 247, 255);
  }
 // Bill To Box
 const boxHeight = 40;
 doc.roundedRect(MARGIN, yPos, CONTENT_WIDTH, boxHeight, 2, 2, 'F'); 
 
 // Font settings
 doc.setFontSize(9);
 doc.setTextColor(50, 50, 50);
 
 // ---------- BILL TO ----------
 let billToX = MARGIN + 4;
 let billToY = yPos + 6;
 
 doc.setFont('helvetica', 'bold');
 doc.text('Sold To:', billToX, billToY);
 
 doc.setFont('helvetica', 'normal');
 doc.text(order?.clientName || 'N/A', billToX, billToY + 6);
 doc.text(order?.store?.address || 'N/A', billToX, billToY + 11);
 doc.text(`${order?.store?.city || ''}, ${order?.store?.state || ''} ${order?.store?.zipCode || ''}`, billToX, billToY + 16);
 doc.text(`Phone: ${order?.store?.phone || 'N/A'}`, billToX, billToY + 21);
 
 // ---------- SHIP TO ----------
 let shipToX = PAGE_WIDTH / 2 + 4;
 let shipToY = yPos + 6;
 
 doc.setFont('helvetica', 'bold');
 doc.text('Ship To:', shipToX, shipToY);
 
 doc.setFont('helvetica', 'normal');
 doc.text(order?.shippingName || 'N/A', shipToX, shipToY + 6);
 doc.text(order?.shippingAddress || 'N/A', shipToX, shipToY + 11);
 doc.text(`${order?.shippingCity || ''}, ${order?.shippingState || ''} ${order?.shippingZipCode || ''}`, shipToX, shipToY + 16);
 doc.text(`Phone: ${order?.shippingPhone || 'N/A'}`, shipToX, shipToY + 21);
 
 // Move yPos below box
 yPos += boxHeight + 5;
 
// yPos ko update kiya taki agla content overlap na ho



  const tableHeaders = [
    { header: 'Item', dataKey: 'item' },
    { header: 'Qty', dataKey: 'quantity' }, // Shortened header
    { header: 'Price', dataKey: 'unitPrice' }, // Shortened header
    { header: 'Amount', dataKey: 'amount' }
  ];

  const tableRows = order.items.map(item => [
    item.name,
    item.quantity.toString(),
    formatCurrency(item.price),
    formatCurrency(item.quantity * item.price)
  ]);

  let headerStyles: any = {
    fillColor: [245, 245, 245],
    textColor: [70, 70, 70],
    fontStyle: 'bold' as 'bold',
    lineWidth: 0.1,
    fontSize: 8 // Smaller font size for table headers
  };

  if (invoiceTemplate === 'professional') {
    headerStyles.fillColor = [41, 98, 255];
    headerStyles.textColor = [255, 255, 255];
  } else if (invoiceTemplate === 'minimal') {
    headerStyles.fillColor = [255, 255, 255];
    headerStyles.textColor = [50, 50, 50];
  }

  autoTable(doc, {
    startY: yPos,
    head: [tableHeaders.map(col => col.header)],
    body: tableRows,
    margin: { left: MARGIN, right: MARGIN },
    headStyles: headerStyles,
    bodyStyles: {
      lineWidth: 0.1,
      fontSize: 10 // Smaller font size for table body
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'right' }, // Narrower column
      2: { cellWidth: 30, halign: 'right' }, // Narrower column
      3: { cellWidth: 30, halign: 'right' } // Narrower column
    },
    alternateRowStyles: {
      fillColor: invoiceTemplate === 'minimal' ? [255, 255, 255] : [250, 250, 250]
    },
    didDrawPage: function () {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, PAGE_WIDTH - MARGIN, doc.internal.pageSize.height - 8, { align: 'right' });
      }
    }
  });

  if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
    yPos = doc.lastAutoTable.finalY + 8; // Reduced spacing
  } else {
    yPos += 50;
  }

  const subTotal = order.total;
  // const taxRate = includePaymentTerms ? 0.085 : 0;
  const taxRate = includePaymentTerms ? 0 : 0;
  const taxAmount = subTotal * taxRate;
  const totalAmount = subTotal ;

  doc.setFontSize(9);

  doc.text('Subtotal:', PAGE_WIDTH - MARGIN - 60, yPos);
  doc.text(formatCurrency(subTotal), PAGE_WIDTH - MARGIN, yPos, { align: 'right' });
  yPos += 5;

  // if (includePaymentTerms) {
  //   doc.text('Tax (8.5%):', PAGE_WIDTH - MARGIN - 60, yPos);
  //   doc.text(formatCurrency(taxAmount), PAGE_WIDTH - MARGIN, yPos, { align: 'right' });
  //   yPos += 5;
  // }

  doc.setLineWidth(0.5);
  doc.line(PAGE_WIDTH - MARGIN - 60, yPos - 2, PAGE_WIDTH - MARGIN, yPos - 2);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', PAGE_WIDTH - MARGIN - 60, yPos + 4);
  doc.text(formatCurrency(totalAmount), PAGE_WIDTH - MARGIN, yPos + 4, { align: 'right' });

  // if (includePaymentTerms) {
  //   yPos += 15;
  //   doc.setFontSize(8);
  //   doc.setFont('helvetica', 'normal');
  //   doc.setTextColor(100, 100, 100);
  //   doc.text('Thank you for your business! Payment is due within 30 days of invoice date.', PAGE_WIDTH / 2, yPos, { align: 'center' });
  // }

  if (includeSignature) {
    yPos += 15;
    doc.setLineWidth(0.1);
    doc.line(PAGE_WIDTH - MARGIN - 60, yPos, PAGE_WIDTH - MARGIN, yPos);
    yPos += 4;
    doc.setFontSize(7);
    doc.text('Authorized Signature', PAGE_WIDTH - MARGIN - 30, yPos, { align: 'center' });
  }

  const footerY = doc.internal.pageSize.height - 10;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text('This is a computer-generated document. No signature is required.', PAGE_WIDTH / 2, footerY, { align: 'center' });

  doc.save(`invoice-${order.id}.pdf`);

  return doc;
};
