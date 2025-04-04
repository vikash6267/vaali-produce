import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { formatCurrency } from "@/utils/formatters"
import type { PriceListTemplate, PriceListProduct } from "@/components/inventory/forms/formTypes"

declare module "jspdf" {
  interface jsPDF {
    autoTable: typeof autoTable
    lastAutoTable: {
      finalY?: number
    }
  }
}

export const exportPriceListToPDF = (template: PriceListTemplate) => {
  const doc = new jsPDF();

  const TABLE_FONT_SIZE = 6; // smallest readable
  const HEADER_FONT_SIZE = 7;
  const TITLE_FONT_SIZE = 7;

  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 30);

  const logoUrl = "/logg.png";

  doc.addImage(logoUrl, "PNG", 15, 0, 30, 15); // smaller logo

  doc.setFontSize(HEADER_FONT_SIZE);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(`Effective from: ${today.toLocaleDateString()}`, 15, 18);

  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text("Whatsapp: +1 501 668 0123", pageWidth - 15, 8, { align: "right" });
  doc.text("Phone: +1 501 668 0123", pageWidth - 15, 12, { align: "right" });
  doc.text("Email: order@valiproduce.shop", pageWidth - 15, 16, { align: "right" });

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(10, 20, pageWidth - 10, 20); // tight margin

  const productsByCategory: Record<string, PriceListProduct[]> = {};
  template.products.forEach((product) => {
    if (!productsByCategory[product.category]) {
      productsByCategory[product.category] = [];
    }
    productsByCategory[product.category].push(product);
  });

  const sortedCategories = Object.keys(productsByCategory).sort();

  const columnWidth = pageWidth / 2 - 15;
  const leftColumnX = 10;
  const rightColumnX = pageWidth / 2 + 5;
  const startY = 25;

  const generateCategoryTable = (category: string, products: PriceListProduct[]) => {
    const headers = [
      { title: "DESCRIPTION", dataKey: "description" },
      { title: "PRICE", dataKey: "price" },
      { title: "QTY", dataKey: "qty" },
    ];

    const rows = products.map((product) => [
      product.name.toUpperCase(),
      `${formatCurrency(product.pricePerBox.toFixed(2))}`,
      "",
    ]);

    return { headers, rows, category };
  };

  const renderCategoryTable = (category: string, x: number, y: number): number => {
    if (!category) return y;
  
    const { headers, rows, category: categoryName } = generateCategoryTable(
      category,
      productsByCategory[category]
    );
  
    doc.setFontSize(TITLE_FONT_SIZE);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(categoryName.toUpperCase(), x, y);
    y += 3;
  
    let finalY = y;
  
    autoTable(doc, {
      startY: y,
      head: [headers.map((h) => h.title)],
      body: rows,
    
      margin: { left: x },
      tableWidth: columnWidth,
      styles: {
        fontSize: TABLE_FONT_SIZE,
        cellPadding: 0.7,
      },
      columnStyles: {
        0: { cellWidth: columnWidth * 0.5 },
        1: { cellWidth: columnWidth * 0.3, halign: "right" },
        2: { cellWidth: columnWidth * 0.2, halign: "center" },
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          // Reset header for new pages
          doc.addImage(logoUrl, "PNG", 15, 0, 30, 15);
          doc.setFontSize(HEADER_FONT_SIZE);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          doc.text(`Effective from: ${today.toLocaleDateString()} `, 15, 18);
          doc.text("Whatsapp: +1 501 668 0123", pageWidth - 15, 8, { align: "right" });
          doc.text("Phone: +1 501 668 0123", pageWidth - 15, 12, { align: "right" });
          doc.text("Email: order@valiproduce.shop", pageWidth - 15, 16, { align: "right" });
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(10, 20, pageWidth - 10, 20);
        }
      },
    });
  
    finalY = doc.lastAutoTable?.finalY ?? y + 10;
    return finalY + 5;
  };
  

  let leftY = startY;
  let rightY = startY;

 sortedCategories.forEach((category) => {
  if (leftY <= rightY) {
    leftY = renderCategoryTable(category, leftColumnX, leftY);
  } else {
    rightY = renderCategoryTable(category, rightColumnX, rightY);
  }
});


  const footerY = doc.internal.pageSize.getHeight() - 6;
  doc.setFontSize(6);
  doc.setFont("helvetica", "italic");
  doc.text("Pricing and availability subject to change without prior notice. © Vali Produce", pageWidth / 2, footerY, {
    align: "center",
  });

  const totalPagesCount = doc.getNumberOfPages();
  for (let i = 1; i <= totalPagesCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${totalPagesCount}`, pageWidth - 10, 22, { align: "right" });
  }

  doc.save(`vali-produce-price-list-${template.name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  return doc;
};

