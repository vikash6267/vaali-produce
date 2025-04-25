"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { User, ShoppingBag, MapPin, Phone, Mail, Store, User2, ChevronDown, ChevronUp, Calendar, Package, AlertCircle } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Clock,

  Truck,
  CheckCircle2,
  XCircle,
  BadgeDollarSign,
  CircleDollarSign
} from "lucide-react";
import { PaymentStatusPopup } from "../orders/PaymentUpdateModel"
import { Order } from '@/lib/data';
import { Button } from "../ui/button"


interface OrderItem {
  product: string
  productId: string
  name: string
  price: number
  quantity: number
  total: number
  unitPrice: number
  productName: string
  pricingType: string

}

// interface Order {
//   _id: string
//   id: string
//   orderNumber: string
//   status: string
//   paymentStatus: string
//   total: number
//   createdAt: string
//   date: string
//   updatedAt: string
//   items: OrderItem[]
//   shippinCost?: number,

  
// }

interface UserDetailsProps {
  isOpen: boolean
  onClose: () => void
  fetchUserDetailsOrder: (id:string) => void
  userData: {
    _id: string
    totalOrders: number
    totalSpent: number
    balanceDue: number
    totalPay: number
    orders: Order[]
    user: {
      _id: string
      email: string
      phone: string
      storeName: string
      ownerName: string
      address: string
      city: string
      state: string
      zipCode: string
      businessDescription: string
      role: string
      createdAt: string
    }
  } | null
}

const UserDetailsModal = ({ isOpen, onClose, userData,fetchUserDetailsOrder }: UserDetailsProps) => {
  if (!userData) return null
  const [open, setOpen] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [paymentOrder, setpaymentOrder] = useState<Order | null>(null);
  const [orderIdDB, setOrderIdDB] = useState("")
  const [totalAmount, setTotalAmount] = useState(0)

  const { totalOrders, totalSpent, user, orders, totalPay, balanceDue } = userData
  const formattedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"


  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Clock className="w-4 h-4 mr-1" />;
      case "processing":
        return <Package className="w-4 h-4 mr-1" />;
      case "shipped":
        return <Truck className="w-4 h-4 mr-1" />;
      case "delivered":
      case "completed":
        return <CheckCircle2 className="w-4 h-4 mr-1" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 mr-1" />;
      default:
        return null;
    }
  };

  const getPaymentIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="w-4 h-4 mr-1" />;
      case "paid":
        return <BadgeDollarSign className="w-4 h-4 mr-1" />;
      case "processing":
        return <CircleDollarSign className="w-4 h-4 mr-1" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "completed":
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "paid":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Store Details</DialogTitle>
        </DialogHeader>

<Button variant="link" onClick={()=>fetchUserDetailsOrder(userData._id)}>
  Refresh
</Button>
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Store Information</TabsTrigger>
            <TabsTrigger value="orders">Orders ({totalOrders})</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Store Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    <span>Store Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Store className="h-4 w-4" />
                      <span>Store Name</span>
                    </div>
                    <p className="font-medium">{user?.storeName || "N/A"}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User2 className="h-4 w-4" />
                      <span>Owner Name</span>
                    </div>
                    <p className="font-medium">{user?.ownerName || "N/A"}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <p className="font-medium">{user?.email || "N/A"}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>Phone</span>
                    </div>
                    <p className="font-medium">{user?.phone || "N/A"}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Role</span>
                    </div>
                    <Badge variant="outline" className="capitalize">{user?.role || "N/A"}</Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Member Since</span>
                    </div>
                    <p className="font-medium">{formattedDate}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Address & Order Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span>Address</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{user?.address || "N/A"}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {user?.city || "N/A"}, {user?.state || "N/A"} {user?.zipCode || "N/A"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                      <span>Order Statistics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="text-2xl font-bold">{totalOrders}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Spent</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(totalSpent)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Total Paid</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(totalPay)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span>Balance Due</span>
                        </div>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(balanceDue)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {user?.businessDescription && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Business Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{user.businessDescription}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    <span>Order History</span>
                  </CardTitle>
                  <CardDescription>
                    Showing all {orders.length} orders from this store
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {orders.map((order, index) => (
                      <AccordionItem key={order._id} value={order._id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex flex-col sm:flex-row w-full items-start sm:items-center justify-between text-left">
                            <div className="flex flex-col">
                              <div className="font-medium">{order.orderNumber}</div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDate(order.createdAt)}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-2 sm:mt-0">
                              {/* Order Status */}
                              <Badge className={getStatusColor(order.status)}>
                                <div className="flex items-center">
                                  {getStatusIcon(order.status)}
                                  <span className="capitalize">{order.status}</span>
                                </div>
                              </Badge>

                              {/* Payment Status */}
                              <Badge className={getStatusColor(order.paymentStatus || "pending")}>
                                <div className="flex items-center">
                                  {getPaymentIcon(order.paymentStatus || "pending")}
                                  <span className="capitalize">
                                    {(order.paymentStatus || "pending")?.toLowerCase() === "pending" ? "unpaid" : order.paymentStatus}
                                  </span>
                                </div>
                              </Badge>


                              {/* Total Amount */}
                              <span className="font-semibold">{formatCurrency(order.total)} </span>


                            </div>

                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pt-4 pb-2">
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              Order Items ({order.items.length})
                            </h4>
                            <div className="rounded-md border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {order.items.map((item, itemIndex) => (
                                    <TableRow key={`${order._id}-item-${itemIndex}`}>
                                      <TableCell className="font-medium">{item.name || item.productName}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(item?.unitPrice || item?.price)} </TableCell>
                                      <TableCell className="text-right">
                                        {item.quantity} {item.pricingType === "unit" ? "LB" : ""}
                                      </TableCell>

                                      <TableCell className="text-right">{formatCurrency((item?.unitPrice || item?.price) * item.quantity)}</TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow>
                                    <TableCell colSpan={3} className="text-right font-medium">
                                      Subtotal
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      {formatCurrency(order.total - (order.shippinCost || 0))}
                                    </TableCell>
                                  </TableRow>
                                  {order.shippinCost !== undefined && (
                                    <TableRow>
                                      <TableCell colSpan={3} className="text-right font-medium">
                                        Shipping
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        {formatCurrency(order.shippinCost)}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  <TableRow>
                                    <TableCell colSpan={3} className="text-right font-bold">
                                      Total
                                    </TableCell>

                                    <TableCell className="text-right font-bold">
                                      {formatCurrency(order.total)}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                              {(
                        <button
                          onClick={() => { setOrderId(order.orderNumber); setOpen(true); setTotalAmount(order.total); setOrderIdDB(order?._id || order?.id) ;setpaymentOrder(order) }} // define this handler function
                          className="mt-1 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                        >
                          {
                            order.paymentStatus === "pending" ? "Pay Now" : "Edit"
                          }
                        </button>
                      )}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <PaymentStatusPopup
        open={open}
        onOpenChange={setOpen}
        orderId={orderId}
        totalAmount={totalAmount}
        id={orderIdDB}
        fetchOrders={()=>fetchUserDetailsOrder(orderId)}
        onPayment={()=>console.log("hello")}
        paymentOrder={paymentOrder}
      />

    </Dialog>
  )
}

export default UserDetailsModal
