import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TripPDFProps {
  trip: any;
}

const TripPDF = ({ trip }: TripPDFProps) => {
  const downloadPDF = () => {
    if (!trip) return;

    const doc = new jsPDF();
    let y = 20;

    // 🟩 Title
    doc.setFontSize(16);
    doc.text(`Trip Preview - ${trip._id}`, 14, y);
    y += 10;

    // 🟩 Route & Date & Status
    doc.setFontSize(12);
    doc.text(`Route: ${trip.route.from} → ${trip.route.to}`, 14, y);
    doc.text(`Date: ${new Date(trip.date).toLocaleDateString()}`, 120, y);
    y += 6;
    doc.text(`Status: ${trip.status}`, 14, y);
    y += 10;

    // 🟩 Driver Details
    doc.setFontSize(13);
    doc.text("Driver Details", 14, y);
    y += 6;

    doc.setFontSize(11);
    doc.text(`Name: ${trip.driver?.name || "-"}`, 14, y);
    y += 5;
    doc.text(`Phone: ${trip.driver?.phone || "-"}`, 14, y);
    y += 5;
    doc.text(`License No: ${trip.driver?.license_number || "-"}`, 14, y);
    y += 5;
    doc.text(
      `License Expiry: ${
        trip.driver?.license_expiry_date
          ? new Date(trip.driver.license_expiry_date).toLocaleDateString()
          : "-"
      }`,
      14,
      y
    );
    y += 10;

    // 🟩 Truck Details
    doc.setFontSize(13);
    doc.text("Truck Details", 14, y);
    y += 6;

    doc.setFontSize(11);
    doc.text(`Truck Number: ${trip.selectedTruck?.truck_number || "-"}`, 14, y);
    y += 5;
    doc.text(
      `Capacity: ${trip.selectedTruck?.capacity_kg || 0} kg / ${
        trip.selectedTruck?.capacity_m3 || 0
      } m³`,
      14,
      y
    );
    y += 10;

    // 🟩 Orders Per Store Summary
    const storeCountMap: Record<string, number> = {};
    trip.orders.forEach((order: any) => {
      const storeName =
        order.store?.storeName ||
        order.orderData?.store?.storeName ||
        "Unknown Store";
      storeCountMap[storeName] = (storeCountMap[storeName] || 0) + 1;
    });

    doc.setFontSize(13);
    doc.text("Orders Per Store", 14, y);
    y += 6;
    doc.setFontSize(11);
    Object.entries(storeCountMap).forEach(([store, count]) => {
      doc.text(`${store}: ${count} order(s)`, 14, y);
      y += 5;
    });
    y += 10;

    // 🟩 Orders Table (Like in Modal)
    doc.setFontSize(13);
    doc.text("Order Details", 14, y);
    y += 6;

    const tableData = trip.orders.map((order: any) => {
      const orderData = order.orderData || order.order_id || {};
      return [
        orderData.orderNumber || "-",
        order.store?.storeName || orderData.store?.storeName || "Unknown",
        `${order.capacity_kg || 0}`,
        `${order.capacity_m3 || 0}`,
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["Order Number", "Store", "Capacity (kg)", "Volume (m³)"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [230, 230, 230] },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // 🟩 Trip Capacity
    doc.setFontSize(12);
    doc.text(
      `Trip Capacity: ${trip.capacity_kg} kg / ${trip.capacity_m3} m³`,
      14,
      y
    );
    y += 10;

    // 🟩 Timestamp Footer
    doc.setFontSize(10);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
      14,
      y
    );

    // 🟩 Save File
    doc.save(`Trip_${trip._id}.pdf`);
  };

  return (
    <button
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mb-5"
      onClick={downloadPDF}
    >
      Download PDF
    </button>
  );
};

export default TripPDF;
