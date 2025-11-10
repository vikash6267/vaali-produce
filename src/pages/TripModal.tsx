import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { addTripAPI, updateTripAPI } from "@/services2/operations/trips";
import { getAllDriversAPI } from "@/services2/operations/driverAndTruck";
import { getAllOrderAPI } from "@/services2/operations/order";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const TRIP_STATUSES = ["Planned", "On Route", "Delivered", "Cancelled"];

const TripModal = ({ isOpen, onClose, editData, fetchTrips }) => {
  const token = useSelector((state: RootState) => state.auth.token);
console.log(editData)
  const [formData, setFormData] = useState({
    routeFrom: "",
    routeTo: "",
    date: "",
    driver: "",
    truck: "",
    orders: [], 
    capacity_kg: 0,
    capacity_m3: 0,
    status: "Planned", 
  });

  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrdersDetails, setSelectedOrdersDetails] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOrdersDropdown, setShowOrdersDropdown] = useState(false);

  const pageSize = 100;
  const currentPage = 1;
  const paymentFilter = "all";
  const startDate = "";
  const endDate = "";
  const activeTab = "Regural";

  const fetchDrivers = async () => {
    const data = await getAllDriversAPI(token);
    setDrivers(data);
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchSelectedOrdersDetails = async (orderIds) => {
    if (orderIds.length === 0) return;
    try {
      setLoadingOrders(true);
      const params = new URLSearchParams();
      // Ensure orderIds is an array of strings
      const validOrderIds = orderIds.filter(id => typeof id === 'string');
      if (validOrderIds.length === 0) {
        setSelectedOrdersDetails([]);
        setLoadingOrders(false);
        return;
      }
      params.append("orderIds", validOrderIds.join(","));

      const response = await getAllOrderAPI(token, params.toString());

      if (response && Array.isArray(response.orders)) {
        setSelectedOrdersDetails(
          response.orders.map((order) => ({
            id: order?._id,
            orderNumber: order?.orderNumber || `#${order._id.toString().slice(-5)}`,
            clientName: order.store?.storeName || "Unknown",
            ...order,
          }))
        );
      } else {
        setSelectedOrdersDetails([]);
      }
    } catch (error) {
      console.error("Error fetching selected orders details:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (editData) {
      // FIX: Extracting only the IDs from the orders array
      const initialOrderIds = (editData.orders || []).map(order => order._id);

      setFormData({
        routeFrom: editData.route.from,
        routeTo: editData.route.to,
        date: editData.date.slice(0, 10),
        driver: editData.driver._id,
        truck: editData.truck,
        orders: initialOrderIds, // Use the extracted IDs
        capacity_kg: editData.capacity_kg,
        capacity_m3: editData.capacity_m3,
        status: editData.status || "Planned", 
      });

      if (initialOrderIds.length > 0) {
        fetchSelectedOrdersDetails(initialOrderIds);
      } else {
        setSelectedOrdersDetails([]);
      }

      const selectedDriver = drivers.find((d) => d._id === editData.driver._id);
      const activeTrucks = selectedDriver?.trucks.filter(t => t.active) || [];
      setTrucks(activeTrucks);
    } else {
      setFormData({
        routeFrom: "",
        routeTo: "",
        date: "",
        driver: "",
        truck: "",
        orders: [],
        capacity_kg: 0,
        capacity_m3: 0,
        status: "Planned", // डिफ़ॉल्ट स्टेटस अपडेटेड
      });
      setTrucks([]);
      setSelectedOrdersDetails([]);
    }
  }, [editData, drivers]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "driver") {
      const selectedDriver = drivers.find((d) => d._id === value);
      const activeTrucks = selectedDriver?.trucks.filter(t => t.active) || [];
      setTrucks(activeTrucks);
      setFormData((prev) => ({
        ...prev,
        truck: "",
        capacity_kg: 0,
        capacity_m3: 0,
      }));
    }

    if (name === "truck") {
      const selectedTruck = trucks.find((t) => t._id === value);
      if (selectedTruck) {
        setFormData((prev) => ({
          ...prev,
          truck: selectedTruck._id,
          capacity_kg: 0,
          capacity_m3: 0,
        }));
      }
    }
  };

  const toggleSelectOrder = (orderId) => {
    setFormData((prev) => {
      const isSelected = prev.orders.includes(orderId);
      const newOrders = isSelected
        ? prev.orders.filter((id) => id !== orderId)
        : [...prev.orders, orderId];

      if (!isSelected && !selectedOrdersDetails.find(o => o.id === orderId)) {
        // If a new order is selected and its details are missing, fetch them
        fetchSelectedOrdersDetails([orderId]);
      }

      return {
        ...prev,
        orders: newOrders,
      };
    });
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", pageSize.toString());
      params.append("paymentStatus", paymentFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      params.append("orderType", activeTab);

      const response = await getAllOrderAPI(token, params.toString());

      if (response && Array.isArray(response.orders)) {
        setOrders(
          response.orders.map((order) => ({
            id: order?._id,
            orderNumber: order?.orderNumber || `#${order._id.toString().slice(-5)}`,
            clientName: order.store?.storeName || "Unknown",
            ...order,
          }))
        );
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({ title: "Error", description: "Failed to fetch orders", variant: "destructive" });
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleToggleOrdersDropdown = () => {
    setShowOrdersDropdown(!showOrdersDropdown);
    if (!showOrdersDropdown) {
      fetchOrders();
    }
  };

  const handleSearchOrders = () => fetchOrders();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      route: { from: formData.routeFrom, to: formData.routeTo },
      date: formData.date,
      driver: formData.driver,
      truck: formData.truck,
      orders: formData.orders,
      capacity_kg: Number(formData.capacity_kg),
      capacity_m3: Number(formData.capacity_m3),
      status: formData.status, // API पेलोड में स्टेटस शामिल करें
    };

    if (editData) {
      await updateTripAPI(editData._id, payload, token)();
    } else {
      await addTripAPI(payload, token);
    }

    await fetchTrips();
    onClose();
  };

  if (!isOpen) return null;

  const selectedTruck = trucks.find((t) => t._id === formData.truck);

  // Combine the paginated list (orders) and the already selected orders details 
  // to ensure all selected items show up and are checkable.
  const allOrdersForDropdown = [
    ...orders,
    ...selectedOrdersDetails.filter(
      (selectedOrder) => !orders.some((order) => order.id === selectedOrder.id)
    ),
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-md w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">{editData ? "Edit" : "Add"} Trip</h2>
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Status Field - Show only in Edit Mode */}
         
          {/* --- End Status Field --- */}

          <div>
            <label className="block text-sm font-medium mb-1">Route From</label>
            <input type="text" name="routeFrom" value={formData.routeFrom} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Route To</label>
            <input type="text" name="routeTo" value={formData.routeTo} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Driver</label>
            <select name="driver" value={formData.driver} onChange={handleChange} className="w-full border p-2 rounded" required>
              <option value="">Select Driver</option>
              {drivers.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Truck</label>
            <select name="truck" value={formData.truck} onChange={handleChange} className="w-full border p-2 rounded" required>
              <option value="">Select Truck</option>
              {trucks.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.truck_number}
                </option>
              ))}
            </select>
          </div>
           {editData && (
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange} 
                className="w-full border p-2 rounded" 
                required
              >
                {TRIP_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedTruck && (
            <div className="mb-2 text-sm text-gray-600">
              Truck Capacity: {selectedTruck.capacity_kg} kg, {selectedTruck.capacity_m3} m³
            </div>
          )}


          <div className="mt-2 relative">
            <label className="block text-sm font-medium mb-1">Select Orders</label>
            <div>
              <button type="button" onClick={handleToggleOrdersDropdown} className="w-full border p-2 rounded text-left">
                {formData.orders.length > 0 ? `${formData.orders.length} Orders Selected` : "Select Orders"}
              </button>

              {showOrdersDropdown && (
                <div className="absolute z-50 w-full max-h-60 overflow-y-auto border rounded bg-white mt-1 p-2">
                  <div className="flex gap-2 mb-2">
                    <input type="text" placeholder="Search orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border rounded px-2 py-1 flex-1" />
                    <button type="button" onClick={handleSearchOrders} className="bg-blue-500 text-white px-3 py-1 rounded">Search</button>
                  </div>

                  {loadingOrders ? (
                    <div className="flex justify-center items-center h-20"><Loader2 className="animate-spin w-6 h-6" /></div>
                  ) : allOrdersForDropdown.length > 0 ? (
                    allOrdersForDropdown.map((o) => (
                      <div key={o.id} className="flex items-center mb-1">
                        <input type="checkbox" checked={formData.orders.includes(o.id)} onChange={() => toggleSelectOrder(o.id)} className="mr-2" />
                        <span>{o.orderNumber} - {o.clientName}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No orders found</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {formData.orders.length > 0 && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Capacity (kg)</label>
                <input type="number" name="capacity_kg" value={formData.capacity_kg} onChange={handleChange} className="w-full border p-2 rounded" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Capacity (m³)</label>
                <input type="number" name="capacity_m3" value={formData.capacity_m3} onChange={handleChange} className="w-full border p-2 rounded" required />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{editData ? "Update" : "Add"}</button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TripModal;