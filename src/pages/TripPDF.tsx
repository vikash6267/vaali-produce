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

    // ---------- HEADER ----------
    doc.setFontSize(16);
    // doc.text(`Trip Preview - ${trip._id}`, 14, y);
    y += 10;

    // ---------- ROUTE LEFT + DATE + STATUS RIGHT ----------
    doc.setFontSize(12);

    // FIX: Changed '→' to '->' and ensured default font is used (no special font call needed)
    doc.text(`Route: ${trip.route.from} - ${trip.route.to}`, 14, y);
    doc.text(
      `Date: ${new Date(trip.date).toLocaleDateString()}`,
      120,
      y
    );
    y += 6;

    doc.text(`Status: ${trip.status}`, 120, y);
    y += 12;

    // ---------- DRIVER LEFT + TRUCK RIGHT ----------
    doc.text("Driver Details:", 14, y);
    doc.text("Truck Details:", 120, y);
    y += 6;

    doc.text(`Name: ${trip.driver.name}`, 14, y);
    doc.text(`Truck Number: ${trip.selectedTruck.truck_number}`, 120, y);
    y += 6;

    doc.text(`Phone: ${trip.driver.phone}`, 14, y);
    doc.text(
      `Capacity: ${trip.selectedTruck.capacity_kg} kg / ${trip.selectedTruck.capacity_m3} m³`,
      120,
      y
    );
    y += 6;

    doc.text(`License: ${trip.driver.license_number}`, 14, y);
    doc.text(
      `License Expiry: ${new Date(
        trip.driver.license_expiry_date
      ).toLocaleDateString()}`,
      120,
      y
    );
    y += 12;

    // ---------- ORDERS ----------
    trip.orders.forEach((order, index) => {
      doc.text(`Order ${index + 1}: ${order.orderNumber}`, 14, y);
      y += 6;

      const tableColumn = ["Product Name", "Qty", "Unit Price"];
      const tableRows = order.items.map((item) => [
        item.productName,
        item.quantity,
        `$${item.unitPrice}`,
      ]);

      // ✅ Keep cyan theme (DEFAULT AUTO-TABLE THEME)
      autoTable(doc, {
        startY: y,
        head: [tableColumn],
        body: tableRows,
        theme: "grid",
        margin: { left: 14, right: 14 },
        styles: { fontSize: 10 },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    });

    // ---------- TRIP CAPACITY ----------
    doc.text(
      `Trip Capacity: ${trip.capacity_kg} kg / ${trip.capacity_m3} m³`,
      14,
      y
    );

    // ---------- DOWNLOAD ----------
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