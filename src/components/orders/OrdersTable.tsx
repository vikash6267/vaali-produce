
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Wrench
} from 'lucide-react';
import { Order, formatCurrency, formatDate } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import OrderEditForm from './OrderEditForm';
import InvoiceGenerator from './InvoiceGenerator';
import TransportationReceipt from './TransportationReceipt';
import OrderDetailsModal from './OrderView';
import { RootState } from '@/redux/store';
import { useSelector } from 'react-redux';
import WorkOrderForm from './WorkOrder';

interface OrdersTableProps {
  orders: Order[];
  fetchOrders:()=>void
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders,fetchOrders }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isTransportReceiptOpen, setIsTransportReceiptOpen] = useState(false);
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth?.user ?? null);
  const [workOrderDialogOrder, setWorkOrderDialogOrder] = useState<Order | null>(null);

  const handleEdit = (order: Order) => {
    navigate(`/orders/edit/${order._id}`);
  };

  const handleDelete = (id: string) => {
    toast({
      title: "Delete Order",
      description: `Deleting order ${id}`,
      variant: "destructive",
    });
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailsModalOpen(true)

  
  };

  const handleViewClientProfile = (clientId: string) => {
    navigate(`/clients/profile/${clientId}`);
  };

  const handleSaveOrder = (updatedOrder: Order) => {
    toast({
      title: "Order Updated",
      description: `Order ${updatedOrder.id} has been updated successfully`,
    });
    setIsEditDialogOpen(false);
  };

  const handleGenerateInvoice = (order: Order) => {
    setSelectedOrder(order);
    setIsInvoiceOpen(true);
  };

  const handleTransportationReceipt = (order: Order) => {
    setSelectedOrder(order);
    setIsTransportReceiptOpen(true);
  };

  const handleCreateDocument = (order: Order, docType: string) => {
    setSelectedOrder(order);

    switch (docType) {
      case 'invoice':
        setIsInvoiceOpen(true);
        break;
      case 'transport':
        setIsTransportReceiptOpen(true);
        break;
      default:
        toast({
          title: "Document Creation",
          description: `Creating ${docType} for order ${order.id}`,
        });
    }
  };

  const handleCreateWorkOrder = (order: Order) => {
    setWorkOrderDialogOrder(order);
  };

  const handleNewOrder = () => {
    navigate('/orders/new');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={14} />;
      case 'processing':
        return <Package size={14} />;
      case 'shipped':
        return <Truck size={14} />;
      case 'delivered':
        return <CheckCircle2 size={14} />;
      case 'cancelled':
        return <XCircle size={14} />;
      default:
        return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return "bg-amber-100 text-amber-700";
      case 'processing':
        return "bg-blue-100 text-blue-700";
      case 'shipped':
        return "bg-purple-100 text-purple-700";
      case 'delivered':
        return "bg-green-100 text-green-700";
      case 'cancelled':
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredOrders = orders.filter(order =>
    order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderInvoiceGenerator = () => {
    if (!selectedOrder) return null;

    return (
      <InvoiceGenerator
        order={selectedOrder}
        open={isInvoiceOpen}
        onClose={() => {
          setIsInvoiceOpen(false);
          setTimeout(() => setSelectedOrder(null), 300);
        }}
        onViewClientProfile={() => selectedOrder.clientId && handleViewClientProfile(selectedOrder.clientId)}
      />
    );
  };

  const renderTransportationReceipt = () => {
    if (!selectedOrder) return null;

    return (
      <TransportationReceipt
        order={selectedOrder}
        open={isTransportReceiptOpen}
        onClose={() => {
          setIsTransportReceiptOpen(false);
          setTimeout(() => setSelectedOrder(null), 300);
        }}
        onViewClientProfile={() => selectedOrder.clientId && handleViewClientProfile(selectedOrder.clientId)}
      />
    );
  };

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
            <RefreshCw size={16} className="mr-2"  />
            Refresh
          </Button>
         {user.role === "admin" &&   <Button size="sm" className="h-10" onClick={handleNewOrder}>
            <Plus size={16} className="mr-2" />
            New Order
          </Button>}
        </div>
      </div>
      <OrderDetailsModal
        order={selectedOrder}
        open={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        userRole={"admin"}
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
                    <div className={cn(
                      "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs w-fit",
                      getStatusClass(order.status)
                    )}>
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
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
                        <DropdownMenuItem onClick={() => handleEdit(order)}>
                          <Edit size={14} className="mr-2" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <FilePlus2 size={14} className="mr-2" />
                            Generate Documents
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="min-w-[220px]">
                            <DropdownMenuItem onClick={() => handleCreateDocument(order, 'invoice')}>
                              <FileSpreadsheet size={14} className="mr-2" />
                              Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateDocument(order, 'transport')}>
                              <Receipt size={14} className="mr-2" />
                              Transportation Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateDocument(order, 'delivery')}>
                              <ReceiptText size={14} className="mr-2" />
                              Delivery Note
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateDocument(order, 'custom')}>
                              <PencilRuler size={14} className="mr-2" />
                              Custom Document
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateWorkOrder(order)}>
                        <Wrench className="mr-2 h-4 w-4" /> Create Work Order
                      </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => handleDelete(order.id)}
                          className="text-red-600 hover:text-red-700 focus:text-red-700"
                        >
                          <Trash size={14} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
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
                  <WorkOrderForm 
                    order={workOrderDialogOrder}
                    onClose={() => setWorkOrderDialogOrder(null)} 
                  />
                )}
              </DialogContent>
            </Dialog>
    </div>
  );
};

export default OrdersTable;