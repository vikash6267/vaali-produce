import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import InventoryTable from "@/components/inventory/InventoryTable";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Plus,
  BarChart3,
  Download,
  Upload,
  AlertTriangle,
  RefreshCw,
  Truck,
  DollarSign,
  ListFilter,
  Tags,
  Store,
  Loader,
} from "lucide-react";
import {
  getLowStockProducts,
  Product,
  createReorder,
  getReorders,
  Reorder,
} from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddProductForm from "@/components/inventory/AddProductForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryStats from "@/components/inventory/InventoryStats";
import BulkActions from "@/components/inventory/BulkActions";
import { Badge } from "@/components/ui/badge";
import ReorderForm from "@/components/inventory/ReorderForm";
import PriceUpdateModal from "@/components/inventory/PriceUpdateModal";
import PriceListUpdateModal from "@/components/inventory/PriceListUpdateModal";
import BulkDiscountModal from "@/components/inventory/BulkDiscountModal";
import { useNavigate } from "react-router-dom";
import { getAllProductAPI } from "@/services2/operations/product";

const Inventory = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [lowStockAlertOpen, setLowStockAlertOpen] = useState(false);
  const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false);
  const [selectedProductForReorder, setSelectedProductForReorder] =
    useState<Product | null>(null);
  const [reorders, setReorders] = useState<Reorder[]>(getReorders());
  const [isPriceUpdateOpen, setIsPriceUpdateOpen] = useState(false);
  const [isPriceListOpen, setIsPriceListOpen] = useState(false);
  const [isBulkDiscountOpen, setIsBulkDiscountOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);



  const fetchProducts = async () => {
    setLoading(true); // Start loading
    try {
      const response = await getAllProductAPI();
      console.log(response);
      if (response) {
        const updatedProducts = response.map((product) => ({
          ...product,
          id: product._id,
          lastUpdated: product?.updatedAt
        }));
        setProducts(updatedProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false); // Stop loading
    }
  };


  useEffect(() => {
    fetchProducts();
  }, []);

  const lowStockProducts = getLowStockProducts();

  useEffect(() => {
    if (lowStockProducts.length > 0 && !lowStockAlertOpen) {
      setTimeout(() => {
        setLowStockAlertOpen(true);
      }, 1000);
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleExport = () => {
    toast({
      title: "Exporting Inventory",
      description: "Your inventory data is being exported to CSV",
    });
  };

  const handleImport = () => {
    toast({
      title: "Import Inventory",
      description: "Please select a CSV file to import",
    });
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [...prev, newProduct]);
    toast({
      title: "Product Added",
      description: `${newProduct.name} has been added to inventory`,
    });
  };

  const handleProductsSelect = (productIds: string[]) => {
    setSelectedProducts(productIds);
  };

  const handleUpdateProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
  };

  const handleOpenReorderDialog = (product: Product) => {
    setSelectedProductForReorder(product);
    setIsReorderDialogOpen(true);
  };

  const handleReorder = (
    reorderData: Omit<
      Reorder,
      "id" | "dateCreated" | "expectedDelivery" | "status" | "productName"
    >
  ) => {
    if (!selectedProductForReorder) return;

    const newReorder = createReorder({
      ...reorderData,
      productName: selectedProductForReorder.name,
    });

    setReorders((prev) => [newReorder, ...prev]);

    toast({
      title: "Reorder Created",
      description: `${reorderData.quantity} ${selectedProductForReorder.unit} of ${selectedProductForReorder.name} has been reordered`,
    });
  };

  const handleBulkReorder = () => {
    if (selectedProducts.length === 0) return;

    const productToReorder = products.find((p) => p.id === selectedProducts[0]);
    if (productToReorder) {
      handleOpenReorderDialog(productToReorder);
    }
  };

  const handleOpenPriceUpdate = () => {
    if (selectedProducts.length > 0 || products.length > 0) {
      setIsPriceUpdateOpen(true);
    } else {
      toast({
        title: "No Products Available",
        description: "There are no products to update prices for",
        variant: "destructive",
      });
    }
  };

  const handleOpenPriceList = () => {
    setIsPriceListOpen(true);
  };

  const handleOpenBulkDiscount = () => {
    setIsBulkDiscountOpen(true);
  };

  const navigateToPriceList = () => {
    navigate("/price-list");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar isOpen={isSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        <main className="flex-1 overflow-y-auto">
          <div className="container px-4 py-6 mx-auto max-w-7xl">
            <div className="mb-6">
              <PageHeader
                title="Inventory Management"
                description="Manage your product inventory efficiently"
              >
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex"
                    onClick={handleExport}
                  >
                    <Download size={16} className="mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex"
                    onClick={handleImport}
                  >
                    <Upload size={16} className="mr-2" />
                    Import
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hidden sm:flex"
                    onClick={handleOpenPriceList}
                  >
                    <ListFilter size={16} className="mr-2" />
                    Price List
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hidden sm:flex"
                    onClick={handleOpenBulkDiscount}
                  >
                    <Tags size={16} className="mr-2" />
                    Volume Discounts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100 hidden sm:flex"
                    onClick={navigateToPriceList}
                  >
                    <Store size={16} className="mr-2" />
                    Store Price Lists
                  </Button>
                  <Button onClick={() => setIsAddProductOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Add Product
                  </Button>
                </div>
              </PageHeader>
            </div>

            {lowStockAlertOpen && lowStockProducts.length > 0 && (
              <Card className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950/10">
                <CardHeader className="py-3">
                  <div className="flex flex-wrap justify-between items-center">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <CardTitle className="text-base text-amber-700 dark:text-amber-400">
                        Low Stock Alert: {lowStockProducts.length}{" "}
                        {lowStockProducts.length === 1 ? "Product" : "Products"}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                        onClick={() => {
                          if (lowStockProducts.length > 0) {
                            handleOpenReorderDialog(lowStockProducts[0]);
                          }
                        }}
                      >
                        <Truck className="h-4 w-4 mr-1" />
                        Reorder
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                        onClick={() => setLowStockAlertOpen(false)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="flex flex-wrap gap-2">
                    {lowStockProducts.slice(0, 3).map((product) => (
                      <Badge
                        key={product.id}
                        variant="outline"
                        className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/20 cursor-pointer"
                        onClick={() => handleOpenReorderDialog(product)}
                      >
                        {product.name}: {product.quantity} {product.unit} left
                      </Badge>
                    ))}
                    {lowStockProducts.length > 3 && (
                      <Badge
                        variant="outline"
                        className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/20"
                      >
                        +{lowStockProducts.length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <BulkActions
              selectedProducts={selectedProducts}
              onClearSelection={() => setSelectedProducts([])}
              onUpdateProducts={handleUpdateProducts}
              products={products}
              onReorder={handleBulkReorder}
              onPriceUpdate={handleOpenPriceList}
              onBulkDiscount={handleOpenBulkDiscount}
            />

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="products">Products</TabsTrigger>
                  {/* <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="reorders">Reorders</TabsTrigger> */}
                </TabsList>
                <div className="flex sm:hidden space-x-2">
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download size={16} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleImport}>
                    <Upload size={16} />
                  </Button>
                </div>
              </div>


              {loading ? (
                <div className="flex justify-center items-center py-4">
                  <Loader className="animate-spin text-gray-600" size={32} />
                </div>
              ) : (
                <div>

                  <TabsContent value="products" className="space-y-4">
                    <Card>
                      <CardContent className="p-1 sm:p-6">
                        <InventoryTable
                          products={products}
                          onProductsSelect={handleProductsSelect}
                          selectedProducts={selectedProducts}
                          onReorderProduct={handleOpenReorderDialog}
                          fetchProducts={fetchProducts}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              )}


              <TabsContent value="analytics">
                <InventoryStats products={products} />
              </TabsContent>

              <TabsContent value="reorders">
                <Card>
                  <CardContent className="p-4">
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr className="border-b">
                            <th className="p-3 text-left font-medium">
                              Product
                            </th>
                            <th className="p-3 text-left font-medium">
                              Quantity
                            </th>
                            <th className="p-3 text-left font-medium">
                              Created
                            </th>
                            <th className="p-3 text-left font-medium">
                              Expected
                            </th>
                            <th className="p-3 text-left font-medium">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reorders.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="p-4 text-center text-muted-foreground"
                              >
                                No reorders found
                              </td>
                            </tr>
                          ) : (
                            reorders.map((reorder) => (
                              <tr key={reorder.id} className="border-b">
                                <td className="p-3 font-medium">
                                  {reorder.productName}
                                </td>
                                <td className="p-3">{reorder.quantity}</td>
                                <td className="p-3">{reorder.dateCreated}</td>
                                <td className="p-3">
                                  {reorder.expectedDelivery}{" "}
                                  {reorder.expedited && (
                                    <Badge
                                      variant="outline"
                                      className="ml-1 bg-blue-100 text-blue-700 border-blue-300"
                                    >
                                      Express
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-3">
                                  <Badge
                                    className={`
                                    ${reorder.status === "pending"
                                        ? "bg-amber-100 text-amber-700 border-amber-300"
                                        : ""
                                      }
                                    ${reorder.status === "ordered"
                                        ? "bg-blue-100 text-blue-700 border-blue-300"
                                        : ""
                                      }
                                    ${reorder.status === "received"
                                        ? "bg-green-100 text-green-700 border-green-300"
                                        : ""
                                      }
                                    ${reorder.status === "cancelled"
                                        ? "bg-red-100 text-red-700 border-red-300"
                                        : ""
                                      }
                                  `}
                                  >
                                    {reorder.status.charAt(0).toUpperCase() +
                                      reorder.status.slice(1)}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
              <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    Add New Product
                  </DialogTitle>
                </DialogHeader>
                <AddProductForm
                  onSuccess={() => { setIsAddProductOpen(false); fetchProducts() }}
                  onAddProduct={handleAddProduct}
                />
              </DialogContent>
            </Dialog>

            <Dialog
              open={isReorderDialogOpen}
              onOpenChange={setIsReorderDialogOpen}
            >
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Reorder Product</DialogTitle>
                </DialogHeader>
                {selectedProductForReorder && (
                  <ReorderForm
                    product={selectedProductForReorder}
                    onSuccess={() => setIsReorderDialogOpen(false)}
                    onReorder={handleReorder}
                  />
                )}
              </DialogContent>
            </Dialog>

            <PriceUpdateModal
              isOpen={isPriceUpdateOpen}
              onClose={() => setIsPriceUpdateOpen(false)}
              selectedProducts={
                selectedProducts
                  .map((id) => products.find((p) => p.id === id))
                  .filter(Boolean) as Product[]
              }
              allProducts={products}
              onUpdateProducts={handleUpdateProducts}
            />

            <PriceListUpdateModal
              isOpen={isPriceListOpen}
              onClose={() => setIsPriceListOpen(false)}
              products={products}
              onUpdateProducts={handleUpdateProducts}
            />

            <BulkDiscountModal
              isOpen={isBulkDiscountOpen}
              onClose={() => setIsBulkDiscountOpen(false)}
              products={products}
              selectedProducts={selectedProducts}
              onUpdateProducts={handleUpdateProducts}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Inventory;
