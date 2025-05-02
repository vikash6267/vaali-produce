import jsPDF from "jspdf"
import "jspdf-autotable"
import { format, differenceInDays } from "date-fns"
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
  filters?: {
    paymentStatus: string
    startMonth: string
    endMonth: string
  }
  user?: {
    email: string
    name: string
    phone: string
    storeName: string
    address: string
    city: string
    state: string
    zipCode: string
  }
  
}

export const generateStatementPDF = async (data: StatementData) => {
  try {
    // Create a new PDF document in landscape orientation
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
    })
    const PAGE_WIDTH = doc.internal.pageSize.width

    // Set up constants
    const agingDate = format(new Date(), "M/d/yyyy")

    // Add header
    doc.setTextColor(41, 98, 255) // Blue color for header
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("CUSTOMER STATEMENT", 10, 15)

    doc.setTextColor(0, 0, 0) // Reset to black
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Aging Date:    ${agingDate}`, 220, 15)

    // Add customer information
    const customerName = data.user?.storeName || "";

    const customerAddress = `${data.user?.address || ""}, ${data.user?.city || ""}`;
    const customerCity = `${data.user?.state || ""}, ${data.user?.zipCode || ""}`;
    
    const customerPhone = data.user?.phone || "";
    const customerContact = data.user?.name || "";
    

    doc.setFontSize(10)
    doc.text(customerName, 10, 25)
    doc.text(customerAddress, 10, 30)
    doc.text(customerCity, 10, 35)
    doc.text(`Phone : ${customerPhone}`, 10, 40)
    doc.text(`Contact : ${customerContact}`, 10, 45)

    // Add company information
    doc.setFontSize(9)
    doc.text("9020 Sterling Street Irving, TX 75063 USA", 10, 55)
    doc.text("Phone : 214-233-3500           Email : accounting@omproduce.com", 10, 60)

    // Create aging table headers - match the exact order from the sample
    const headers = [
      [
        "Posting Date",
        "Due Date",
        "Document",
        "Days Past Due",
        "Original Amount",
        "Applied Amount",
        "Balance Due",
        "Cuml.Bal",
        "0 - 7",
        "8 - 14",
        "15 - 21",
        "22 - 28",
        "29+",
      ],
    ]

    // Prepare data for aging table
    const tableData = []
    let totalAmount = 0
    let total0to7 = 0
    let total8to14 = 0
    let total15to21 = 0
    let total22to28 = 0
    let total29plus = 0

    // Process all orders from all months
    const allOrders: OrderItem[] = []
    Object.values(data.summaryByMonth).forEach((month) => {
      allOrders.push(...month.orders)
    })

    // Sort orders by date
    allOrders.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Process each order for aging
    allOrders.forEach((order) => {
      const orderDate = new Date(order.date)
      const dueDate = new Date(order.date) // Assuming due date is same as order date
      const daysPastDue = differenceInDays(new Date(), orderDate)
    
      let amount0to7 = 0
      let amount8to14 = 0
      let amount15to21 = 0
      let amount22to28 = 0
      let amount29plus = 0
    
      let balanceDue = 0  // Default Balance Due to 0
      let appliedAmount = "$0.00"  // Default Applied Amount to 0
    
      // Check if the order has been paid or is pending
      if (order.paymentStatus === "pending") {
        balanceDue = order.amount
      } else if (order.paymentStatus === "paid") {
        appliedAmount = `$${order.amount.toFixed(2)}`  // Use the actual paid amount for appliedAmount
        balanceDue = 0  // For paid orders, balanceDue is 0
      }
    
      // Determine which aging bucket the amount falls into
      if (daysPastDue <= 7) {
        amount0to7 = order.amount
        total0to7 += order.amount
      } else if (daysPastDue <= 14) {
        amount8to14 = order.amount
        total8to14 += order.amount
      } else if (daysPastDue <= 21) {
        amount15to21 = order.amount
        total15to21 += order.amount
      } else if (daysPastDue <= 28) {
        amount22to28 = order.amount
        total22to28 += order.amount
      } else {
        amount29plus = order.amount
        total29plus += order.amount
      }
    
      totalAmount += order.amount
    
      // Match the exact column order from the sample
      tableData.push([
        format(orderDate, "MM/dd/yyyy"),
        format(dueDate, "MM/dd/yyyy"),
        `IN ${order.orderNumber}`,
        daysPastDue.toString(),
        `$${order.amount.toFixed(2)}`,
        appliedAmount,  // Display the applied amount (paid or $0.00 for pending)
        `$${balanceDue.toFixed(2)}`,  // Balance Due for pending orders
        `$${totalAmount.toFixed(2)}`,  // Cuml.Bal
        `$${amount0to7.toFixed(2)}`,
        `$${amount8to14.toFixed(2)}`,
        `$${amount15to21.toFixed(2)}`,
        `$${amount22to28.toFixed(2)}`,
        `$${amount29plus.toFixed(2)}`,
      ])
    })
    
    

    // Add totals and percentages row into the table
    const totalRow = [
      "Total:", "", "", "", "", "", "", `$${totalAmount.toFixed(2)}`, 
      `$${total0to7.toFixed(2)}`, `$${total8to14.toFixed(2)}`, 
      `$${total15to21.toFixed(2)}`, `$${total22to28.toFixed(2)}`, 
      `$${total29plus.toFixed(2)}`
    ]

    const agingRow = [
      "Aging %", "", "", "", "", "", "", "100%", 
      `${((total0to7 / totalAmount) * 100).toFixed(2)}%`, 
      `${((total8to14 / totalAmount) * 100).toFixed(2)}%`, 
      `${((total15to21 / totalAmount) * 100).toFixed(2)}%`, 
      `${((total22to28 / totalAmount) * 100).toFixed(2)}%`, 
      `${((total29plus / totalAmount) * 100).toFixed(2)}%`
    ]

    // Insert totals and aging percentages row at the end of the table data
    tableData.push(totalRow, agingRow)

    // Add aging table
    autoTable(doc, {
      startY: 65,
      head: headers,
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 98, 255], // Blue header background
        textColor: [255, 255, 255], // White text
        fontStyle: "bold",
      },
      columnStyles: {
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
        8: { halign: "right" },
        9: { halign: "right" },
        10: { halign: "right" },
        11: { halign: "right" },
        12: { halign: "right" },
      },
      didDrawPage: (data) => {
        // Add footer on each page
        const str = `Page ${doc.getNumberOfPages()}`
        doc.setFontSize(8)
        doc.text(str, PAGE_WIDTH - 20, doc.internal.pageSize.height - 10)
      },
    })

    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY + 10

    // Add remittance information
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Remittance Method", 10, finalY + 15)

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(
      "Pay by Email : Send a copy of Check to accounting@omproduce.com   Pay by Zelle : accounting@omproduce.com",
      10,
      finalY + 25,
    )
    doc.text(
      "Secure Check by Fax : Send a copy of Check to 214-233-3515           Pay by ACH : Account name: Om Trading LLC",
      10,
      finalY + 35,
    )
    doc.text("Routing: 071006486 | Account: 2810026 | Bank: CIBC", 10, finalY + 45)

    // Save the PDF
    const fileName = `Statement_${customerName.replace(/\s+/g, "_")}_${agingDate.replace(/\//g, "-")}.pdf`
    doc.save(fileName)

    return true
  } catch (error) {
    console.error("Error generating PDF:", error)
    return false
  }
}

