
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Eye, FileCheck, FileX, Calendar, ShoppingCart,
  FileUp, DollarSign, Package, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from '@/utils/formatters';
import { getReorders } from '@/data/reorderData';

// Mock vendor data - would come from API in real implementation
const mockVendors = [
  {
    id: 'v1',
    name: 'Green Valley Farms',
    type: 'farmer',
    contactName: 'John Smith',
    email: 'john@greenvalley.com',
    phone: '555-123-4567',
    products: ['Apples', 'Pears', 'Cherries'],
    rating: 4,
    activeStatus: 'active',
    createdAt: '2025-01-15',
  },
  {
    id: 'v2',
    name: 'Organic Supply Co.',
    type: 'distributor',
    contactName: 'Mary Johnson',
    email: 'mary@organicsupply.com',
    phone: '555-987-6543',
    products: ['Various Vegetables', 'Fruits'],
    rating: 5,
    activeStatus: 'active',
    createdAt: '2025-02-10',
  },
  {
    id: 'v3',
    name: 'Fresh Produce Distributors',
    type: 'supplier',
    contactName: 'Robert Lee',
    email: 'robert@fpd.com',
    phone: '555-567-8901',
    products: ['Tomatoes', 'Lettuce', 'Cucumbers'],
    rating: 3,
    activeStatus: 'inactive',
    createdAt: '2024-11-20',
  }
];

// Mock data - would come from API in real implementation
const mockPurchases = [
  {
    id: 'p1',
    vendorId: 'v1',
    vendorName: 'Green Valley Farms',
    date: '2025-04-01',
    status: 'quality-check',
    items: [
      {
        productId: 'prod1',
        productName: 'Organic Apples',
        quantity: 200,
        unit: 'lb',
        unitPrice: 1.25,
        totalPrice: 250,
        qualityStatus: 'pending'
      },
      {
        productId: 'prod2',
        productName: 'Pears',
        quantity: 150,
        unit: 'lb',
        unitPrice: 1.50,
        totalPrice: 225,
        qualityStatus: 'pending'
      }
    ],
    totalAmount: 475,
    purchaseOrderNumber: 'PO-2025-001',
    deliveryDate: '2025-04-03',
    invoiceUploaded: false,
    paymentStatus: 'pending'
  },
  {
    id: 'p2',
    vendorId: 'v2',
    vendorName: 'Organic Supply Co.',
    date: '2025-03-28',
    status: 'approved',
    items: [
      {
        productId: 'prod3',
        productName: 'Organic Tomatoes',
        quantity: 100,
        unit: 'lb',
        unitPrice: 2.00,
        totalPrice: 200,
        qualityStatus: 'approved'
      }
    ],
    totalAmount: 200,
    purchaseOrderNumber: 'PO-2025-002',
    deliveryDate: '2025-03-30',
    invoiceUploaded: true,
    paymentStatus: 'pending'
  },
  {
    id: 'p3',
    vendorId: 'v3',
    vendorName: 'Fresh Produce Distributors',
    date: '2025-03-25',
    status: 'rejected',
    items: [
      {
        productId: 'prod4',
        productName: 'Lettuce',
        quantity: 50,
        unit: 'boxes',
        unitPrice: 5.00,
        totalPrice: 250,
        qualityStatus: 'rejected',
        qualityNotes: 'Excessive wilting, poor quality'
      }
    ],
    totalAmount: 250,
    purchaseOrderNumber: 'PO-2025-003',
    deliveryDate: '2025-03-27',
    invoiceUploaded: false,
    paymentStatus: 'not-required'
  }
];

// Get reorder suggestions based on low inventory
const getReorderSuggestions = () => {
  // In a real app, this would check inventory levels and return products that need reordering
  return [
    { id: 'prod1', name: 'Organic Apples', quantity: 50, threshold: 100, unit: 'lb', suggestedVendors: ['v1', 'v2'] },
    { id: 'prod5', name: 'Bell Peppers', quantity: 20, threshold: 50, unit: 'each', suggestedVendors: ['v3'] }
  ];
};

const PurchasesList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showReorderSuggestions, setShowReorderSuggestions] = useState(false);
  
  const reorderSuggestions = getReorderSuggestions();
  
  // Filter purchases based on search term and status
  const filteredPurchases = mockPurchases.filter(purchase => {
    const matchesSearch = purchase.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          purchase.purchaseOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const variants = {
      'pending': { variant: 'outline', icon: <Calendar className="h-3 w-3 mr-1" /> },
      'received': { variant: 'secondary', icon: <ShoppingCart className="h-3 w-3 mr-1" /> },
      'quality-check': { variant: 'warning', icon: <Eye className="h-3 w-3 mr-1" /> },
      'approved': { variant: 'success', icon: <FileCheck className="h-3 w-3 mr-1" /> },
      'rejected': { variant: 'destructive', icon: <FileX className="h-3 w-3 mr-1" /> }
    };
    
    const { variant, icon } = variants[status] || variants.pending;
    
    return (
      <Badge variant={variant} className="capitalize flex items-center">
        {icon}
        {status.replace('-', ' ')}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const variants = {
      'paid': { variant: 'success', icon: <FileCheck className="h-3 w-3 mr-1" /> },
      'pending': { variant: 'warning', icon: <DollarSign className="h-3 w-3 mr-1" /> },
      'not-required': { variant: 'secondary', icon: <FileX className="h-3 w-3 mr-1" /> }
    };
    
    const { variant, icon } = variants[status] || variants.pending;
    
    return (
      <Badge variant={variant} className="capitalize flex items-center">
        {icon}
        {status.replace('-', ' ')}
      </Badge>
    );
  };
  
  const handleUploadInvoice = (purchaseId) => {
    // In a real app, this would open a file upload dialog
    console.log(`Upload invoice for purchase ${purchaseId}`);
    // Mock updating the invoice status
    const purchaseIndex = mockPurchases.findIndex(p => p.id === purchaseId);
    if (purchaseIndex !== -1) {
      mockPurchases[purchaseIndex].invoiceUploaded = true;
      // Force a re-render
      setSearchTerm(searchTerm);
    }
  };
  
  const handleCreateReorder = (product) => {
    navigate(`/vendors/new-purchase?productId=${product.id}&suggested=true`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Purchase Orders</CardTitle>
          <CardDescription>
            Track and manage purchases from vendors
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search purchases..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="quality-check">Quality Check</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => navigate('/vendors/new-purchase')} className="shrink-0">
              <ShoppingCart className="mr-2 h-4 w-4" />
              New Purchase
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase Order</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No purchases found. Try adjusting your filters or create a new purchase order.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">
                      {purchase.purchaseOrderNumber}
                    </TableCell>
                    <TableCell>{purchase.vendorName}</TableCell>
                    <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                    <TableCell>{formatCurrency(purchase.totalAmount)}</TableCell>
                    <TableCell>
                      {getStatusBadge(purchase.status)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(purchase.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" 
                                onClick={() => navigate(`/vendors/purchase/${purchase.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {purchase.status === 'quality-check' && (
                          <Button variant="ghost" size="icon" className="text-green-600"
                                  onClick={() => navigate(`/vendors/quality-control/${purchase.id}`)}>
                            <FileCheck className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {(purchase.status === 'approved' || purchase.status === 'received') && 
                         !purchase.invoiceUploaded && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-blue-600"
                                        onClick={() => handleUploadInvoice(purchase.id)}>
                                  <FileUp className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Upload Invoice</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Reorder Suggestions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Reorder Suggestions</CardTitle>
            <CardDescription>
              Products that need to be reordered based on current inventory levels
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowReorderSuggestions(!showReorderSuggestions)}>
            {showReorderSuggestions ? 'Hide' : 'Show'} Suggestions
          </Button>
        </CardHeader>
        
        {showReorderSuggestions && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Suggested Vendors</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reorderSuggestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No reorder suggestions at this time.
                    </TableCell>
                  </TableRow>
                ) : (
                  reorderSuggestions.map((product) => {
                    const suggestedVendorNames = product.suggestedVendors.map(
                      vendorId => mockVendors.find(v => v.id === vendorId)?.name || 'Unknown'
                    ).join(', ');
                    
                    return (
                      <TableRow key={product.id} className="bg-yellow-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                            {product.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-white">
                            {product.quantity} {product.unit}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-white">
                            {product.threshold} {product.unit}
                          </Badge>
                        </TableCell>
                        <TableCell>{suggestedVendorNames}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleCreateReorder(product)}>
                            <Package className="mr-2 h-4 w-4" />
                            Reorder
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
      
      {/* Pending Payments Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Pending Payments</CardTitle>
          <CardDescription>
            Outstanding payments for invoices received from vendors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase Order</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPurchases
                .filter(p => p.invoiceUploaded && p.paymentStatus === 'pending')
                .length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No pending payments at this time.
                  </TableCell>
                </TableRow>
              ) : (
                mockPurchases
                  .filter(p => p.invoiceUploaded && p.paymentStatus === 'pending')
                  .map((purchase) => {
                    // Mock invoice date (7 days after purchase date)
                    const purchaseDate = new Date(purchase.date);
                    const invoiceDate = new Date(purchaseDate);
                    invoiceDate.setDate(purchaseDate.getDate() + 7);
                    
                    // Mock due date (30 days after invoice date)
                    const dueDate = new Date(invoiceDate);
                    dueDate.setDate(invoiceDate.getDate() + 30);
                    
                    return (
                      <TableRow key={`payment-${purchase.id}`}>
                        <TableCell className="font-medium">
                          {purchase.purchaseOrderNumber}
                        </TableCell>
                        <TableCell>{purchase.vendorName}</TableCell>
                        <TableCell>{invoiceDate.toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(purchase.totalAmount)}</TableCell>
                        <TableCell>{dueDate.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/vendors/payment/${purchase.id}`)}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Pay
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchasesList;
