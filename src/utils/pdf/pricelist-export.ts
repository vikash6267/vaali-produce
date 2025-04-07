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

  const MARGIN = 15;
  const TABLE_FONT_SIZE = 6.5;
  const HEADER_FONT_SIZE = 7.5;
  const TITLE_FONT_SIZE = 7.5;

  const today = new Date();
  const logoUrl = "/logg.png";
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const columnWidth = (pageWidth - MARGIN * 2 - 10) / 2;
  const leftColumnX = MARGIN;
  const rightColumnX = leftColumnX + columnWidth + 10;
  const startY = 30;
  const HEADER_HEIGHT = 20;

  const drawHeader = () => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, HEADER_HEIGHT + 2, "F");

    doc.addImage(logoUrl, "PNG", MARGIN, 0, 30, 15);

    doc.setFontSize(HEADER_FONT_SIZE);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(`Effective from: ${today.toLocaleDateString()}`, MARGIN, 18);
    doc.text("Whatsapp: +1 501 400 2406", pageWidth - MARGIN, 8, { align: "right" });
    doc.text("Phone: +1 501 669 0123", pageWidth - MARGIN, 12, { align: "right" });
    doc.text("Email: order@valiproduce.shop", pageWidth - MARGIN, 16, { align: "right" });

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, HEADER_HEIGHT, pageWidth - MARGIN, HEADER_HEIGHT);

    doc.setFontSize(5);
    doc.text(
      `Page ${doc.getCurrentPageInfo().pageNumber} of ${doc.getNumberOfPages()}`,
      pageWidth - MARGIN,
      HEADER_HEIGHT - 2,
      { align: "right" }
    );
  };

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
    const { headers, rows, category: categoryName } = generateCategoryTable(category, productsByCategory[category]);

    const pageBefore = doc.internal.getNumberOfPages();

    doc.setFontSize(TITLE_FONT_SIZE);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(categoryName.toUpperCase(), x, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [headers.map((h) => h.title)],
      body: rows,
      margin: { top: HEADER_HEIGHT + 2, left: x, right: MARGIN },
      tableWidth: columnWidth,
      styles: {
        fontSize: TABLE_FONT_SIZE,
        cellPadding: 0.5,
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: columnWidth * 0.55 },
        1: { cellWidth: columnWidth * 0.10, halign: "center" },
        2: { cellWidth: columnWidth * 0.2, halign: "center" },
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        cellPadding: 0.5,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      didDrawPage: () => drawHeader(),
    });

    const pageAfter = doc.internal.getNumberOfPages();
    const finalY = doc.lastAutoTable?.finalY ?? y + 10;
    return pageAfter > pageBefore ? HEADER_HEIGHT + 2 : finalY + 3;
  };

  const productsByCategory: Record<string, PriceListProduct[]> = {};
  template.products.forEach((product) => {
    if (!productsByCategory[product.category]) {
      productsByCategory[product.category] = [];
    }
    productsByCategory[product.category].push(product);
  });

  const sortedCategories = Object.keys(productsByCategory).sort(
    (a, b) => productsByCategory[b].length - productsByCategory[a].length
  );

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
  doc.text(
    "Pricing and availability subject to change without prior notice. © Vali Produce",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  const totalPagesCount = doc.getNumberOfPages();
  for (let i = 1; i <= totalPagesCount; i++) {
    doc.setPage(i);
    doc.setFontSize(6);
    doc.text(`Page ${i} of ${totalPagesCount}`, pageWidth - MARGIN, 22, { align: "right" });
  }

  doc.save(`vali-produce-price-list-${template.name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  return doc;
};



