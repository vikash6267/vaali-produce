
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import PageHeader from '@/components/shared/PageHeader';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OrderEditForm from '@/components/orders/OrderEditForm';
import { useToast } from '@/hooks/use-toast';
import { mockOrders } from '@/data/orderData';

const EditOrder = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { orderId } = useParams();
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Find the order by ID
  const order = mockOrders.find(o => o.id === orderId);

  const handleSubmitOrder = (data: any) => {
    // In a real app, this would update the order in the database
    toast({
      title: "Order Updated",
      description: `Order ${data.orderId || orderId} has been updated successfully`,
    });
    navigate('/orders');
  };

  const handleCancel = () => {
    navigate('/orders');
  };

  if (!order) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
          
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="page-container max-w-5xl mx-auto">
              <PageHeader 
                title="Edit Order" 
                description="Edit an existing order in the system"
              >
                <Button variant="outline" onClick={handleCancel}>
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Orders
                </Button>
              </PageHeader>
              
              <div className="mt-8 bg-white p-6 rounded-md shadow-sm border">
                <div className="text-center py-8">
                  <h2 className="text-xl font-medium text-red-600">Order not found</h2>
                  <p className="text-muted-foreground mt-2">The order you're trying to edit does not exist.</p>
                  <Button className="mt-4" onClick={handleCancel}>
                    Back to Orders
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="page-container max-w-5xl mx-auto">
            <PageHeader 
              title={`Edit Order ${orderId}`}
              description="Edit an existing order in the system"
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
                order={order}
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

export default EditOrder;
