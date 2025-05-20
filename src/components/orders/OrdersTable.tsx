"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
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
import { deleteOrderAPI, getAllOrderAPI, updateOrderAPI } from "@/services2/operations/order"
import Swal from "sweetalert2"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface OrdersTableProps {
  orders: Order[]
  fetchOrders: () => void
  onDelete: (id: string) => void
  onPayment: (id: string, paymentMethod: any) => void
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders: initialOrders,
  fetchOrders: initialFetchOrders,
  onDelete,
  onPayment,
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [totalOrders, setTotalOrders] = useState(0)

  // PAYMENT MODEL
  const [open, setOpen] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [paymentOrder, setpaymentOrder] = useState<Order | null>(null)
  const [orderIdDB, setOrderIdDB] = useState("")
  const [totalAmount, setTotalAmount] = useState(0)

  const [statusOpen, setStatusOpen] = useState(false)
  const [statusOrderId, setStatusOrderId] = useState("")
  const [statusOrder, setStatusOrder] = useState<Order | null>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch orders with pagination and filtering
  const fetchOrders = async () => {
    setLoading(true)
    try {
      // Build query parameters
      const params = new URLSearchParams()
      params.append("page", currentPage.toString())
      params.append("limit", pageSize.toString())
      params.append("paymentStatus", paymentFilter.toString())

      if (debouncedSearchQuery) {
        params.append("search", debouncedSearchQuery)
      }

      params.append("orderType", activeTab)

      // Make API call with query parameters
      const response = await getAllOrderAPI(token, params.toString())
      console.log(response)
      if (response && Array.isArray(response.orders)) {
        setOrders(
          response.orders.map((order) => ({
            id: order?.orderNumber || `#${order._id.toString().slice(-5)}`,
            date: new Date(order.createdAt).toLocaleDateString(),
            clientName: order.store?.storeName || "Unknown",
            ...order,
          })),
        )

        setTotalOrders(response.totalOrders || response.orders.length)
        setTotalPages(Math.ceil((response.totalOrders || response.orders.length) / pageSize))
      } else {
        setOrders([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch orders when page, pageSize, search query or tab changes
  useEffect(() => {
    fetchOrders()
  }, [currentPage, pageSize, debouncedSearchQuery, activeTab, token, paymentFilter])

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
        onDelete(id)
        fetchOrders()
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
    fetchOrders()
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

  const renderInvoiceGenerator = () => {
    if (!selectedOrder) return null

    return (
      <InvoiceGenerator
        orderSingle={selectedOrder}
        open={isInvoiceOpen}
        onClose={() => {
          setIsInvoiceOpen(false)
          setTimeout(() => setSelectedOrder(null), 300)
          fetchOrders()
        }}
        fetchOrders={fetchOrders}
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

  const handleDownloadAllOrders = async (type: string) => {
    setLoading(true)
    try {
      // Fetch all orders for the selected type without pagination
        const params = new URLSearchParams()

      params.append("limit", "5000000")
      params.append("paymentStatus", paymentFilter.toString())

      if (debouncedSearchQuery) {
        params.append("search", debouncedSearchQuery)
      }

      params.append("orderType", activeTab)
      const response = await getAllOrderAPI(token, params.toString())

      if (!response || !Array.isArray(response.orders) || response.orders.length === 0) {
        toast({
          title: "No orders found",
          description: `There are no ${type} orders to download`,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const allOrders = response.orders

      // Find oldest and newest order dates
      const orderDates = allOrders.map((order) => new Date(order.createdAt))
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

      // Loop through all orders and their items
      allOrders.forEach((order) => {
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
      doc.text(`Total User Order: ${allOrders.length}`, 14, 30)

      // Prepare data for table
      const tableData = Array.from(productMap.values()).map((product) => [
        product.name,
        product.boxQuantity > 0 ? product.boxQuantity.toString() : "",
        product.unitQuantity > 0 ? `${product.unitQuantity} ${product.unitLabel}` : "",
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
        footStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
      })

      // Save the PDF
      doc.save(`${type}-orders-${new Date().toISOString().split("T")[0]}.pdf`)

      toast({
        title: "PDF Download Started",
        description: `All ${type} orders have been downloaded`,
      })
    } catch (error) {
      console.error("Error downloading orders:", error)
      toast({
        title: "Error",
        description: "Failed to download orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = []

    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink
          onClick={() => setCurrentPage(1)}
          isActive={currentPage === 1}
          className={cn(
            "px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer",
            currentPage === 1 ? "bg-primary text-white shadow" : "text-muted-foreground hover:bg-muted",
          )}
        >
          1
        </PaginationLink>
      </PaginationItem>,
    )

    // Show ellipsis if needed (before current range)
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Show surrounding pages: currentPage - 1 to currentPage + 1
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue // Already rendered
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => setCurrentPage(i)}
            isActive={currentPage === i}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              currentPage === i ? "bg-primary text-white shadow" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Show ellipsis if needed (after current range)
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Always show last page (if more than one page)
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink
            onClick={() => setCurrentPage(totalPages)}
            isActive={currentPage === totalPages}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer",
              currentPage === totalPages ? "bg-primary text-white shadow" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return items
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
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Orders</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Unpaid</option>
          </select>

          <Button size="sm" variant="outline" className="h-10" onClick={fetchOrders} disabled={loading}>
            {loading ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <RefreshCw size={16} className="mr-2" />}
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
            onClick={() => {
              setActiveTab("Regural")
              setCurrentPage(1)
            }}
          >
            Regular Orders
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "NextWeek" ? "border-b-2 border-primary text-primary" : "text-gray-500"
            }`}
            onClick={() => {
              setActiveTab("NextWeek")
              setCurrentPage(1)
            }}
          >
            Next Week Orders
          </button>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="mb-2 mr-2"
          onClick={() => handleDownloadAllOrders(activeTab)}
          disabled={loading}
        >
          <Download size={16} className="mr-2" />
          All Orders
        </Button>
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  <RefreshCw size={24} className="animate-spin mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading orders...</p>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Link
                        to={"/admin/store"}
                        className="cursor-pointer hover:text-primary hover:underline"
                        onClick={() => order.clientId && handleViewClientProfile(order.clientId)}
                      >
                        {order.clientName}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(order.date)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <div
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs w-fit",
                          getStatusClass(order.status),
                        )}
                      >
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </div>

                     {order.status !== "delivered" && <button
                        onClick={() => {
                          setStatusOrderId(order.orderNumber)
                          setStatusOpen(true)
                          setStatusOrder(order)
                          setOrderIdDB(order?._id || order?.id)
                        }}
                        className="mt-1 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                      >
                        Change Status
                      </button>}
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
                  <TableCell className="font-medium">
                    {formatCurrency(order.total)}
                    {order.paymentStatus === "partial" && <p>{formatCurrency(order.paymentAmount - order.total)}</p>}
                  </TableCell>
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

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-2 bg-white rounded-xl shadow-sm border border-muted">
        {/* Showing Results Text */}
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {orders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>{" "}
          to <span className="font-medium text-foreground">{Math.min(currentPage * pageSize, totalOrders)}</span> of{" "}
          <span className="font-medium text-foreground">{totalOrders}</span> orders
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center flex-wrap gap-4">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[90px]">
                <SelectValue placeholder="Per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Page Navigation */}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || loading}
                  className="cursor-pointer"
                />
              </PaginationItem>

              {renderPaginationItems()}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || loading}
                  className="cursor-pointer"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
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
      <StatusUpdatePopup
        open={statusOpen}
        onOpenChange={setStatusOpen}
        orderId={statusOrderId}
        id={orderIdDB}
        fetchOrders={fetchOrders}
        statusOrder={statusOrder}
        setOrders={setOrders}
        orders={orders}
      />
    </div>
  )
}

export const StatusUpdatePopup = ({
  open,
  onOpenChange,
  orderId,
  id,
  fetchOrders,
  statusOrder,
  setOrders,
  orders,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  id: string
  fetchOrders: () => void
  statusOrder: Order | null
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>
  orders: Order[]
}) => {
  const [status, setStatus] = useState(statusOrder?.status || "pending")
  const { toast } = useToast()
  const token = useSelector((state: RootState) => state.auth?.token ?? null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const finalData = {
        status,
      }

      // Call the API to update the status
      const updatedOrder = await updateOrderAPI(finalData, token, id)

      if (updatedOrder) {
        // Find the order in the orders array and update its status
        const updatedOrders = orders.map((order) => {
          if (order._id === id || order.id === id) {
            return { ...order, status }
          }
          return order
        })

        // Update the orders state directly
        setOrders(updatedOrders)

        toast({
          title: "Status Updated",
          description: `Order ${orderId} status has been updated to ${status}`,
        })

        // Close the popup
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2 text-center sm:text-left">
            <h3 className="text-lg font-semibold">Update Order Status</h3>
            <p className="text-sm text-muted-foreground">Change the status for order {orderId}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`border rounded-md p-4 cursor-pointer ${status === "pending" ? "border-primary bg-primary/10" : "border-gray-200"}`}
                  onClick={() => setStatus("pending")}
                >
                  <div className="flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-500 mr-2" />
                    <span className="font-medium">PENDING</span>
                  </div>
                </div>

                <div
                  className={`border rounded-md p-4 cursor-pointer ${status === "delivered" ? "border-primary bg-primary/10" : "border-gray-200"}`}
                  onClick={() => setStatus("delivered")}
                >
                  <div className="flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mr-2" />
                    <span className="font-medium">DELIVERED</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Status</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default OrdersTable
