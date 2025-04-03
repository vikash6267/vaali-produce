
import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import PageHeader from '@/components/shared/PageHeader';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import OrderEditForm from '@/components/orders/OrderEditForm';
import { useToast } from '@/hooks/use-toast';
import { RootState } from '@/redux/store';
import { useSelector } from 'react-redux';
import { createOrderAPI } from "@/services2/operations/order"; // Fixed the import case
import { string } from 'zod';

const NewOrder = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = useSelector((state: RootState) => state.auth?.token ?? null);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  interface Item {
    quantity: number;
    unitPrice: number;
  }
  const handleSubmitOrder = async(data: any) => {
    // In a real app, this would save the order to the database
    console.log(data);

    const calculateTotal = () => {
      const items: Item[] = data?.items || []; // Ensure data.items is an array
      return items.reduce((total: number, item: Item) => {
        return total + item.quantity * item.unitPrice;
      }, 0);
    };
    
    console.log(calculateTotal());  // Call the function to get the result
    

    const order = {
      id: `ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      date: new Date().toISOString(),
      clientId: {value:data?.store},
      items: data?.items,
      total: calculateTotal(),
      status: data?.status
    };
await createOrderAPI(order,token)

    
    toast({
      title: "Order Created",
      description: `Order ${data.orderId} has been created successfully`,
    });
    navigate('/orders');
  };

  const handleCancel = () => {
    navigate('/orders');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="page-container max-w-5xl mx-auto">
            <PageHeader 
              title="Create New Order" 
              description="Create a new order in the system"
            >
              <Button variant="outline" onClick={handleCancel}>
                <ArrowLeft size={16} className="mr-2" />
                Back to Orders
              </Button>
            </PageHeader>
            
            <div className="mt-8 bg-white p-6 rounded-md shadow-sm border">
              <div className="flex items-center mb-6">
                <FileText className="h-6 w-6 text-primary mr-2" />
                <h2 className="text-xl font-medium">Order Details</h2>
              </div>
              
              <OrderEditForm
                onSubmit={handleSubmitOrder}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NewOrder;
