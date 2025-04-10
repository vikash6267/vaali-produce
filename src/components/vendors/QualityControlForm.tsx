
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, AlertTriangle, XCircle, ArrowLeft, 
  ImagePlus, FileVideo, DollarSign, TrendingUp 
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VendorPurchase, PurchaseItem } from '@/types/vendor';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/shared/PageHeader';
import MediaUploader from '@/components/shared/MediaUploader';

interface QualityControlFormProps {
  purchaseId: string;
}

// Update the PurchaseItem interface to include mediaUrls
interface ExtendedPurchaseItem extends PurchaseItem {
  mediaUrls?: string[];
}

// Interface for vendor pricing data
interface VendorPriceData {
  vendorId: string;
  vendorName: string;
  averagePrice: number;
  lastPurchaseDate: string;
}

const QualityControlForm: React.FC<QualityControlFormProps> = ({ purchaseId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [purchase, setPurchase] = useState<VendorPurchase | null>(null);
  const [items, setItems] = useState<ExtendedPurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  // State for vendor price data
  const [vendorPrices, setVendorPrices] = useState<Record<string, VendorPriceData[]>>({});

  useEffect(() => {
    // Simulating API fetch
    setTimeout(() => {
      // Mock purchase data
      const mockPurchase: VendorPurchase = {
        id: purchaseId,
        vendorId: 'v123',
        vendorName: 'Green Farm Organics',
        date: new Date().toISOString(),
        status: 'quality-check',
        items: [
          {
            productId: 'p1',
            productName: 'Organic Tomatoes',
            quantity: 100,
            unit: 'kg',
            unitPrice: 2.5,
            totalPrice: 250,
            qualityStatus: 'pending',
            batchNumber: 'TOM-2023-001'
          },
          {
            productId: 'p2',
            productName: 'Yellow Onions',
            quantity: 50,
            unit: 'kg',
            unitPrice: 1.8,
            totalPrice: 90,
            qualityStatus: 'pending',
            batchNumber: 'ONI-2023-005'
          },
          {
            productId: 'p3',
            productName: 'Bell Peppers',
            quantity: 30,
            unit: 'kg',
            unitPrice: 3.2,
            totalPrice: 96,
            qualityStatus: 'pending',
            batchNumber: 'PEP-2023-002'
          }
        ],
        totalAmount: 436
      };
      
      // Add empty mediaUrls arrays to each item
      const itemsWithMedia = mockPurchase.items.map(item => ({
        ...item,
        mediaUrls: []
      }));
      
      setPurchase(mockPurchase);
      setItems(itemsWithMedia);
      
      // Fetch mock vendor price data
      fetchVendorPriceData(mockPurchase.items.map(item => item.productId));
    }, 1000);
  }, [purchaseId]);

  // Function to fetch vendor price data
  const fetchVendorPriceData = (productIds: string[]) => {
    // In a real app, this would be an API call
    // For now, we'll simulate with mock data
    
    // Mock vendor price data by product ID
    const mockVendorPrices: Record<string, VendorPriceData[]> = {
      'p1': [
        { 
          vendorId: 'v123', 
          vendorName: 'Green Farm Organics',
          averagePrice: 2.50, 
          lastPurchaseDate: '2025-04-05'
        },
        { 
          vendorId: 'v456', 
          vendorName: 'Fresh Fields',
          averagePrice: 2.35, 
          lastPurchaseDate: '2025-03-28'
        },
        { 
          vendorId: 'v789', 
          vendorName: 'Organic Valley',
          averagePrice: 2.65, 
          lastPurchaseDate: '2025-03-15'
        }
      ],
      'p2': [
        { 
          vendorId: 'v123', 
          vendorName: 'Green Farm Organics',
          averagePrice: 1.85, 
          lastPurchaseDate: '2025-04-05'
        },
        { 
          vendorId: 'v456', 
          vendorName: 'Fresh Fields',
          averagePrice: 1.75, 
          lastPurchaseDate: '2025-03-22'
        }
      ],
      'p3': [
        { 
          vendorId: 'v123', 
          vendorName: 'Green Farm Organics',
          averagePrice: 3.25, 
          lastPurchaseDate: '2025-04-05'
        },
        { 
          vendorId: 'v789', 
          vendorName: 'Organic Valley',
          averagePrice: 3.10, 
          lastPurchaseDate: '2025-03-18'
        }
      ]
    };
    
    // Simulate API delay
    setTimeout(() => {
      setVendorPrices(mockVendorPrices);
      setLoading(false);
    }, 500);
  };

  const handleStatusChange = (index: number, status: 'approved' | 'rejected') => {
    const updatedItems = [...items];
    updatedItems[index].qualityStatus = status;
    setItems(updatedItems);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const updatedItems = [...items];
    updatedItems[index].qualityNotes = notes;
    setItems(updatedItems);
  };

  const handleMediaUpload = (index: number, mediaUrls: string[]) => {
    const updatedItems = [...items];
    updatedItems[index].mediaUrls = mediaUrls;
    setItems(updatedItems);
  };

  // Function to get price comparison indicator
  const getPriceComparisonIndicator = (item: ExtendedPurchaseItem) => {
    const vendorData = vendorPrices[item.productId] || [];
    if (vendorData.length === 0) return null;
    
    // Calculate market average (excluding current vendor)
    const otherVendorPrices = vendorData.filter(v => v.vendorId !== purchase?.vendorId);
    if (otherVendorPrices.length === 0) return null;
    
    const marketAverage = otherVendorPrices.reduce(
      (sum, v) => sum + v.averagePrice, 0
    ) / otherVendorPrices.length;
    
    // Compare current price with market average
    const priceDifference = ((item.unitPrice - marketAverage) / marketAverage) * 100;
    
    // Return indicator based on price difference
    if (Math.abs(priceDifference) < 2) {
      return { 
        text: "Market average",
        color: "text-gray-500"
      };
    } else if (priceDifference < 0) {
      return { 
        text: `${Math.abs(priceDifference).toFixed(1)}% below market`,
        color: "text-green-600"
      };
    } else {
      return { 
        text: `${priceDifference.toFixed(1)}% above market`,
        color: "text-orange-500"
      };
    }
  };

  // Function to add approved items to inventory
  const addApprovedItemsToInventory = async (approvedItems: ExtendedPurchaseItem[]) => {
    try {
      // In a real app, this would make API calls to update inventory
      console.log('Adding approved items to inventory:', approvedItems);
      
      // For each approved item, we would typically:
      // 1. Check if product already exists in inventory
      // 2. If it exists, update quantity
      // 3. If not, create new product entry
      
      for (const item of approvedItems) {
        // Simulate API call to add/update inventory
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log(`Added ${item.quantity} ${item.unit} of ${item.productName} to inventory`);
        
        // Show toast for each item added
        toast({
          title: "Added to Inventory",
          description: `${item.quantity} ${item.unit} of ${item.productName} added to inventory`,
          variant: "default"
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error adding items to inventory:', error);
      toast({
        title: "Inventory Update Failed",
        description: "There was an error adding items to inventory",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleSubmit = async () => {
    // Check if all items have been assessed
    const unassessedItems = items.filter(item => item.qualityStatus === 'pending');
    
    if (unassessedItems.length > 0) {
      toast({
        title: "Incomplete Assessment",
        description: `${unassessedItems.length} items still need to be assessed`,
        variant: "destructive"
      });
      return;
    }

    // Filter approved items
    const approvedItems = items.filter(item => item.qualityStatus === 'approved');
    
    // If there are approved items, add them to inventory
    if (approvedItems.length > 0) {
      setLoading(true);
      const success = await addApprovedItemsToInventory(approvedItems);
      setLoading(false);
      
      if (!success) {
        // If inventory update failed, stop the submission process
        return;
      }
    }

    // Here you would send the updated purchase data to your backend
    toast({
      title: "Quality Control Complete",
      description: `Purchase #${purchaseId} quality assessment has been submitted`,
      variant: "default"
    });

    // Update purchase status based on quality control results
    const newStatus = items.every(item => item.qualityStatus === 'approved') 
      ? 'approved' 
      : items.every(item => item.qualityStatus === 'rejected')
        ? 'rejected'
        : 'partially-approved';
    
    // Log the final status (in a real app, this would be saved to the backend)
    console.log(`Purchase #${purchaseId} final status: ${newStatus}`);

    // Navigate back to purchases list
    navigate('/vendors');
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertTriangle className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading quality control form...</div>;
  }

  if (!purchase) {
    return <div className="text-center p-4">Purchase not found</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Quality Control Assessment"
        description={`Purchase #${purchase.id} from ${purchase.vendorName}`}
        actions={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/vendors')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vendors
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>Purchase Details</span>
            <Badge variant="outline">{purchase.status}</Badge>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            <p>Vendor: {purchase.vendorName}</p>
            <p>Date: {new Date(purchase.date).toLocaleDateString()}</p>
            <p>Total Amount: ${purchase.totalAmount.toFixed(2)}</p>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Items Quality Assessment</h2>
        
        {items.map((item, index) => (
          <Card key={item.productId} className="mb-4">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <h3 className="font-medium">{item.productName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {item.quantity} {item.unit}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Batch: {item.batchNumber}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      ${item.unitPrice.toFixed(2)} per {item.unit}
                    </p>
                    
                    {/* Price comparison indicator */}
                    {getPriceComparisonIndicator(item) && (
                      <div className={`text-xs flex items-center ${getPriceComparisonIndicator(item)?.color}`}>
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {getPriceComparisonIndicator(item)?.text}
                      </div>
                    )}
                  </div>
                  
                  {/* Vendor pricing history tooltip */}
                  {vendorPrices[item.productId] && vendorPrices[item.productId].length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" className="mt-2">
                            <DollarSign className="h-3 w-3 mr-1" />
                            View Vendor Pricing
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="w-60 p-0">
                          <div className="p-2 bg-background">
                            <p className="font-medium text-sm mb-2">Average Prices by Vendor</p>
                            <div className="space-y-1">
                              {vendorPrices[item.productId].map((vendor) => (
                                <div key={vendor.vendorId} className="flex justify-between text-xs py-1">
                                  <span className={vendor.vendorId === purchase.vendorId ? "font-semibold" : ""}>
                                    {vendor.vendorName}
                                    {vendor.vendorId === purchase.vendorId && " (current)"}
                                  </span>
                                  <span>${vendor.averagePrice.toFixed(2)}/{item.unit}</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Last updated: {new Date().toLocaleDateString()}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  <div className="mt-2">
                    {getStatusBadge(item.qualityStatus)}
                  </div>
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Quality Notes:</label>
                  <Textarea 
                    placeholder="Enter quality assessment notes"
                    value={item.qualityNotes || ''}
                    onChange={(e) => handleNotesChange(index, e.target.value)}
                  />
                  
                  <div className="mt-4">
                    <label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <ImagePlus className="h-4 w-4" />
                      <FileVideo className="h-4 w-4" />
                      Photo & Video Documentation:
                    </label>
                    <MediaUploader
                      onUpload={(files) => handleMediaUpload(index, files)}
                      initialFiles={item.mediaUrls || []}
                      maxFiles={5}
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2 flex flex-col space-y-2">
                  <label className="text-sm font-medium">Assessment:</label>
                  <div className="flex space-x-2">
                    <Button 
                      variant={item.qualityStatus === 'approved' ? 'default' : 'outline'}
                      className={item.qualityStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                      onClick={() => handleStatusChange(index, 'approved')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      variant={item.qualityStatus === 'rejected' ? 'destructive' : 'outline'}
                      onClick={() => handleStatusChange(index, 'rejected')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                  
                  <div className="mt-auto pt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.mediaUrls?.length || 0} media files attached
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <div className="flex justify-end">
          <Button size="lg" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : 'Complete Quality Assessment'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QualityControlForm;
