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
  const FOOTER_HEIGHT = 10
  const MAX_Y = pageHeight - MARGIN - FOOTER_HEIGHT // Maximum Y position before footer

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

  // Get all categories and sort them by number of products (descending)
  const allCategories = Object.keys(productsByCategory)
  const sortedCategories = allCategories.sort((a, b) => productsByCategory[b].length - productsByCategory[a].length)

  // Draw header on first page
  drawHeader()

  // Function to measure height per product (approximate)
  const measureProductHeight = (product: PriceListProduct): number => {
    const tempDoc = new jsPDF()

    autoTable(tempDoc, {
      startY: 0,
      head: [["DESCRIPTION", "PRICE", "QTY"]],
      body: [[product.name.toUpperCase(), `${formatCurrencyValue(product[price] || product.pricePerBox)}`, ""]],
      tableWidth: columnWidth,
      styles: {
        fontSize: TABLE_FONT_SIZE,
        cellPadding: ROW_PADDING,
        lineWidth: 0.1,
      },
    })

    return tempDoc.lastAutoTable?.finalY ?? 5 // Default to 5 if measurement fails
  }

  // Function to measure category header height
  const measureCategoryHeaderHeight = (category: string): number => {
    const tempDoc = new jsPDF()

    autoTable(tempDoc, {
      startY: 0,
      body: [
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
      ],
      tableWidth: columnWidth,
      styles: {
        fontSize: TABLE_FONT_SIZE,
        cellPadding: ROW_PADDING,
        lineWidth: 0.1,
      },
    })

    return tempDoc.lastAutoTable?.finalY ?? 8 // Default to 8 if measurement fails
  }

  // Function to measure table header height
  const measureTableHeaderHeight = (): number => {
    const tempDoc = new jsPDF()

    autoTable(tempDoc, {
      startY: 0,
      head: [["DESCRIPTION", "PRICE", "QTY"]],
      body: [],
      tableWidth: columnWidth,
      styles: {
        fontSize: TABLE_FONT_SIZE,
        cellPadding: ROW_PADDING,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        cellPadding: ROW_PADDING,
      },
    })

    return tempDoc.lastAutoTable?.finalY ?? 8 // Default to 8 if measurement fails
  }

  // Function to render a category chunk and return its final Y position
  const renderCategoryChunk = (
    categoryName: string,
    products: PriceListProduct[],
    x: number,
    y: number,
    showCategoryHeader = true,
  ): number => {
    const rows = [
      ...(showCategoryHeader
        ? [
            [
              {
                content: categoryName.toUpperCase(),
                colSpan: 3,
                styles: {
                  halign: "left",
                  fillColor: [230, 230, 230],
                  textColor: [0, 0, 0],
                  fontStyle: "bold",
                },
              },
            ],
          ]
        : []),
      ...products.map((product) => [
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

    return doc.lastAutoTable?.finalY ?? y + 10 // Default if measurement fails
  }

  // Function to estimate how many products can fit in the remaining space
  const estimateProductsInSpace = (
    availableHeight: number,
    products: PriceListProduct[],
    includeHeader: boolean,
    tableHeaderHeight: number,
    categoryHeaderHeight: number,
  ): number => {
    if (products.length === 0) return 0

    const sampleProduct = products[0]
    const approxProductHeight = measureProductHeight(sampleProduct)

    // Account for headers if needed
    const headerHeight = (includeHeader ? categoryHeaderHeight : 0) + tableHeaderHeight
    const spaceForProducts = availableHeight - headerHeight

    if (spaceForProducts <= 0) return 0

    const productsFit = Math.floor(spaceForProducts / approxProductHeight)
    return productsFit >= 1 ? productsFit : 0
    
  }

  // Improved layout algorithm with maximum space utilization
  const layoutCategories = () => {
    let leftY = startY
    let rightY = startY
    let currentPage = 1
    const productsQueue: { category: string; products: PriceListProduct[] }[] = []

    // Initialize the queue with all categories and their products
    sortedCategories.forEach((category) => {
      productsQueue.push({
        category,
        products: [...productsByCategory[category]],
      })
    })

    const tableHeaderHeight = measureTableHeaderHeight()

    // Process the queue until empty
    while (productsQueue.length > 0) {
      const currentItem = productsQueue[0]
      const categoryName = currentItem.category
      const categoryHeaderHeight = measureCategoryHeaderHeight(categoryName)

      // Calculate available space in both columns
      const leftAvailableHeight = MAX_Y - leftY
      const rightAvailableHeight = MAX_Y - rightY

      // Determine which column to use (prefer the one with more space)
      const useLeftColumn = leftAvailableHeight >= rightAvailableHeight

      // Calculate how many products can fit in the chosen column
      const targetY = useLeftColumn ? leftY : rightY
      const targetX = useLeftColumn ? leftColumnX : rightColumnX
      const availableHeight = useLeftColumn ? leftAvailableHeight : rightAvailableHeight

      // Check if we need to show category header
      const isFirstChunkOfCategory = currentItem.products.length === productsByCategory[categoryName].length

      // Estimate how many products can fit
      const maxProductsInColumn = estimateProductsInSpace(
        availableHeight,
        currentItem.products,
        isFirstChunkOfCategory,
        tableHeaderHeight,
        categoryHeaderHeight,
      )

      // If we can fit at least one product
      if (maxProductsInColumn > 0 && (isFirstChunkOfCategory ? maxProductsInColumn >= 1 : true)) {

        // Take products that can fit
        const productsToRender = currentItem.products.slice(0, maxProductsInColumn)
        currentItem.products = currentItem.products.slice(maxProductsInColumn)

        // Render this chunk
        const newY = renderCategoryChunk(categoryName, productsToRender, targetX, targetY, isFirstChunkOfCategory) + 2

        // Update the Y position for the target column
        if (useLeftColumn) {
          leftY = newY
        } else {
          rightY = newY
        }

        // If we've processed all products in this category, remove it from the queue
        if (currentItem.products.length === 0) {
          productsQueue.shift()
        }
      }
      // If we can't fit any products in either column
      else {
        // Check if we've used both columns on this page
        const bothColumnsUsed = leftY > startY && rightY > startY

        // If both columns have content or neither column can fit even one product
        if (bothColumnsUsed || (leftY === startY && rightY === startY)) {
          // Start a new page
          doc.addPage()
          drawHeader()
          leftY = startY
          rightY = startY
          currentPage++

          // Don't remove the item from queue - try again on new page
        }
        // If one column is still at the top of the page
        else {
          // Force at least one product in the empty column
          const useEmptyColumn = leftY === startY
          const targetColX = useEmptyColumn ? leftColumnX : rightColumnX

          // Take just one product
          const productsToRender = currentItem.products.slice(0, 1)
          currentItem.products = currentItem.products.slice(1)

          // Render with category header if it's the first chunk
          const newY =
            renderCategoryChunk(categoryName, productsToRender, targetColX, startY, isFirstChunkOfCategory) + 2

          // Update Y position
          if (useEmptyColumn) {
            leftY = newY
          } else {
            rightY = newY
          }

          // If we've processed all products in this category, remove it from the queue
          if (currentItem.products.length === 0) {
            productsQueue.shift()
          }
        }
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
