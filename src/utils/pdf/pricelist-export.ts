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

export const exportPriceListToPDF = (template: PriceListTemplate, price:string) => {
  const doc = new jsPDF()

  const MARGIN = 15
  const TABLE_FONT_SIZE = 6.8
  const HEADER_FONT_SIZE = 7.8


  const today = new Date()
  const logoUrl = "/logg.png"
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const columnWidth = (pageWidth - MARGIN * 2 - 10) / 2
  const leftColumnX = MARGIN
  const rightColumnX = leftColumnX + columnWidth + 10
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

  // Sort categories by number of products (largest first)
  const sortedCategories = Object.keys(productsByCategory).sort(
    (a, b) => productsByCategory[b].length - productsByCategory[a].length,
  )

  // Draw header on first page
  drawHeader()

  // COMPLETELY NEW APPROACH: Bin packing algorithm for optimal layout

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
      ...products.map((product) => [product.name.toUpperCase(), `${formatCurrencyValue(product[price] || product.pricePerBox)}`, ""]),
    ]

    autoTable(tempDoc, {
      startY: 0,
      head: [["DESCRIPTION", "PRICE", "QTY"]],
      body: rows,
      tableWidth: columnWidth,
      styles: {
        fontSize: TABLE_FONT_SIZE,
        cellPadding: 0.5,
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
        cellPadding: 0.5,
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
  }

  // Measure all categories
  const categoriesWithHeight: CategoryWithHeight[] = sortedCategories.map((category) => {
    const products = productsByCategory[category]
    const height = measureCategoryHeight(category, products)
    return { name: category, products, height }
  })

  // Maximum height available on a page
  const maxPageHeight = pageHeight - startY - 20

  // Split large categories if needed
  const splitLargeCategories = (categories: CategoryWithHeight[]): CategoryWithHeight[] => {
    const result: CategoryWithHeight[] = []

    categories.forEach((category) => {
      if (category.height <= maxPageHeight) {
        // Category fits on a page, keep it as is
        result.push(category)
      } else {
        // Category is too large, split it
        const productsPerPage = Math.floor(category.products.length * (maxPageHeight / category.height))

        for (let i = 0; i < category.products.length; i += productsPerPage) {
          const chunkProducts = category.products.slice(i, i + productsPerPage)
          const chunkName = i === 0 ? category.name : `${category.name} (continued)`
          const chunkHeight = measureCategoryHeight(chunkName, chunkProducts)

          result.push({
            name: chunkName,
            products: chunkProducts,
            height: chunkHeight,
          })
        }
      }
    })

    return result
  }

  // Split any categories that are too large for a single page
  const allCategories = splitLargeCategories(categoriesWithHeight)

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
        { content: `${formatCurrencyValue(product[price] || product.pricePerBox)}`, styles: { fontStyle: "bold", halign: "center" } },
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
        cellPadding: 0.5,
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
        cellPadding: 0.5,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      didDrawPage: () => drawHeader(),
    })

    return doc.lastAutoTable?.finalY ?? y + category.height
  }

  // Bin packing algorithm - try to fit as many categories as possible on each page
  const layoutCategories = () => {
    let leftY = startY
    let rightY = startY
    let currentPage = 1
    const remainingCategories = [...allCategories]

    while (remainingCategories.length > 0) {
      // Find the best fit for the left column
      let bestLeftFitIndex = -1
      let bestLeftFitHeight = 0

      for (let i = 0; i < remainingCategories.length; i++) {
        const category = remainingCategories[i]
        if (leftY + category.height <= pageHeight - 20) {
          if (bestLeftFitIndex === -1 || category.height > bestLeftFitHeight) {
            bestLeftFitIndex = i
            bestLeftFitHeight = category.height
          }
        }
      }

      // Find the best fit for the right column
      let bestRightFitIndex = -1
      let bestRightFitHeight = 0

      for (let i = 0; i < remainingCategories.length; i++) {
        if (i === bestLeftFitIndex) continue // Skip if already selected for left column

        const category = remainingCategories[i]
        if (rightY + category.height <= pageHeight - 20) {
          if (bestRightFitIndex === -1 || category.height > bestRightFitHeight) {
            bestRightFitIndex = i
            bestRightFitHeight = category.height
          }
        }
      }

      // If nothing fits in either column, start a new page
      if (bestLeftFitIndex === -1 && bestRightFitIndex === -1) {
        doc.addPage()
        drawHeader()
        leftY = startY
        rightY = startY
        currentPage++
        continue
      }

      // Place categories in columns
      if (bestLeftFitIndex !== -1) {
        const category = remainingCategories[bestLeftFitIndex]
        leftY = renderCategory(category, leftColumnX, leftY) + 5
        remainingCategories.splice(bestLeftFitIndex, 1)

        // Adjust right fit index if needed
        if (bestRightFitIndex !== -1 && bestRightFitIndex > bestLeftFitIndex) {
          bestRightFitIndex--
        }
      }

      if (bestRightFitIndex !== -1) {
        const category = remainingCategories[bestRightFitIndex]
        rightY = renderCategory(category, rightColumnX, rightY) + 5
        remainingCategories.splice(bestRightFitIndex, 1)
      }

      // If we couldn't place anything, something is wrong - prevent infinite loop
      if (bestLeftFitIndex === -1 && bestRightFitIndex === -1) {
        console.error("Layout algorithm failed to place categories")
        break
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

