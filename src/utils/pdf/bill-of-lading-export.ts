
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '@/lib/data';

export const exportBillOfLadingToPDF = (
  order: Order,
  data: {
    bolNumber: string;
    shipperName: string;
    shipperAddress: string;
    shipperCity: string;
    shipperState: string;
    shipperZip: string;
    consigneeName: string;
    consigneeAddress: string;
    consigneeCity: string;
    consigneeState: string;
    consigneeZip: string;
    carrierName: string;
    trailerNumber: string;
    sealNumber?: string;
    freightTerms: "Prepaid" | "Collect" | "Third Party";
    specialInstructions?: string;
    hazardousMaterials: boolean;
    signatureShipper: string;
    serviceLevel: "Standard" | "Expedited" | "Same Day";
  }
) => {
  const doc = new jsPDF();
  
  const PAGE_WIDTH = doc.internal.pageSize.width;
  const MARGIN = 12; // Reduced margin
  const CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN);
  
  let yPos = 15; // Reduced top margin
  
  const logoUrl = "/logg.png"; // Yahan apna actual path dalen
      doc.addImage(logoUrl, "PNG", MARGIN - 8, 0, 0, 23); // Shifted 5 units more to the left


       // Title and document number - combined in one line
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('BILL OF LADING',  40,  15); // Adjusted position
  // MARGIN + 50 moves text to the right
  // yPos + 10 moves text downward
      yPos = yPos +5
 
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`B/L #: ${data.bolNumber} • Date: ${new Date(order.date).toLocaleDateString()}`, MARGIN, yPos + 6);
  yPos += 12;
  
  // More compact shipper/consignee section
  const columnWidth = CONTENT_WIDTH / 2 - 2;
  
  // Shipper box
  doc.setFillColor(245, 245, 245);
  doc.rect(MARGIN, yPos, columnWidth, 30, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(70, 70, 70);
  doc.text('SHIPPER', MARGIN + 4, yPos + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(data.shipperName, MARGIN + 4, yPos + 12);
  doc.text(data.shipperAddress, MARGIN + 4, yPos + 18);
  doc.text(`${data.shipperCity}, ${data.shipperState} ${data.shipperZip}`, MARGIN + 4, yPos + 24);
  
  // Consignee box
  doc.setFillColor(245, 245, 245);
  doc.rect(MARGIN + columnWidth + 4, yPos, columnWidth, 30, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(70, 70, 70);
  doc.text('CONSIGNEE', MARGIN + columnWidth + 8, yPos + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(data.consigneeName, MARGIN + columnWidth + 8, yPos + 12);
  doc.text(data.consigneeAddress, MARGIN + columnWidth + 8, yPos + 18);
  doc.text(`${data.consigneeCity}, ${data.consigneeState} ${data.consigneeZip}`, MARGIN + columnWidth + 8, yPos + 24);
  
  yPos += 36;
  
  // Carrier information in compact bar
  doc.setFillColor(230, 240, 255);
  doc.rect(MARGIN, yPos, CONTENT_WIDTH, 22, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CARRIER INFORMATION', MARGIN + 4, yPos + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  // Display carrier info in two columns to save space
  doc.text(`Carrier: ${data.carrierName}`, MARGIN + 4, yPos + 14);
  doc.text(`Trailer #: ${data.trailerNumber}`, MARGIN + CONTENT_WIDTH/3, yPos + 14);
  doc.text(`Service: ${data.serviceLevel}`, MARGIN + (CONTENT_WIDTH/3)*2, yPos + 14);
  
  yPos += 28;
  
  // Commodity table with compact design
  const tableHeaders = [
    { header: 'Pieces', dataKey: 'pieces' },
    { header: 'Description', dataKey: 'description' },
    { header: 'Weight', dataKey: 'weight' },
    { header: 'NMFC', dataKey: 'nmfc' },
    { header: 'Class', dataKey: 'class' },
    { header: 'HM', dataKey: 'hazardous' }
  ];
  
  // Create table rows with minimal height
  const tableRows = order.items.map(item => [
    item.quantity.toString(),
    item.productName,
    `${Math.round(item.quantity * 2)} lbs`,
    '157250',
    '50',
    data.hazardousMaterials ? 'X' : ''
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [tableHeaders.map(col => col.header)],
    body: tableRows,
    margin: { left: MARGIN, right: MARGIN },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [70, 70, 70],
      fontSize: 8,
      cellPadding: 2
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' }
    }
  });
  
  if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
    yPos = doc.lastAutoTable.finalY + 8;
  } else {
    yPos += 50;
  }
  
  // Special instructions in compact format
  if (data.specialInstructions) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('SPECIAL INSTRUCTIONS:', MARGIN, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFillColor(245, 245, 245);
    doc.rect(MARGIN, yPos + 3, CONTENT_WIDTH, 12, 'F');
    doc.text(data.specialInstructions, MARGIN + 3, yPos + 10);
    
    yPos += 20;
  }
  
  // Certification section in compact two-column layout

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
 
  doc.setFont('helvetica', 'italic');
  doc.text(data.signatureShipper, MARGIN + 4, yPos + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString()}`, MARGIN + 100, yPos + 24);
  
  // Carrier section

 
  // Footer with minimal size
  const footerY = doc.internal.pageSize.height - 10;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text('BOL is subject to terms and conditions of the carrier. This is a computer-generated document.', PAGE_WIDTH / 2, footerY, { align: 'center' });
  
  // Add page numbers
  const totalPagesCount = doc.getNumberOfPages();
  for (let i = 1; i <= totalPagesCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPagesCount}`, PAGE_WIDTH - MARGIN, 10, { align: 'right' });
  }
  
  doc.save(`bill-of-lading-${order.id}.pdf`);
  
  return doc;
};






