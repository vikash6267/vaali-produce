
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, ShoppingCart, ClipboardList, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import StoreProductList from '@/components/store/StoreProductList';
import StoreOrderHistory from '@/components/store/StoreOrderHistory';
import { useCart, CartProvider } from '@/components/store/CartContext';
import ShoppingCartDrawer from '@/components/store/ShoppingCartDrawer';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import { RootState } from '@/redux/store';
import { useSelector } from 'react-redux';
import { getAllOrderAPI } from "@/services2/operations/order";

const StoreFront = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('products');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  

      
      const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
      };
  // Fetch products and orders when component mounts



  const token = useSelector((state: RootState) => state.auth?.token ?? null);
  const fetchOrders = async () => {
    try {
      const res = await getAllOrderAPI(token);
      console.log(res);
      const formattedOrders = res.map(order => ({
        orderId: order?.orderNumber || `#${order._id.toString().slice(-5)}`,
        date: new Date(order.createdAt).toLocaleDateString(), // Formatting date
        clientName: order.store?.storeName || "Unknown", // Handling potential undefined values
        ...order // Retaining other fields
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };
  useEffect(() => {
 
  
    fetchOrders(); // Call the function
  }, [token]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsResponse = await fetch('http://localhost:8080/api/v1/product/getAll');
        const productsData = await productsResponse.json();
        
        if (productsData.success) {
          setProducts(productsData.products || []);
        }
        
       
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  const CartButton = () => {
    const { totalItems } = useCart();
    
    return (
      <Button 
        onClick={() => setIsCartOpen(true)}
        variant="outline"
        className="fixed bottom-4 right-4 shadow-lg z-10"
      >
        <ShoppingCart className="h-5 w-5 mr-2" />
        <span>Cart</span>
        {totalItems > 0 && (
          <Badge variant="destructive" className="ml-2">{totalItems}</Badge>
        )}
      </Button>
    );
  };
  
  return (

      <div className="flex h-screen  min-w-[100vw]">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          
    <CartProvider>

      <div className="min-h-screen bg-muted/30 overflow-y-scroll flex-1">
    <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} showCart={true} setIsCartOpen={setIsCartOpen} />
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/placeholder.svg" alt="Logo" className="h-8 w-8" loading="lazy" />
              <div>
                <h1 className="text-lg font-bold">Store Portal</h1>
                <p className="text-xs text-muted-foreground">Find and order products</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-6 o">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span>Available Products</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2 pt-0">
                <p className="text-2xl font-bold">{products.length} Items</p>
                <p className="text-sm text-muted-foreground">Browse our catalog</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-purple-600" />
                  <span>Your Orders</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2 pt-0">
                <p className="text-2xl font-bold">{orders.length} Orders</p>
                <p className="text-sm text-muted-foreground">View order history</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  <span>Shopping Cart</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2 pt-0">
                <CartSummary />
              </CardContent>
            </Card>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                My Orders
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="products" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading products...</div>
              ) : (
                <StoreProductList products={products} />
              )}
            </TabsContent>
            
            <TabsContent value="orders" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : (
                <StoreOrderHistory orders={orders} />
              )}
            </TabsContent>
          </Tabs>
        </main>
        
        <CartButton />
        <ShoppingCartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} fetchOrders={fetchOrders} />
      </div>
    </CartProvider>

    </div>
  );
};

// Cart Summary Component
const CartSummary = () => {
  const { subtotal, totalItems, totalSavings } = useCart();
  
  if (totalItems === 0) {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold">Empty</p>
        <p className="text-sm text-muted-foreground">Add items to your cart</p>
      </div>
    );
  }
  
  return (
    <div>
      <p className="text-2xl font-bold">{totalItems} Items</p>
      <div className="flex justify-between mt-1">
        <span className="text-sm text-muted-foreground">Subtotal:</span>
        <span className="text-sm font-medium">${subtotal.toFixed(2)}</span>
      </div>
      {totalSavings > 0 && (
        <div className="flex justify-between mt-1 text-green-600">
          <span className="text-sm">Savings:</span>
          <span className="text-sm font-medium">${totalSavings.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};

export default StoreFront;
