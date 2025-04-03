
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import OrdersTable from '@/components/orders/OrdersTable';
import OrderManagementTabs from '@/components/orders/OrderManagementTabs';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, FileText, Receipt } from 'lucide-react';
import { getAllOrderAPI } from "@/services2/operations/order";
import { RootState } from '@/redux/store';
import { useSelector } from 'react-redux';

const Orders = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const[orders,setOrders] = useState([]);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const token = useSelector((state: RootState) => state.auth?.token ?? null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getAllOrderAPI(token);
        console.log(res);
        const formattedOrders = res.map(order => ({
          id: order?.orderNumber || `#${order._id.toString().slice(-5)}`,
          date: new Date(order.createdAt).toLocaleDateString(), // Formatting date
          clientName: order.store?.storeName || "Unknown", // Handling potential undefined values
          ...order // Retaining other fields
        }));
  
        setOrders(formattedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };
  
    fetchOrders(); // Call the function
  }, [token]);
  
  const handleNewOrder = () => {
    navigate('/orders/new');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="page-container max-w-full px-4 py-4">
            <PageHeader 
              title="Order Management" 
              description="Manage orders, generate invoices, and track shipments"
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleNewOrder}>
                  <Plus size={16} className="mr-2" />
                  New Order
                </Button>
                {/* <Button variant="outline">
                  <FileText size={16} className="mr-2" />
                  Invoices
                </Button>
                <Button variant="outline">
                  <Receipt size={16} className="mr-2" />
                  Receipts
                </Button> */}
              </div>
            </PageHeader>
            
            <Tabs defaultValue="orders" className="mt-6">
              <TabsList className="w-full max-w-md grid grid-cols-2 mb-6">
                <TabsTrigger value="orders" className="flex items-center">
                  <FileText size={16} className="mr-2" />
                  Orders List
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center">
                  <Receipt size={16} className="mr-2" />
                  Advanced Management
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="orders">
                <OrdersTable orders={orders} />
              </TabsContent>
              
              <TabsContent value="advanced">
                <OrderManagementTabs />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Orders;
