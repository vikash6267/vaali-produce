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
  const isLargeDataset = totalProducts > 100 // Lower threshold to use smaller fonts

  const MARGIN = 15
  const TABLE_FONT_SIZE = isLargeDataset ? 8.0 : 9.0 // Smaller font for better space usage
  const HEADER_FONT_SIZE = 7.8
  const ROW_PADDING = isLargeDataset ? 0.2 : 0.3 // Reduce padding for better space usage

  const today = new Date()
  const logoUrl = "/logg.png"
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Adjust column width for large datasets
  const columnGap = isLargeDataset ? 6 : 8 // Smaller gap between columns
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

  // Group products by category and sort alphabetically within each category
  const productsByCategory: Record<string, PriceListProduct[]> = {}
  template.products.forEach((product) => {
    if (!productsByCategory[product.category]) {
      productsByCategory[product.category] = []
    }
    productsByCategory[product.category].push(product)
  })

  // Sort products alphabetically within each category
  Object.keys(productsByCategory).forEach((category) => {
    productsByCategory[category].sort((a, b) => a.name.localeCompare(b.name))
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

    return tempDoc.lastAutoTable?.finalY ?? 4 // Default to 4 if measurement fails
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

    return tempDoc.lastAutoTable?.finalY ?? 6 // Default to 6 if measurement fails
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

    return tempDoc.lastAutoTable?.finalY ?? 6 // Default to 6 if measurement fails
  }

  // Modify the renderCategoryChunk function to handle continuation rows
  const renderCategoryChunk = (
    categoryName: string,
    products: PriceListProduct[],
    x: number,
    y: number,
    showCategoryHeader = true,
  ): number => {
    // If this is a continuation and not showing category header, add a continuation indicator
    const continuationRow = !showCategoryHeader
      ? [
          [
            {
              content: `${categoryName.toUpperCase()} (continued)`,
              colSpan: 3,
              styles: {
                halign: "left",
                fillColor: [245, 245, 245],
                textColor: [100, 100, 100],
                fontStyle: "italic",
                fontSize: TABLE_FONT_SIZE - 1,
              },
            },
          ],
        ]
      : []

    const rows = [
      ...(showCategoryHeader
        ? [
            [
              {
                content: categoryName.toUpperCase(),
                colSpan: 3,
                styles: {
                  halign: "left",
                  fillColor: [220, 220, 220],
                  textColor: [0, 0, 0],
                  fontStyle: "bold",
                  fontSize: TABLE_FONT_SIZE + 1, // Make category header slightly larger
                },
              },
            ],
          ]
        : continuationRow),
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
      head: products.length > 0 ? [["DESCRIPTION", "PRICE", "QTY"]] : [],
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

    // Calculate total header height
    const totalHeaderHeight = (includeHeader ? categoryHeaderHeight : 0) + tableHeaderHeight

    // If we don't have enough space for headers, return 0
    if (availableHeight < totalHeaderHeight) return 0

    // Space available for product rows
    const spaceForProducts = availableHeight - totalHeaderHeight

    // Calculate how many products will fit
    let productsCount = 0
    let heightUsed = 0

    for (let i = 0; i < products.length; i++) {
      const productHeight = measureProductHeight(products[i])

      if (heightUsed + productHeight <= spaceForProducts) {
        heightUsed += productHeight
        productsCount++
      } else {
        break
      }
    }

    return productsCount
  }

  // Modify the layoutCategories function to track which categories have already been displayed
  const layoutCategories = () => {
    // Create a queue of all categories and their products
    const categoryQueue = sortedCategories.map((category) => ({
      category,
      products: [...productsByCategory[category]], // Products are already sorted alphabetically
      isFirstAppearance: true, // Track if this is the first time showing this category
      isComplete: false, // Track if the category is completely rendered
    }))

    let leftY = startY
    let rightY = startY
    let currentCategoryIndex = 0

    const tableHeaderHeight = measureTableHeaderHeight()

    // Process all categories
    while (currentCategoryIndex < categoryQueue.length) {
      const currentItem = categoryQueue[currentCategoryIndex]

      // Skip if category is already complete
      if (currentItem.isComplete) {
        currentCategoryIndex++
        continue
      }

      const categoryName = currentItem.category
      const allProducts = [...currentItem.products] // All products in this category
      const categoryHeaderHeight = measureCategoryHeaderHeight(categoryName)

      // Determine which column has more space
      const leftAvailableHeight = MAX_Y - leftY
      const rightAvailableHeight = MAX_Y - rightY

      // Calculate total height needed for this category's remaining products
      let totalProductsHeight = 0
      allProducts.forEach((product) => {
        totalProductsHeight += measureProductHeight(product)
      })

      let totalCategoryHeight = tableHeaderHeight + totalProductsHeight
      if (currentItem.isFirstAppearance) {
        totalCategoryHeight += categoryHeaderHeight
      }

      // Check if we need to start a new page because both columns are nearly full
      if (leftAvailableHeight < 30 && rightAvailableHeight < 30) {
        doc.addPage()
        drawHeader()
        leftY = startY
        rightY = startY
        continue
      }

      // Determine which column to use - prefer the one with more space
      const targetX = leftAvailableHeight >= rightAvailableHeight ? leftColumnX : rightColumnX
      const targetY = targetX === leftColumnX ? leftY : rightY
      const availableHeight = targetX === leftColumnX ? leftAvailableHeight : rightAvailableHeight

      // Calculate how many products can fit in this column
      const maxProductsInColumn = estimateProductsInSpace(
        availableHeight,
        allProducts,
        currentItem.isFirstAppearance,
        tableHeaderHeight,
        categoryHeaderHeight,
      )

      if (maxProductsInColumn > 0) {
        // Take products that can fit
        const productsToRender = allProducts.slice(0, maxProductsInColumn)
        currentItem.products = allProducts.slice(maxProductsInColumn)

        // Render this chunk
        const newY =
          renderCategoryChunk(categoryName, productsToRender, targetX, targetY, currentItem.isFirstAppearance) + 2

        // Update Y position for the used column
        if (targetX === leftColumnX) {
          leftY = newY
        } else {
          rightY = newY
        }

        // Add a "continued" note if there are more products
        if (currentItem.products.length > 0) {
          // doc.setFontSize(7)
          // doc.setFont("helvetica", "italic")
          // doc.text("(continued on next column/page)", targetX + columnWidth - 2, newY - 2, { align: "right" })

          // // Mark that we've already shown the category header
          // currentItem.isFirstAppearance = false
        } else {
          // If we've processed all products, mark the category as complete
          currentItem.isComplete = true
          currentCategoryIndex++
        }
      } else {
        // Not enough space to even start the category in this column
        // Try the other column if it has more space
        if (
          (targetX === leftColumnX && rightAvailableHeight > 30) ||
          (targetX === rightColumnX && leftAvailableHeight > 30)
        ) {
          // Switch to the other column - just continue the loop
          continue
        } else {
          // Not enough space in either column, start a new page
          doc.addPage()
          drawHeader()
          leftY = startY
          rightY = startY
        }
      }
    }

    // After all categories are processed, check if we can fill any remaining space with small categories
    // This helps utilize the page space more efficiently
    fillRemainingSpace()

    // Function to fill remaining space with small categories that might fit
    function fillRemainingSpace() {
      const leftAvailableHeight = MAX_Y - leftY
      const rightAvailableHeight = MAX_Y - rightY

      // Only try to fill if we have significant space left
      if (leftAvailableHeight > 50 || rightAvailableHeight > 50) {
        // Find small categories that might fit in the remaining space
        const smallCategories = Object.keys(productsByCategory)
          .filter((category) => {
            // Skip categories that are already processed
            if (categoryQueue.find((item) => item.category === category && item.isComplete)) {
              return false
            }

            const products = productsByCategory[category]
            const estimatedHeight =
              products.reduce((total, product) => total + measureProductHeight(product), 0) +
              measureCategoryHeaderHeight(category) +
              measureTableHeaderHeight()

            return estimatedHeight < leftAvailableHeight || estimatedHeight < rightAvailableHeight
          })
          .sort((a, b) => productsByCategory[a].length - productsByCategory[b].length)

        // Try to fit these small categories in the remaining space
        for (const category of smallCategories) {
          const products = productsByCategory[category]
          const estimatedHeight =
            products.reduce((total, product) => total + measureProductHeight(product), 0) +
            measureCategoryHeaderHeight(category) +
            measureTableHeaderHeight()

          const targetX = leftAvailableHeight >= rightAvailableHeight ? leftColumnX : rightColumnX
          const targetY = targetX === leftColumnX ? leftY : rightY

          if (
            (targetX === leftColumnX && estimatedHeight < leftAvailableHeight) ||
            (targetX === rightColumnX && estimatedHeight < rightAvailableHeight)
          ) {
            const newY = renderCategoryChunk(category, products, targetX, targetY, true) + 2

            // Update available space
            if (targetX === leftColumnX) {
              leftY = newY
            } else {
              rightY = newY
            }

            // Mark this category as complete in the queue
            const queueItem = categoryQueue.find((item) => item.category === category)
            if (queueItem) {
              queueItem.isComplete = true
              queueItem.products = []
            }
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
