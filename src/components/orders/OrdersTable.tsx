"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Edit,
  Trash,
  FileText,
  Search,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  FileSpreadsheet,
  User,
  ReceiptText,
  FilePlus2,
  PencilRuler,
  Wrench,
  Download,
} from "lucide-react"
import { type Order, formatCurrency, formatDate } from "@/lib/data"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import OrderEditForm from "./OrderEditForm"
import InvoiceGenerator from "./InvoiceGenerator"
import TransportationReceipt from "./TransportationReceipt"
import OrderDetailsModal from "./OrderView"
import type { RootState } from "@/redux/store"
import { useSelector } from "react-redux"
import WorkOrderForm from "./WorkOrder"
import { PaymentStatusPopup } from "./PaymentUpdateModel"
import { deleteOrderAPI } from "@/services2/operations/order"
import Swal from "sweetalert2"
import OrderPdfDownload from "@/utils/pdf/nextweek"
import { toast } from "@/components/ui/use-toast"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"


interface OrdersTableProps {
  orders: Order[]
  fetchOrders: () => void
  onDelete: (id: string) => void
  onPayment: (id: string, paymentMethod: any) => void
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, fetchOrders, onDelete, onPayment }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isTransportReceiptOpen, setIsTransportReceiptOpen] = useState(false)
  const navigate = useNavigate()
  const user = useSelector((state: RootState) => state.auth?.user ?? null)
  const [workOrderDialogOrder, setWorkOrderDialogOrder] = useState<Order | null>(null)
  const token = useSelector((state: RootState) => state.auth?.token ?? null)
  const [activeTab, setActiveTab] = useState<"Regural" | "NextWeek">("Regural")

  // PAYMENT MODEL
  const [open, setOpen] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [paymentOrder, setpaymentOrder] = useState<Order | null>(null)
  const [orderIdDB, setOrderIdDB] = useState("")
  const [totalAmount, setTotalAmount] = useState(0)

  useEffect(() => {
    if (!open) {
      setOrderId("")
      setTotalAmount(0)
    }
  }, [open])

  const handleEdit = (order: Order) => {
    navigate(`/orders/edit/${order._id}`)
  }

  const handleDelete = async (id: string, orderNumber: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete order ${orderNumber}. This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    })

    if (result.isConfirmed) {
      const deletedOrder = await deleteOrderAPI(id, token)

      if (deletedOrder) {
        // Swal.fire({
        //     title: 'Deleted!',
        //     text: `Order ${id} has been deleted.`,
        //     icon: 'success',
        //     timer: 1500,
        //     showConfirmButton: false,
        // });

        onDelete(id)
      }
    }
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailsModalOpen(true)
  }

  const handleViewClientProfile = (clientId: string) => {
    navigate(`/clients/profile/${clientId}`)
  }

  const handleSaveOrder = (updatedOrder: Order) => {
    toast({
      title: "Order Updated",
      description: `Order ${updatedOrder.id} has been updated successfully`,
    })
    setIsEditDialogOpen(false)
  }

  const handleGenerateInvoice = (order: Order) => {
    setSelectedOrder(order)
    setIsInvoiceOpen(true)
  }

  const handleTransportationReceipt = (order: Order) => {
    setSelectedOrder(order)
    setIsTransportReceiptOpen(true)
  }

  const handleCreateDocument = (order: Order, docType: string) => {
    setSelectedOrder(order)

    switch (docType) {
      case "invoice":
        setIsInvoiceOpen(true)
        break
      case "transport":
        setIsTransportReceiptOpen(true)
        break
      default:
        toast({
          title: "Document Creation",
          description: `Creating ${docType} for order ${order.id}`,
        })
    }
  }

  const handleCreateWorkOrder = (order: Order) => {
    setWorkOrderDialogOrder(order)
  }

  const handleNewOrder = () => {
    navigate("/orders/new")
  }

  const handleConvertToRegular = (order: Order) => {
    // You would implement the API call here to update the order type
    toast({
      title: "Order Converted",
      description: `Order ${order.id} has been converted to Regular`,
    })
    fetchOrders() // Refresh orders after conversion
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={14} />
      case "processing":
        return <Package size={14} />
      case "shipped":
        return <Truck size={14} />
      case "delivered":
        return <CheckCircle2 size={14} />
      case "cancelled":
        return <XCircle size={14} />
      case "paid":
        return <CheckCircle2 size={14} /> // You can change icon if needed
      default:
        return null
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700"
      case "processing":
        return "bg-blue-100 text-blue-700"
      case "shipped":
        return "bg-purple-100 text-purple-700"
      case "delivered":
        return "bg-green-100 text-green-700"
      case "cancelled":
        return "bg-red-100 text-red-700"
      case "paid":
        return "bg-emerald-100 text-emerald-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const filteredOrders = orders.filter(
    (order) =>
      (order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (order.orderType === activeTab || (!order.orderType && activeTab === "Regural")),
  )
  console.log(filteredOrders)

  const renderInvoiceGenerator = () => {
    if (!selectedOrder) return null

    return (
      <InvoiceGenerator
        order={selectedOrder}
        open={isInvoiceOpen}
        onClose={() => {
          setIsInvoiceOpen(false)
          setTimeout(() => setSelectedOrder(null), 300)
        }}
        onViewClientProfile={() => selectedOrder.clientId && handleViewClientProfile(selectedOrder.clientId)}
      />
    )
  }

  const renderTransportationReceipt = () => {
    if (!selectedOrder) return null

    return (
      <TransportationReceipt
        order={selectedOrder}
        open={isTransportReceiptOpen}
        onClose={() => {
          setIsTransportReceiptOpen(false)
          setTimeout(() => setSelectedOrder(null), 300)
        }}
        onViewClientProfile={() => selectedOrder.clientId && handleViewClientProfile(selectedOrder.clientId)}
      />
    )
  }



    const handleDownloadMergedProducts = (type:string) => {
      // Filter only NextWeek orders
      const nextWeekOrders = orders.filter((order) => order.orderType === type)
  
      if (nextWeekOrders.length === 0) {
        toast({
          title: "No orders found",
          description: "There are no Next Week orders to download",
          variant: "destructive",
        })
        return
      }
  
      // Find oldest and newest order dates
      const orderDates = nextWeekOrders.map((order) => new Date(order.createdAt))
      const oldestDate = new Date(Math.min(...orderDates.map((date) => date.getTime())))
      const newestDate = new Date(Math.max(...orderDates.map((date) => date.getTime())))
  
      // Format dates for display
      const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      }
  
      const dateRangeText = `${type} Orders (${formatDate(oldestDate)} - ${formatDate(newestDate)})`
  
      // Create a map to store merged product quantities
      const productMap = new Map()
  
      // Loop through all NextWeek orders and their items
      nextWeekOrders.forEach((order) => {
        order.items.forEach((item) => {
          const productId = item.product || item.productId || ""
          const productName = item.name || item.productName || ""
          const pricingType = item.pricingType?.toLowerCase() || "unit"
      
          if (!productMap.has(productId)) {
            productMap.set(productId, {
              id: productId,
              name: productName,
              boxQuantity: 0,
              unitQuantity: 0,
              unitLabel: "", // to show proper unit like "kg", "piece"
              totalPrice: 0,
            })
          }
      
          const productEntry = productMap.get(productId)
      
          if (pricingType === "box") {
            productEntry.boxQuantity += item.quantity
          } else {
            productEntry.unitQuantity += item.quantity
            productEntry.unitLabel = pricingType // store last non-box label
          }
      
          productEntry.totalPrice += item.total || item.price * item.quantity
        })
      })
  
      // Convert map to array
      const mergedProducts = Array.from(productMap.values())
  
      // Create PDF document
      const doc = new jsPDF()
  
      // Add title with date range
      doc.setFontSize(16)
      doc.text(dateRangeText, 14, 20)
  
      // Add order count information
      doc.setFontSize(12)
      doc.text(`Total User Order: ${nextWeekOrders.length}`, 14, 30)
  
      // Prepare data for table
      const tableData = Array.from(productMap.values()).map((product) => [
        product.name,
        product.boxQuantity > 0 ? product.boxQuantity.toString() : "",
        product.unitQuantity > 0 ? `${product.unitQuantity} ${product.unitLabel}` : ""
      ])
      
      
      
  
      // Calculate total value of all products
      const totalValue = mergedProducts.reduce((sum, product) => sum + product.totalPrice, 0)
  
      // Add table to PDF
      autoTable(doc, {
        head: [["Product Name", "Box Quantity", "Unit Quantity"]],
        body: tableData,
        startY: 40,
    
        theme: "striped",
        headStyles: { fillColor: [66, 66, 66] },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
      })
      
      
  
      // Save the PDF
      doc.save(`${type}-orders-${new Date().toISOString().split("T")[0]}.pdf`)
  
      toast({
        title: "PDF Download Started",
        description: `Merged product quantities for ${nextWeekOrders.length} NextWeek orders`,
      })
    }

    
  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-10" onClick={fetchOrders}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          {user.role === "admin" && (
            <Button size="sm" className="h-10" onClick={handleNewOrder}>
              <Plus size={16} className="mr-2" />
              New Order
            </Button>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center border-b">
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "Regural" ? "border-b-2 border-primary text-primary" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("Regural")}
          >
            Regular Orders
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "NextWeek" ? "border-b-2 border-primary text-primary" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("NextWeek")}
          >
            Next Week Orders
          </button>
        </div>
        { (
          <Button size="sm" variant="outline" className="mb-2 mr-2" onClick={()=>handleDownloadMergedProducts(activeTab)}>
            <Download size={16} className="mr-2" />
            Download Merged Products
          </Button>
        )}
      </div>
      <OrderDetailsModal
        order={selectedOrder}
        open={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        userRole={user.role}
      />

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">
                <div className="flex items-center">
                  Order ID
                  <ArrowUpDown size={14} className="ml-2" />
                </div>
              </TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span
                        className="cursor-pointer hover:text-primary hover:underline"
                        onClick={() => order.clientId && handleViewClientProfile(order.clientId)}
                      >
                        {order.clientName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(order.date)}</TableCell>
                  <TableCell>
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs w-fit",
                        getStatusClass(order.status),
                      )}
                    >
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <div
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs w-fit",
                          getStatusClass(order.paymentStatus),
                        )}
                      >
                        {getStatusIcon(order.paymentStatus)}
                        <span className="capitalize">{order.paymentStatus}</span>
                      </div>

                      {
                        <button
                          onClick={() => {
                            setOrderId(order.orderNumber)
                            setOpen(true)
                            setTotalAmount(order.total)
                            setOrderIdDB(order?._id || order?.id)
                            setpaymentOrder(order)
                          }}
                          className="mt-1 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                        >
                          {order.paymentStatus === "pending" ? "Pay Now" : "Edit"}
                        </button>
                      }
                      {activeTab === "NextWeek" && (
                        <button
                          onClick={() => handleConvertToRegular(order)}
                          className="mt-1 text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                        >
                          Convert to Regular
                        </button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{order.items.length} items</TableCell>
                  <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                          <FileText size={14} className="mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {order.clientId && (
                          <DropdownMenuItem onClick={() => handleViewClientProfile(order.clientId!)}>
                            <User size={14} className="mr-2" />
                            View Client Profile
                          </DropdownMenuItem>
                        )}
                        {user.role === "admin" && (
                          <DropdownMenuItem onClick={() => handleEdit(order)}>
                            <Edit size={14} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <FilePlus2 size={14} className="mr-2" />
                            Generate Documents
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="min-w-[220px]">
                            <DropdownMenuItem onClick={() => handleCreateDocument(order, "invoice")}>
                              <FileSpreadsheet size={14} className="mr-2" />
                              Invoice
                            </DropdownMenuItem>
                            {(!order.orderType || order.orderType === "Regural") && (
                              <>
                                <DropdownMenuItem onClick={() => handleCreateDocument(order, "transport")}>
                                  <Receipt size={14} className="mr-2" />
                                  Transportation Receipt
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCreateDocument(order, "delivery")}>
                                  <ReceiptText size={14} className="mr-2" />
                                  Delivery Note
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCreateDocument(order, "custom")}>
                                  <PencilRuler size={14} className="mr-2" />
                                  Custom Document
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCreateWorkOrder(order)}>
                                  <Wrench className="mr-2 h-4 w-4" /> Create Work Order
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />

                        {user.role === "admin" && (
                          <DropdownMenuItem
                            onClick={() => handleDelete(order?._id, order?.id)}
                            className="text-red-600 hover:text-red-700 focus:text-red-700"
                          >
                            <Trash size={14} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {renderInvoiceGenerator()}
      {renderTransportationReceipt()}

      {selectedOrder && isEditDialogOpen && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl">
            <OrderEditForm
              order={selectedOrder}
              onSubmit={handleSaveOrder}
              onCancel={() => setIsEditDialogOpen(false)}
              onViewClientProfile={() => selectedOrder.clientId && handleViewClientProfile(selectedOrder.clientId)}
            />
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={!!workOrderDialogOrder} onOpenChange={(open) => !open && setWorkOrderDialogOrder(null)}>
        <DialogContent className="max-w-4xl p-0">
          {workOrderDialogOrder && (
            <WorkOrderForm order={workOrderDialogOrder} onClose={() => setWorkOrderDialogOrder(null)} />
          )}
        </DialogContent>
      </Dialog>

      <PaymentStatusPopup
        open={open}
        onOpenChange={setOpen}
        orderId={orderId}
        totalAmount={totalAmount}
        id={orderIdDB}
        fetchOrders={fetchOrders}
        onPayment={onPayment}
        paymentOrder={paymentOrder}
      />
    </div>
  )
}

export default OrdersTable
