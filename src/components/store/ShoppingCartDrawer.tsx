
import React, { useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Truck,
  FileText,
  AlertCircle,
  Gift,
  Percent,
  DollarSign,
  ArrowUp,
  Award,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '@/lib/data';
import { useCart, CartItem } from './CartContext';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { createOrderAPI } from "@/services2/operations/order";

interface ShoppingCartDrawerProps {
  open: boolean;
  onClose: () => void;
  fetchOrders: () => void;
}

const ShoppingCartDrawer: React.FC<ShoppingCartDrawerProps> = ({ open, onClose,fetchOrders }) => {
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    subtotal, 
    totalItems, 
    applyBulkDiscount, 
    paletteCount, 
    getDiscountTier, 
    clearCart, 
    calculateOriginalTotal,
    totalSavings,
    savingsPercentage
  } = useCart();
  const { toast } = useToast();
  const user = useSelector((state: RootState) => state.auth?.user ?? null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');

  const discountTier = getDiscountTier();
  const discountedTotal = applyBulkDiscount(subtotal);
  const originalTotal = calculateOriginalTotal();
  const volumeDiscountSavings = subtotal - discountedTotal;
  const token = useSelector((state: RootState) => state.auth?.token ?? null);

  // Calculate progress to next tier
  const getNextTierInfo = () => {
    if (discountTier.tier === 0) {
      const itemsNeeded = 20 - totalItems;
      return {
        nextTier: 1,
        itemsNeeded,
        nextDiscount: 10,
        progress: (totalItems / 20) * 100
      };
    } else if (discountTier.tier === 1) {
      const itemsNeeded = 40 - totalItems;
      return {
        nextTier: 2,
        itemsNeeded,
        nextDiscount: 15,
        progress: ((totalItems - 20) / 20) * 100
      };
    } else if (discountTier.tier === 2) {
      const itemsNeeded = 60 - totalItems;
      return {
        nextTier: 3,
        itemsNeeded,
        nextDiscount: 25,
        progress: ((totalItems - 40) / 20) * 100
      };
    }
    return {
      nextTier: 3,
      itemsNeeded: 0,
      nextDiscount: 25,
      progress: 100
    };
  };
  
  const nextTierInfo = getNextTierInfo();
  
  const handleCheckout = () => {
    setIsCheckoutOpen(true);
  };
  
 
  const completeOrder = async() => {
    toast({
      title: "Order Placed Successfully!",
      description: "Your order has been received and will be processed shortly.",
    });


    const order = {
      id: `ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      date: new Date().toISOString(),
      clientId: {
        value:user?._id,
        label:user?.storeName
      },
      clientName: user?.storeName,
      items: cart,
      total: discountedTotal,
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      subtotal: discountedTotal,
      store: user?._id
    };

    console.log(order)
    
    await createOrderAPI(order, token);


    
    clearCart();
    setIsCheckoutOpen(false);
    onClose();
    fetchOrders()
  };
  

  const updateWithDiscount = (id:string,quantity:number)=>{
    updateQuantity(id,quantity)
  }
  return (
    <>
      <Sheet open={open} onOpenChange={onClose} >
        <SheetContent className="sm:max-w-md w-full">
          <SheetHeader>
            <SheetTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Your Shopping Cart
              {totalItems > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>
          
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh]">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Your cart is empty</h3>
              <p className="text-muted-foreground text-center mt-2">
                Add some products to your cart to continue shopping.
              </p>
              <SheetClose asChild>
                <Button className="mt-4">
                  Continue Shopping
                </Button>
              </SheetClose>
            </div>
          ) : (
            <>
              {/* Savings Summary Banner */}
              {totalSavings > 0 && (
                <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-4 rounded-lg my-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold flex items-center text-lg">
                      <Sparkles className="h-5 w-5 mr-2" />
                      Your Savings
                    </h3>
                    <Badge className="bg-white text-emerald-700 font-bold">
                      {savingsPercentage.toFixed(0)}% OFF
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold mb-1">{formatCurrency(totalSavings)}</div>
                  <p className="text-sm opacity-90">
                    You're saving {formatCurrency(totalSavings)} from the regular price of {formatCurrency(originalTotal)}!
                  </p>
                </div>
              )}
            
              <div className="flex-1 overflow-y-auto py-4">
                {/* Palette discount information */}
                {/* <div className="mb-4 bg-muted/40 p-3 rounded-md">
                  <h4 className="font-medium flex items-center">
                    <Gift className="h-4 w-4 mr-2 text-primary" />
                    Volume Discount Tiers
                  </h4>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                    <div className={`p-2 rounded-md text-center ${discountTier.tier >= 1 ? 'bg-primary/20 font-medium' : 'bg-muted'}`}>
                      1 Palette<br />10% Off
                    </div>
                    <div className={`p-2 rounded-md text-center ${discountTier.tier >= 2 ? 'bg-primary/20 font-medium' : 'bg-muted'}`}>
                      2 Palettes<br />15% Off
                    </div>
                    <div className={`p-2 rounded-md text-center ${discountTier.tier >= 3 ? 'bg-primary/20 font-medium' : 'bg-muted'}`}>
                      3+ Palettes<br />25% Off
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Current palettes: </span> 
                    {paletteCount} {paletteCount === 1 ? 'palette' : 'palettes'}
                    {discountTier.percentage > 0 && (
                      <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                        {discountTier.percentage}% Discount Applied
                      </Badge>
                    )}
                  </div>
                  
                  {nextTierInfo.itemsNeeded > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Current tier: {discountTier.tier}</span>
                        <span>Next tier: {nextTierInfo.nextTier}</span>
                      </div>
                      <Progress value={nextTierInfo.progress} className="h-2" />
                      <p className="text-sm text-muted-foreground mt-1 flex items-center">
                        <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
                        Add {nextTierInfo.itemsNeeded} more items to reach {nextTierInfo.nextTier} {nextTierInfo.nextTier === 1 ? 'palette' : 'palettes'} 
                        and get {nextTierInfo.nextDiscount}% off!
                      </p>
                    </div>
                  )}
                </div> */}
                
                {cart.map((item) => (
                  <div key={item.id} className="flex py-3">
                    <div className="h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                          {item.discountPercentage && (
                            <div className="flex items-center justify-end text-green-600 text-sm">
                              <Percent className="h-3 w-3 mr-1" />
                              {item.discountPercentage}% off
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center border rounded-md">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2"
                            onClick={() => updateWithDiscount(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2"
                            onClick={() => updateWithDiscount(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Special Requests</h4>
                  <Input
                    placeholder="Add any special requests or instructions..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Separator />
                
                {totalSavings > 0 && (
                  <div className="bg-green-50 text-green-800 p-3 rounded-md text-sm">
                    <div className="font-medium flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 mr-1">Savings Breakdown</Badge>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between">
                        <span>Product Discounts:</span>
                        <span>{formatCurrency(totalSavings - volumeDiscountSavings)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volume Discount ({discountTier.percentage}%):</span>
                        <span>{formatCurrency(volumeDiscountSavings)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-green-200">
                        <span>Total Savings:</span>
                        <span>{formatCurrency(totalSavings)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Total</span>
                    <span className={totalSavings > 0 ? "line-through text-muted-foreground" : ""}>
                      {formatCurrency(originalTotal)}
                    </span>
                  </div>
                  
                  {totalSavings > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal with Product Discounts</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                  )}
                  
                  {volumeDiscountSavings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Volume Discount ({discountTier.percentage}%)</span>
                      <span>-{formatCurrency(volumeDiscountSavings)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-medium text-lg mt-2 pt-2 border-t">
                    <span>Final Total</span>
                    <div className="flex flex-col items-end">
                      <span>{formatCurrency(discountedTotal)}</span>
                      {totalSavings > 0 && (
                        <span className="text-sm font-normal text-green-600">
                          You save {formatCurrency(totalSavings)} ({savingsPercentage.toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Button onClick={handleCheckout} className="w-full bg-green-600 hover:bg-green-700">
                    <CreditCard className="mr-2 h-4 w-4" /> 
                    Checkout and Save {formatCurrency(totalSavings)}
                  </Button>
                  
                  <Button variant="outline" onClick={clearCart} className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" /> 
                    Clear Cart
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      
      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
            <DialogDescription>
              Review your order details and provide shipping information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Order Summary</h4>
              <p className="text-sm text-muted-foreground">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} - {formatCurrency(discountedTotal)}
              </p>
              
              {totalSavings > 0 && (
                <Alert className="bg-green-50 border-green-200">
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-2 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <span className="font-bold">Congratulations!</span> You're saving {formatCurrency(totalSavings)} ({savingsPercentage.toFixed(0)}%) on this order!
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </div>
            
            {/* <div className="grid gap-3">
              <div className="grid gap-1.5">
                <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                <Input id="name" placeholder="Your name" />
              </div>
              
              <div className="grid gap-1.5">
                <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
              
              <div className="grid gap-1.5">
                <label htmlFor="address" className="text-sm font-medium">Delivery Address</label>
                <Input id="address" placeholder="Street address" />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1.5">
                  <label htmlFor="city" className="text-sm font-medium">City</label>
                  <Input id="city" placeholder="City" />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="postal" className="text-sm font-medium">Postal Code</label>
                  <Input id="postal" placeholder="Postal code" />
                </div>
              </div>
            </div> */}
            
            <div className="rounded-md bg-muted/50 p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  This is a demo checkout. No actual payment will be processed.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={completeOrder} className="bg-green-600 hover:bg-green-700">
              <DollarSign className="mr-2 h-4 w-4" />
              Save {formatCurrency(totalSavings)} & Place Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShoppingCartDrawer;
