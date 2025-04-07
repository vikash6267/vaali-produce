
import React, { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { getUserAPI } from "@/services2/operations/auth"
import { Loader2 } from "lucide-react";


const NewOrder = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = useSelector((state: RootState) => state.auth?.token ?? null);
  
  
  
  
  const [storeDetails, setStoreDetails] = useState("")
  const [storeLoading, setStoreLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  })
  const [billingAddress, setBillingAddress] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  })
  const [sameAsBilling, setSameAsBilling] = useState(true)

  useEffect(() => {
    if (!storeDetails) return;

    const id = storeDetails;

    const fetchStoreDetails = async () => {
      try {
        setStoreLoading(true);

        const res = await getUserAPI({ id });
        console.log(res)
        if (res) {
          setBillingAddress({
            name: res.ownerName || "",
            email: res.email || "",
            address: res.address || "",
            city: res.city || "",
            postalCode: res.zipCode || "",
            country: res.state || "",
          });
        }
      } catch (error) {
        console.error("Error fetching store user:", error);
      } finally {
        setStoreLoading(false);
      }
    };

    fetchStoreDetails();
  }, [storeDetails]);







  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  interface Item {
    quantity: number;
    unitPrice: number;
  }
  const handleSubmitOrder = async (data: any) => {
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
      clientId: { value: data?.store },
      items: data?.items,
      total: calculateTotal(),
      status: data?.status,
      billingAddress,
      shippingAddress: sameAsBilling ? billingAddress : shippingAddress,
    };
    await createOrderAPI(order, token)


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



              {storeLoading ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span className="text-sm">Finding user details...</span>
                </div>
              ) : (
                <>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Billing Address</h4>
                    </div>

                    <div className="grid gap-3">
                      <div className="grid gap-1.5">
                        <label htmlFor="billing-name" className="text-sm font-medium">
                          Full Name
                        </label>
                        <Input
                          id="billing-name"
                          placeholder="Your name"
                          value={billingAddress.name}
                          onChange={(e) => setBillingAddress({ ...billingAddress, name: e.target.value })}
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label htmlFor="billing-email" className="text-sm font-medium">
                          Email Address
                        </label>
                        <Input
                          id="billing-email"
                          type="email"
                          placeholder="you@example.com"
                          value={billingAddress.email}
                          onChange={(e) => setBillingAddress({ ...billingAddress, email: e.target.value })}
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <label htmlFor="billing-address" className="text-sm font-medium">
                          Address
                        </label>
                        <Input
                          id="billing-address"
                          placeholder="Street address"
                          value={billingAddress.address}
                          onChange={(e) => setBillingAddress({ ...billingAddress, address: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-1.5">
                          <label htmlFor="billing-city" className="text-sm font-medium">
                            City
                          </label>
                          <Input
                            id="billing-city"
                            placeholder="City"
                            value={billingAddress.city}
                            onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <label htmlFor="billing-postal" className="text-sm font-medium">
                            Postal Code
                          </label>
                          <Input
                            id="billing-postal"
                            placeholder="Postal code"
                            value={billingAddress.postalCode}
                            onChange={(e) => setBillingAddress({ ...billingAddress, postalCode: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid gap-1.5">
                        <label htmlFor="billing-country" className="text-sm font-medium">
                          Country
                        </label>
                        <Input
                          id="billing-country"
                          placeholder="Country"
                          value={billingAddress.country}
                          onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 py-2">
                      <input
                        type="checkbox"
                        id="same-as-billing"
                        checked={sameAsBilling}
                        onChange={(e) => setSameAsBilling(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="same-as-billing" className="text-sm">
                        Shipping address same as billing
                      </label>
                    </div>

                    {!sameAsBilling && (
                      <>
                        <div className="flex items-center justify-between mt-4">
                          <h4 className="font-medium">Shipping Address</h4>
                        </div>

                        <div className="grid gap-3">
                          <div className="grid gap-1.5">
                            <label htmlFor="shipping-name" className="text-sm font-medium">
                              Full Name
                            </label>
                            <Input
                              id="shipping-name"
                              placeholder="Your name"
                              value={shippingAddress.name}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                            />
                          </div>

                          <div className="grid gap-1.5">
                            <label htmlFor="shipping-email" className="text-sm font-medium">
                              Email Address
                            </label>
                            <Input
                              id="shipping-email"
                              type="email"
                              placeholder="you@example.com"
                              value={shippingAddress.email}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                            />
                          </div>

                          <div className="grid gap-1.5">
                            <label htmlFor="shipping-address" className="text-sm font-medium">
                              Address
                            </label>
                            <Input
                              id="shipping-address"
                              placeholder="Street address"
                              value={shippingAddress.address}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="grid gap-1.5">
                              <label htmlFor="shipping-city" className="text-sm font-medium">
                                City
                              </label>
                              <Input
                                id="shipping-city"
                                placeholder="City"
                                value={shippingAddress.city}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <label htmlFor="shipping-postal" className="text-sm font-medium">
                                Postal Code
                              </label>
                              <Input
                                id="shipping-postal"
                                placeholder="Postal code"
                                value={shippingAddress.postalCode}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="grid gap-1.5">
                            <label htmlFor="shipping-country" className="text-sm font-medium">
                              Country
                            </label>
                            <Input
                              id="shipping-country"
                              placeholder="Country"
                              value={shippingAddress.country}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div></>
              )}






              <OrderEditForm
                onSubmit={handleSubmitOrder}
                onCancel={handleCancel}
                setStoreDetails={setStoreDetails}
              />


            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NewOrder;
