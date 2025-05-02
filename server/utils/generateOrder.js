const { jsPDF } = require('jspdf');

require('jspdf-autotable'); // This is the correct import for Node.js

const { format, differenceInDays } = require('date-fns');
const axios = require("axios");


const fs = require("fs")
const path = require("path")
const sharp = require('sharp');


exports.generateStatementPDF = async (data) => {
  try {
    // Create a new PDF document in landscape orientation
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
    })
  
    const PAGE_WIDTH = doc.internal.pageSize.width

    
    // Set up constants
    const agingDate = format(new Date(), "M/d/yyyy")



    // Add header layout like the image sample
    const logoPath = path.join(__dirname, "../images/logo.webp");
    if (!fs.existsSync(logoPath)) {
      console.error("Image file not found:", logoPath);
      return;
    }

    // Convert WEBP to PNG base64
    const logoBuffer = await sharp(logoPath)
      .resize(150)  // Resize if needed
      .toFormat('png')
      .toBuffer();

    const logoBase64 = logoBuffer.toString('base64');

    const logoHeight = 40;
    const logoWidth = 0;  // Assuming square logo. Adjust as needed.

    // Center the logo horizontally
    doc.addImage(logoBase64, 'PNG', 0, -3, logoWidth, logoHeight);

// Centered title
doc.setFont("helvetica", "bold")
doc.setFontSize(16)
doc.setTextColor(0, 0, 0)
doc.text("CUSTOMER STATEMENT", PAGE_WIDTH / 2, 15, { align: "center" })

// Right-aligned customer info
const rightX = PAGE_WIDTH - 10
const customerName = data.user?.storeName || "";

const customerAddress = `${data.user?.address || ""}, ${data.user?.city || ""}`;
const customerCity = `${data.user?.state || ""}, ${data.user?.zipCode || ""}`;
const customerCityLine = `${data.user?.city || ""}, ${data.user?.state || ""} ${data.user?.zipCode || ""}`

const customerPhone = data.user?.phone || "";
const customerContact = data.user?.name || "";


doc.setFont("helvetica", "bold")
doc.setFontSize(10)
doc.text(customerName, rightX, 10, { align: "right" })

doc.setFont("helvetica", "normal")
doc.text(customerAddress, rightX, 15, { align: "right" })
doc.text(customerCityLine, rightX, 20, { align: "right" })
doc.text(`Phone : ${customerPhone}`, rightX, 25, { align: "right" })
doc.text(`Contact : ${customerContact}`, rightX, 30, { align: "right" })

// Aging Date below title
doc.setFont("helvetica", "bold")
doc.setFontSize(10)
doc.text(`Aging Date:`, PAGE_WIDTH / 2 - 20, 25)
doc.setFont("helvetica", "normal")
doc.text(agingDate, PAGE_WIDTH / 2 + 10, 25)

// Bottom-left company info
doc.setFontSize(9)
doc.text(
  "4300 Pleasantdale Rd, Atlanta, GA 30340, USA    |    Phone: +1 501 559 0123    |    Email: order@valiproduce.shop",
  10,
  35
)

    // Add header
    doc.setTextColor(41, 98, 255) // Blue color for header
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")


    doc.setTextColor(0, 0, 0) // Reset to black
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
   

    // Add customer information

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
    const allOrders = []
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
    doc.autoTable( {
      startY: 45,
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
   
    // Add remittance information
    const pageHeight = doc.internal.pageSize.height
    const boxHeight = 40
    const boxTop = pageHeight - boxHeight - 10 // 10px margin from bottom
    const boxLeft = 10
    const boxWidth = doc.internal.pageSize.width - 20 // full width with 10px margin on both sides
    
    // Draw rectangle
    doc.setDrawColor(0)
    doc.setFillColor(245, 245, 245) // optional: light gray background
    doc.rect(boxLeft, boxTop, boxWidth, boxHeight, 'FD') // F = fill, D = draw border
    
    // Set content
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Remittance Method", boxLeft + 4, boxTop + 8)
    
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(
      "Pay by Email: Send copy of check to accounting@valiproduce.shop    |    Zelle: accounting@valiproduce.shop",
      boxLeft + 4,
      boxTop + 16
    )
    doc.text(
      "Fax: Send secure check to xxxxxxx    |    ACH: , Routing: xxxxxxxx, Account: xxxxxxxxx",
      boxLeft + 4,
      boxTop + 24
    )
    doc.text("Bank: SouthState Bank", boxLeft + 4, boxTop + 32)
    

    // Save the PDF
    const fileName = `Statement_${customerName.replace(/\s+/g, "_")}_${agingDate.replace(/\//g, "-")}.pdf`
    doc.save(fileName)

    const pdfBase64 = doc.output('datauristring').split(',')[1]
    return pdfBase64
  } catch (error) {
    console.error("Error generating PDF:", error)
    return false
  }
}