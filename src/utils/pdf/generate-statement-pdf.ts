import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface OrderItem {
  orderNumber: string
  date: string
  amount: number
  paymentStatus: string
  productCount: number
}

interface MonthSummary {
  orders: OrderItem[]
  totalAmount: number
  totalPaid: number
  totalPending: number
  totalProducts: number
}

interface StatementData {
  closingBalance: number
  summaryByMonth: Record<string, MonthSummary>
  totalPaid: number
  totalPending: number
  totalProductsOrdered: number
  user: {
    email: string
    name: string
    phone: string
    storeName: string
  }
}

export const generateStatementPDF = async (data: StatementData) => {
  try {
    // Create a new PDF document
    const doc = new jsPDF()
    const PAGE_WIDTH = doc.internal.pageSize.width
    const PAGE_HEIGHT = doc.internal.pageSize.height
    
    // Set up constants
    const printDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    
    const dateRange = {
      from: "01/01/2024",
      to: "31/12/2025",
    }

    // Add logo
    const logoUrl = "/logg.png"
    const logoHeight = 23
    const logoWidth = 0 // Assuming square logo

    // Center the logo horizontally
    const centerX = PAGE_WIDTH / 2
    const leftMargin = 10;
    doc.addImage(logoUrl, "PNG", leftMargin, 5, logoWidth, logoHeight);
    
    // Add company information
    let yPos = 10
    const rightX = PAGE_WIDTH - 10

    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(41, 98, 255)
    doc.text("Vali Produce", rightX, yPos + 2, { align: "right" })

    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(100, 100, 100)
    doc.text("4300 Pleasantdale Rd,", rightX, yPos + 7, { align: "right" })
    doc.text("Atlanta, GA 30340, USA", rightX, yPos + 11, { align: "right" })
    doc.text("order@valiproduce.shop", rightX, yPos + 15, { align: "right" })

    // Add statement title
    yPos = 35
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("Outstanding Statement", 10, yPos)

    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(`From: ${dateRange.from} To: ${dateRange.to}`, 10, yPos + 5)

    // Add print date and page number
    doc.setFontSize(8)
    doc.text(`Print Date`, rightX, yPos, { align: "right" })
    doc.text(`${printDate}`, rightX, yPos + 5, { align: "right" })
    doc.text(`Page 1 of 2`, rightX, yPos + 10, { align: "right" })

    // Add customer information
    yPos = 50
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(`Customer: ${data.user.storeName}`, 10, yPos)
    
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(`Name: ${data.user.name}`, 10, yPos + 5)
    doc.text(`Email: ${data.user.email}`, 10, yPos + 10)
    doc.text(`Phone: ${data.user.phone}`, 10, yPos + 15)

    // Add summary information
    yPos = 75
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Statement Summary", 10, yPos)

    // Create summary table
    const summaryData = [
      ["Closing Balance", formatCurrency(data.closingBalance)],
      ["Total Paid", formatCurrency(data.totalPaid)],
      ["Total Pending", formatCurrency(data.totalPending)],
      ["Total Products Ordered", data.totalProductsOrdered.toString()],
    ]

    autoTable(doc, {
      startY: yPos + 5,
      head: [["Description", "Amount"]],
      body: summaryData,
      theme: "grid",
      headStyles: {
        fillColor: [41, 98, 255],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        1: { halign: "right" },
      },
    })

    // Get the final Y position after the table
    yPos = (doc as any).lastAutoTable.finalY + 10

    // Add monthly details
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Monthly Order Details", 10, yPos)
    yPos += 5

    // Process each month
    for (const [month, monthData] of Object.entries(data.summaryByMonth)) {
      // Format month name
      const monthName = month === "2025-04" ? "April 2025" : "May 2025"
      
      // Add month header
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.text(monthName, 10, yPos)
      yPos += 5

      // Add month summary
      const monthSummary = [
        ["Total Amount", formatCurrency(monthData.totalAmount)],
        ["Total Paid", formatCurrency(monthData.totalPaid)],
        ["Total Pending", formatCurrency(monthData.totalPending)],
        ["Total Products", monthData.totalProducts.toString()],
      ]

      autoTable(doc, {
        startY: yPos,
        body: monthSummary,
        theme: "plain",
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        columnStyles: {
          1: { halign: "right" },
        },
      })

      // Get the final Y position after the table
      yPos = (doc as any).lastAutoTable.finalY + 5

      // Check if we need to add a new page for orders
      if (yPos > PAGE_HEIGHT - 100) {
        doc.addPage()
        yPos = 20
        
        // Add header to new page
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text(`${monthName} - Orders (Continued)`, 10, yPos)
        yPos += 5
      } else {
        // Add orders header
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.text("Orders:", 10, yPos)
        yPos += 5
      }

      // Prepare orders table data
      const ordersTableBody = monthData.orders.map(order => [
        order.orderNumber,
        formatDate(order.date),
        formatCurrency(order.amount),
        order.paymentStatus.toUpperCase(),
        order.productCount.toString()
      ])

      // Add orders table
      autoTable(doc, {
        startY: yPos,
        head: [["Order #", "Date", "Amount", "Payment Status", "Products"]],
        body: ordersTableBody,
        theme: "grid",
        styles: {
          fontSize: 7,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 98, 255],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          2: { halign: "right" },
          4: { halign: "right" },
        },
      })

      // Get the final Y position after the table
      yPos = (doc as any).lastAutoTable.finalY + 10

      // Check if we need to add a new page for the next month
      if (yPos > PAGE_HEIGHT - 40 && Object.keys(data.summaryByMonth).indexOf(month) < Object.keys(data.summaryByMonth).length - 1) {
        doc.addPage()
        yPos = 20
      }
    }

    // Add final page with total outstanding
    doc.addPage()

    // Add logo and company info to final page
    doc.addImage(logoUrl, "PNG", centerX - logoWidth / 2, 5, logoWidth, logoHeight)

    yPos = 10
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(41, 98, 255)
    doc.text("Vali Produce", rightX, yPos + 2, { align: "right" })

    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(100, 100, 100)
    doc.text("4300 Pleasantdale Rd,", rightX, yPos + 7, { align: "right" })
    doc.text("Atlanta, GA 30340, USA", rightX, yPos + 11, { align: "right" })
    doc.text("order@valiproduce.shop", rightX, yPos + 15, { align: "right" })

    // Add statement title and page info
    yPos = 35
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("Outstanding Statement", 10, yPos)

    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(`From: ${dateRange.from} To: ${dateRange.to}`, 10, yPos + 5)

    doc.setFontSize(8)
    doc.text(`Print Date`, rightX, yPos, { align: "right" })
    doc.text(`${printDate}`, rightX, yPos + 5, { align: "right" })
    doc.text(`Page 2 of 2`, rightX, yPos + 10, { align: "right" })

    // Add total outstanding
    yPos = 100
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Total Outstanding Report Value", centerX, yPos, { align: "center" })
    doc.setFontSize(18)
    doc.text(formatCurrency(data.closingBalance), centerX, yPos + 15, { align: "center" })

    // Add signature line
    yPos = 150
    doc.setFontSize(10)
    doc.line(10, yPos, 100, yPos)
    doc.text("Authorized Signature", 55, yPos + 10, { align: "center" })

    // Save the PDF
    doc.save(`Statement_${data.user.storeName.replace(/\s+/g, "_")}_${printDate.replace(/\//g, "-")}.pdf`)
    
    return true
  } catch (error) {
    console.error("Error generating PDF:", error)
    return false
  }
}

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
