
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/utils/formatters';
import { PriceListTemplate, PriceListProduct } from '@/components/inventory/forms/formTypes';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
    lastAutoTable: {
      finalY?: number;
    };
  }
}

export const exportPriceListToPDF = (template: PriceListTemplate) => {
  const doc = new jsPDF();
  
  const TABLE_FONT_SIZE = 9;
  const HEADER_FONT_SIZE = 9;
  const TITLE_FONT_SIZE = 10;
  
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 30);
  
  // doc.setFontSize(16);
  // doc.setFont("helvetica", "bold");
  // doc.setTextColor(139, 69, 19);
  // doc.text("VALI PRODUCE", 15, 20);
  

  const logoUrl = "/logg.png"; // Yahan apna actual path dalen
  
  // Add logo instead of text
  doc.addImage(logoUrl, "PNG", 15, 0, 40, 25); // X=15, Y=10, Width=40, Height=15



  doc.setFontSize(HEADER_FONT_SIZE);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  
  doc.text(`Effective from: ${today.toLocaleDateString()}`, 15, 25);
  
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(HEADER_FONT_SIZE);
  doc.text("Whatsapp: +1 501 668 0123", pageWidth - 15, 10, { align: "right" });
  doc.text("Phone: +1 501 668 0123", pageWidth - 15, 15, { align: "right" });
  doc.text("Email: order@valiproduce.shop", pageWidth - 15, 20, { align: "right" });
  
  const totalPages = "{{total_pages}}";
  // doc.setFontSize(HEADER_FONT_SIZE);
  // doc.text(`Page 1 of ${totalPages}`, pageWidth - 15, 25, { align: "right" });
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(15, 28, pageWidth - 15, 28);
  
  const productsByCategory: Record<string, PriceListProduct[]> = {};
  template.products.forEach(product => {
    if (!productsByCategory[product.category]) {
      productsByCategory[product.category] = [];
    }
    productsByCategory[product.category].push(product);
  });
  
  const sortedCategories = Object.keys(productsByCategory).sort();
  
  let leftColumnCategories: string[] = [];
  let rightColumnCategories: string[] = [];
  
  const totalProducts = template.products.length;
  let leftColumnCount = 0;
  
  for (const category of sortedCategories) {
    const categoryProducts = productsByCategory[category];
    if (leftColumnCount < totalProducts / 2) {
      leftColumnCategories.push(category);
      leftColumnCount += categoryProducts.length;
    } else {
      rightColumnCategories.push(category);
    }
  }
  
  const columnWidth = (pageWidth / 2) - 20;
  const leftColumnX = 15;
  const rightColumnX = (pageWidth / 2) + 5;
  
  let startY = 45;
  
  const generateCategoryTable = (category: string, products: PriceListProduct[]) => {
    const headers = [
      { title: "DESCRIPTION", dataKey: "description" },
      { title: "PRICE", dataKey: "price" },
      { title: "QTY", dataKey: "qty" }
    ];
    
    const rows = products.map(product => [
      product.name.toUpperCase(),
      `${formatCurrency(product.price.toFixed(2))}/${formatCurrency(product.pricePerBox.toFixed(2))}`,

      ""
    ]);
    
    return { headers, rows, category };
  };
  
  let currentY = startY;
  for (const category of leftColumnCategories) {
    const { headers, rows, category: categoryName } = generateCategoryTable(
      category,
      productsByCategory[category]
    );
    
    doc.setFontSize(TITLE_FONT_SIZE);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    
    doc.text(categoryName.toUpperCase(), leftColumnX, currentY);
    currentY += 5;
    
    autoTable(doc, {
      startY: currentY,
      head: [headers.map(h => h.title)],
      body: rows,
      margin: { left: leftColumnX },
      tableWidth: columnWidth,
      styles: {
        fontSize: TABLE_FONT_SIZE,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: columnWidth * 0.5 },
        1: { cellWidth: columnWidth * 0.3, halign: 'right' },
        2: { cellWidth: columnWidth * 0.2, halign: 'center' }
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      didDrawPage: function(data) {
        // doc.setFontSize(16);
        // doc.setFont("helvetica", "bold");
        // doc.setTextColor(139, 69, 19);
        // doc.text("VALI PRODUCE", 15, 20);
        
        doc.setFontSize(HEADER_FONT_SIZE);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text(`Effective from: ${today.toLocaleDateString()} `, 15, 25);
        
        doc.text("Whatsapp: +1 501 668 0123", pageWidth - 15, 10, { align: "right" });
        doc.text("Phone: +1 501 668 0123", pageWidth - 15, 15, { align: "right" });
        doc.text("Email: order@valiproduce.shop", pageWidth - 15, 20, { align: "right" });
        
        // const currentPage = doc.getCurrentPageInfo().pageNumber;
        // doc.text(`Page ${currentPage} of ${totalPages}`, pageWidth - 15, 25, { align: "right" });
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(15, 28, pageWidth - 15, 28);
      }
    });
    
    if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
      currentY = doc.lastAutoTable.finalY + 10;
    } else {
      currentY += 20;
    }
  }
  
  currentY = startY;
  for (const category of rightColumnCategories) {
    const { headers, rows, category: categoryName } = generateCategoryTable(
      category,
      productsByCategory[category]
    );
    
    doc.setFontSize(TITLE_FONT_SIZE);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    
    doc.text(categoryName.toUpperCase(), rightColumnX, currentY);
    currentY += 5;
    
    autoTable(doc, {
      startY: currentY,
      head: [headers.map(h => h.title)],
      body: rows,
      margin: { left: rightColumnX },
      tableWidth: columnWidth,
      styles: {
        fontSize: TABLE_FONT_SIZE,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: columnWidth * 0.5 },
        1: { cellWidth: columnWidth * 0.3, halign: 'right' },
        2: { cellWidth: columnWidth * 0.2, halign: 'center' }
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      }
    });
    
    if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
      currentY = doc.lastAutoTable.finalY + 10;
    } else {
      currentY += 20;
    }
  }
  
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Pricing and availability subject to change without prior notice. © Vali Produce", pageWidth / 2, footerY, { align: "center" });
  
  const totalPagesCount = doc.getNumberOfPages();
  for (let i = 1; i <= totalPagesCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${totalPagesCount}`, pageWidth - 15, 25, { align: "right" });
  }
  
  doc.save(`vali-produce-price-list-${template.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  
  return doc;
};
