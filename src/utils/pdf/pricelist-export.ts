import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { PriceListTemplate, PriceListProduct } from "@/components/inventory/forms/formTypes"

declare module "jspdf" {
  interface jsPDF {
    autoTable: typeof autoTable
    lastAutoTable: {
      finalY?: number
    }
  }
}

export const exportPriceListToPDF = (template: PriceListTemplate, price: string) => {
  const doc = new jsPDF()

  // Adaptive sizing based on total product count
  const totalProducts = template.products.length
  const isLargeDataset = totalProducts > 130

  const MARGIN = 15
  const TABLE_FONT_SIZE = isLargeDataset ? 6.0 : 6.5 // Smaller font for large datasets
  const HEADER_FONT_SIZE = 7.8
  const ROW_PADDING = isLargeDataset ? 0.3 : 0.5 // Reduce padding for large datasets

  const today = new Date()
  const logoUrl = "/logg.png"
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Adjust column width for large datasets
  const columnGap = isLargeDataset ? 8 : 10
  const columnWidth = (pageWidth - MARGIN * 2 - columnGap) / 2
  const leftColumnX = MARGIN
  const rightColumnX = leftColumnX + columnWidth + columnGap
  const startY = 25
  const HEADER_HEIGHT = 20
  const MAX_TABLE_HEIGHT = pageHeight - startY - 20 // Maximum height for a table on a page

  const drawHeader = () => {
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageWidth, HEADER_HEIGHT + 2, "F")

    doc.addImage(logoUrl, "PNG", MARGIN, 0, 30, 15)

    doc.setFontSize(HEADER_FONT_SIZE)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    doc.text(`Effective from: ${today.toLocaleDateString()}`, MARGIN, 18)
    doc.text("Whatsapp: +1 501 400 2406", pageWidth - MARGIN, 8, { align: "right" })
    doc.text("Phone: +1 501 559 0123", pageWidth - MARGIN, 12, { align: "right" })
    doc.text("Email: order@valiproduce.shop", pageWidth - MARGIN, 16, { align: "right" })

    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, HEADER_HEIGHT, pageWidth - MARGIN, HEADER_HEIGHT)

    doc.setFontSize(5)
    doc.text(
      `Page ${doc.getCurrentPageInfo().pageNumber} of ${doc.getNumberOfPages()}`,
      pageWidth - MARGIN,
      HEADER_HEIGHT - 2,
      { align: "right" },
    )
  }

  const formatCurrencyValue = (val: number) => `$${val?.toFixed(2)}`

  // Group products by category
  const productsByCategory: Record<string, PriceListProduct[]> = {}
  template.products.forEach((product) => {
    if (!productsByCategory[product.category]) {
      productsByCategory[product.category] = []
    }
    productsByCategory[product.category].push(product)
  })

  // Get all unique categories
  const allCategories = Object.keys(productsByCategory)

  // Interleave categories (e.g., vegetables, fruits, vegetables, fruits...)
  // First, create a mapping of category types (assuming main types like "Vegetables", "Fruits", etc.)
  const categoryTypes: Record<string, string[]> = {}

  allCategories.forEach((category) => {
    // Extract the main category type (assuming format like "Vegetables - Leafy", "Fruits - Citrus")
    // If your categories don't follow this pattern, you'll need to adjust this logic
    const mainType = category.split(" - ")[0].trim()

    if (!categoryTypes[mainType]) {
      categoryTypes[mainType] = []
    }
    categoryTypes[mainType].push(category)
  })

  // Create an interleaved list of categories
  const interleavedCategories: string[] = []
  const mainTypes = Object.keys(categoryTypes)

  // Find the category with the most subcategories
  const maxSubcategories = Math.max(...mainTypes.map((type) => categoryTypes[type].length))

  // Interleave the categories
  for (let i = 0; i < maxSubcategories; i++) {
    for (const type of mainTypes) {
      if (categoryTypes[type][i]) {
        interleavedCategories.push(categoryTypes[type][i])
      }
    }
  }

  // If no clear pattern for interleaving, fall back to the original categories
  const sortedCategories = interleavedCategories.length > 0 ? interleavedCategories : allCategories

  // Draw header on first page
  drawHeader()

  // First, create a temporary document to measure exact heights
  const tempDoc = new jsPDF()

  // Function to measure exact height of a category
  const measureCategoryHeight = (category: string, products: PriceListProduct[]): number => {
    const rows = [
      [
        {
          content: category.toUpperCase(),
          colSpan: 3,
          styles: {
            halign: "left",
            fillColor: [230, 230, 230],
            textColor: [0, 0, 0],
            fontStyle: "bold",
          },
        },
      ],
      ...products.map((product) => [
        product.name.toUpperCase(),
        `${formatCurrencyValue(product[price] || product.pricePerBox)}`,
        "",
      ]),
    ]

    autoTable(tempDoc, {
      startY: 0,
      head: [["DESCRIPTION", "PRICE", "QTY"]],
      body: rows,
      tableWidth: columnWidth,
      styles: {
        fontSize: TABLE_FONT_SIZE,
        cellPadding: ROW_PADDING,
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: columnWidth * 0.55 },
        1: { cellWidth: columnWidth * 0.16, halign: "center" },
        2: { cellWidth: columnWidth * 0.2, halign: "center" },
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        cellPadding: ROW_PADDING,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
    })

    return tempDoc.lastAutoTable?.finalY ?? 0
  }

  // Define a category object with its measured height
  type CategoryWithHeight = {
    name: string
    products: PriceListProduct[]
    height: number
    originalIndex: number // Keep track of original order
  }

  // Measure all categories
  const categoriesWithHeight: CategoryWithHeight[] = sortedCategories.map((category, index) => {
    const products = productsByCategory[category]
    const height = measureCategoryHeight(category, products)
    return {
      name: category,
      products,
      height,
      originalIndex: index,
    }
  })

  // Function to render a category and return its final Y position
  const renderCategory = (category: CategoryWithHeight, x: number, y: number): number => {
    const rows = [
      [
        {
          content: category.name.toUpperCase(),
          colSpan: 3,
          styles: {
            halign: "left",
            fillColor: [230, 230, 230],
            textColor: [0, 0, 0],
            fontStyle: "bold",
          },
        },
      ],
      ...category.products.map((product) => [
        { content: product.name.toUpperCase(), styles: { fontStyle: "bold" } },
        {
          content: `${formatCurrencyValue(product[price] || product.pricePerBox)}`,
          styles: { fontStyle: "bold", halign: "center" },
        },
        { content: "", styles: { fontStyle: "bold", halign: "center" } },
      ]),
    ]

    autoTable(doc, {
      startY: y,
      head: [["DESCRIPTION", "PRICE", "QTY"]],
      body: rows,
      margin: { top: HEADER_HEIGHT + 2, left: x, right: MARGIN },
      tableWidth: columnWidth,
      styles: {
        fontSize: TABLE_FONT_SIZE,
        cellPadding: ROW_PADDING,
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: columnWidth * 0.55 },
        1: { cellWidth: columnWidth * 0.16, halign: "center" },
        2: { cellWidth: columnWidth * 0.2, halign: "center" },
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        cellPadding: ROW_PADDING,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      didDrawPage: () => drawHeader(),
    })

    return doc.lastAutoTable?.finalY ?? y + category.height
  }

  // Improved layout algorithm for better flow between categories
  const layoutCategories = () => {
    let leftY = startY
    let rightY = startY
    let currentPage = 1

    // Calculate available height per column
    const maxColumnHeight = pageHeight - 40 - startY

    // Process categories in the interleaved order
    for (let i = 0; i < categoriesWithHeight.length; i++) {
      const category = categoriesWithHeight[i]

      // Determine which column has more space
      const leftSpace = maxColumnHeight - (leftY - startY)
      const rightSpace = maxColumnHeight - (rightY - startY)

      // Choose the column with more space
      const targetColumn = leftSpace >= rightSpace ? "left" : "right"
      const availableSpace = targetColumn === "left" ? leftSpace : rightSpace

      // If category doesn't fit in available space
      if (category.height > availableSpace) {
        // Check if we need to start a new page
        if (leftY > startY && rightY > startY) {
          // Both columns have content, start a new page
          doc.addPage()
          drawHeader()
          leftY = startY
          rightY = startY
          currentPage++

          // Now place the category in the left column of the new page
          leftY = renderCategory(category, leftColumnX, leftY) + 2
        } else {
          // One column is still at the top of the page
          // Place in whichever column is at the top
          if (leftY === startY) {
            leftY = renderCategory(category, leftColumnX, leftY) + 2
          } else {
            rightY = renderCategory(category, rightColumnX, rightY) + 2
          }
        }
      } else {
        // Category fits in the target column
        if (targetColumn === "left") {
          leftY = renderCategory(category, leftColumnX, leftY) + 2
        } else {
          rightY = renderCategory(category, rightColumnX, rightY) + 2
        }
      }

      // If both columns are near the bottom, start a new page
      if (leftY > pageHeight - 40 && rightY > pageHeight - 40) {
        doc.addPage()
        drawHeader()
        leftY = startY
        rightY = startY
        currentPage++
      }
    }
  }

  // Execute the layout algorithm
  layoutCategories()

  // Add footer to all pages
  const totalPagesCount = doc.getNumberOfPages()
  for (let i = 1; i <= totalPagesCount; i++) {
    doc.setPage(i)

    // Add page numbers
    doc.setFontSize(6)
    doc.text(`Page ${i} of ${totalPagesCount}`, pageWidth - MARGIN, 22, { align: "right" })

    // Add footer text
    const footerY = pageHeight - 6
    doc.setFontSize(6)
    doc.setFont("helvetica", "italic")
    doc.text(
      "Pricing and availability subject to change without prior notice. © Vali Produce",
      pageWidth / 2,
      footerY,
      { align: "center" },
    )
  }

  doc.save(`vali-produce-price-list-${template.name.toLowerCase().replace(/\s+/g, "-")}.pdf`)
  return doc
}
