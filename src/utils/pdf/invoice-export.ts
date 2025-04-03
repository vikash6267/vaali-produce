
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

  let yPos = 15; // Reduced top margin

  if (includeHeader) {
    if (includeLogo) {
      const logoUrl = "/logg.png"; // Yahan apna actual path dalen
      doc.addImage(logoUrl, "PNG", MARGIN - 8, 0, 0, 23); // Shifted 5 units more to the left
    }
    doc.setFontSize(14); // Slightly smaller font
    doc.setFont('helvetica', 'bold');

    if (invoiceTemplate === 'professional') {
      doc.setTextColor(41, 98, 255);
    } else {
      doc.setTextColor(0, 0, 0);
    }

    yPos = yPos + 3

    doc.text('INVOICE', 40, 15);

    // Compact header information
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice #${order.id} • Date: ${new Date(order.date).toLocaleDateString()}`, MARGIN, yPos + 5);
    yPos += 8;

    if (includePaymentTerms) {
      const dueDateObj = new Date(dueDate);
      doc.text(`Due Date: ${dueDateObj.toLocaleDateString()}`, MARGIN, yPos);
      yPos += 4;
    }
  }

  if (includeCompanyDetails) {
    if (includeLogo) {
      // Box ka color aur size adjust kiya
      doc.setFillColor(230, 230, 230);
      doc.roundedRect(PAGE_WIDTH - MARGIN - 50, 10, 80, 20, 2, 2, 'F');

      // Company Name
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 98, 255);
      doc.text('Vali Produce', PAGE_WIDTH - MARGIN - 20, 14, { align: 'center' });

      // Address aur Contact
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);

      // Address do line me split kiya
      doc.text('4300 Pleasantdale Rd,', PAGE_WIDTH - MARGIN - 5, 20, { align: 'right' });
      doc.text('Atlanta, GA 30340, USA', PAGE_WIDTH - MARGIN - 5, 24, { align: 'right' });

      // Email
      doc.text('order@valiproduce.shop', PAGE_WIDTH - MARGIN - 5, 28, { align: 'right' });
    }

  }

  yPos = Math.max(yPos, 35); // Reduced spacing

  // Client info section - more compact
  doc.setFillColor(245, 245, 245);
  if (invoiceTemplate === 'professional') {
    doc.setFillColor(240, 247, 255);
  }
 // Bill To Box
doc.roundedRect(MARGIN, yPos, CONTENT_WIDTH, 30, 2, 2, 'F'); // Box ka height 30 kiya taki sab kuch aaye

// "Bill To" Heading
doc.setFontSize(12);
doc.setFont('helvetica', 'bold');
doc.setTextColor(70, 70, 70);
doc.text('Bill To:', MARGIN , yPos + 6);

// Client Name
doc.setFont('helvetica', 'normal');
doc.text(order.clientName, MARGIN , yPos + 12);

// Store Address Details
doc.setFontSize(8);
doc.text(order.store?.address || 'N/A', MARGIN , yPos + 18); // Agar address nahi hai to 'N/A' dikhaye
doc.text(`${order.store?.city || ''}, ${order.store?.state || ''} ${order.store?.zipCode || ''}`, MARGIN , yPos + 22);
doc.text(`Phone: ${order.store?.phone || 'N/A'}`, MARGIN , yPos + 27);

// yPos ko update kiya taki agla content overlap na ho
yPos += 35;


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
  const taxRate = includePaymentTerms ? 0.085 : 0;
  const taxAmount = subTotal * taxRate;
  const totalAmount = subTotal + taxAmount;

  doc.setFontSize(9);

  doc.text('Subtotal:', PAGE_WIDTH - MARGIN - 60, yPos);
  doc.text(formatCurrency(subTotal), PAGE_WIDTH - MARGIN, yPos, { align: 'right' });
  yPos += 5;

  if (includePaymentTerms) {
    doc.text('Tax (8.5%):', PAGE_WIDTH - MARGIN - 60, yPos);
    doc.text(formatCurrency(taxAmount), PAGE_WIDTH - MARGIN, yPos, { align: 'right' });
    yPos += 5;
  }

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
