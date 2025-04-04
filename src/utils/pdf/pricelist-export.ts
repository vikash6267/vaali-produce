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

  const TABLE_FONT_SIZE = 6.5;
  const HEADER_FONT_SIZE = 7.5;
  const TITLE_FONT_SIZE = 7.5;

  const today = new Date();
  const logoUrl = "/logg.png";
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

doc.addImage(logoUrl, "PNG", 0, 0, 20, 20); // adjust width/height as per logo size

  // Syntax: doc.addImage(image, format, x, y, width, height)

  doc.setFontSize(HEADER_FONT_SIZE);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(`Effective from: ${today.toLocaleDateString()}`, 15, 18);
  doc.text("Whatsapp: +1 501 668 0123", pageWidth - 15, 8, { align: "right" });
  doc.text("Phone: +1 501 668 0123", pageWidth - 15, 12, { align: "right" });
  doc.text("Email: order@valiproduce.shop", pageWidth - 15, 16, { align: "right" });

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(10, 20, pageWidth - 10, 20);

  const productsByCategory: Record<string, PriceListProduct[]> = {};
  template.products.forEach((product) => {
    if (!productsByCategory[product.category]) {
      productsByCategory[product.category] = [];
    }
    productsByCategory[product.category].push(product);
  });

  const sortedCategories = Object.keys(productsByCategory).sort((a, b) => {
    return productsByCategory[b].length - productsByCategory[a].length;
  });
  

  const columnWidth = pageWidth / 2 - 15;
  const leftColumnX = 10;
  const rightColumnX = pageWidth / 2 + 5;
  const startY = 25;
  const HEADER_HEIGHT = 20 // Slightly reduced header height

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

  const drawHeader = () => {
    // Clear the header area to prevent overlapping
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageWidth, HEADER_HEIGHT + 2, "F")

    doc.addImage(logoUrl, "PNG", 8, 0, 30, 15)
    doc.setFontSize(HEADER_FONT_SIZE)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    doc.text(`Effective from: ${today.toLocaleDateString()}`, 15, 18)
    doc.text("Whatsapp: +1 501 668 0123", pageWidth - 15, 8, { align: "right" })
    doc.text("Phone: +1 501 668 0123", pageWidth - 15, 12, { align: "right" })
    doc.text("Email: order@valiproduce.shop", pageWidth - 15, 16, { align: "right" })

    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.3)
    doc.line(10, HEADER_HEIGHT, pageWidth - 10, HEADER_HEIGHT)

    // Add page numbers in the header area
    doc.setFontSize(5)
    doc.text(
      `Page ${doc.getCurrentPageInfo().pageNumber} of ${doc.getNumberOfPages()}`,
      pageWidth - 10,
      HEADER_HEIGHT - 2,
      { align: "right" },
    )
  }



  const renderCategoryTable = (category: string, x: number, y: number): number => {
    const { headers, rows, category: categoryName } = generateCategoryTable(category, productsByCategory[category])

    const pageBefore = doc.internal.getNumberOfPages()

    // Add category name as a title before the table
    doc.setFontSize(TITLE_FONT_SIZE)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0)
    doc.text(categoryName.toUpperCase(), x, y)
    y += 3

    autoTable(doc, {
      startY: y,
      head: [headers.map((h) => h.title)],
      body: rows,
      margin: { left: x, top: HEADER_HEIGHT + 2 }, // Set top margin to be below header
      tableWidth: columnWidth,
      styles: {
        fontSize: TABLE_FONT_SIZE,
        cellPadding: 0.5, // Reduced padding for more compact layout
        lineWidth: 0.1, // Thinner lines
      },
      columnStyles: {
        0: { cellWidth: columnWidth * 0.55 }, // Slightly wider for description
        1: { cellWidth: columnWidth * 0.25, halign: "right" },
        2: { cellWidth: columnWidth * 0.2, halign: "center" },
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        cellPadding: 0.5, // Reduced padding
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      didDrawPage: () => {
        // Draw header on new pages
        drawHeader()
      },
      // Set a safe area to prevent content from overlapping with header
      // usedHeight: pageHeight - HEADER_HEIGHT - 10, // 10px for footer
    })

    const pageAfter = doc.internal.getNumberOfPages()
    const finalY = doc.lastAutoTable?.finalY ?? y + 10

    // If a new page was added, return the starting Y position after header
    return pageAfter > pageBefore ? HEADER_HEIGHT + 2 : finalY + 3 // Reduced spacing between tables
  }

  let leftY = startY;
  let rightY = startY;

  sortedCategories.forEach((category) => {
    if (leftY <= rightY) {
      leftY = renderCategoryTable(category, leftColumnX, leftY);
    } else {
      rightY = renderCategoryTable(category, rightColumnX, rightY);
    }
  });

  const footerY = pageHeight - 6;
  doc.setFontSize(6);
  doc.setFont("helvetica", "italic");
  doc.text("Pricing and availability subject to change without prior notice. © Vali Produce", pageWidth / 2, footerY, {
    align: "center",
  });

  const totalPagesCount = doc.getNumberOfPages();
  for (let i = 1; i <= totalPagesCount; i++) {
    doc.setPage(i);
    doc.setFontSize(6);
    doc.text(`Page ${i} of ${totalPagesCount}`, pageWidth - 10, 22, { align: "right" });
  }

  doc.save(`vali-produce-price-list-${template.name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  return doc;
};


