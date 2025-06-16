"use client"

import { useState, useEffect, useMemo } from "react"
import Navbar from "@/components/layout/Navbar"
import Sidebar from "@/components/layout/Sidebar"
import InventoryTable from "@/components/inventory/InventoryTable"
import PageHeader from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Download,
  Upload,
  AlertTriangle,
  Truck,
  ListFilter,
  Tags,
  Store,
  Loader,
  Search,
  Filter,
  SortAsc,
  SortDesc,
} from "lucide-react"
import { getLowStockProducts, type Product, createReorder, getReorders, type Reorder } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AddProductForm from "@/components/inventory/AddProductForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import InventoryStats from "@/components/inventory/InventoryStats"
import BulkActions from "@/components/inventory/BulkActions"
import { Badge } from "@/components/ui/badge"
import ReorderForm from "@/components/inventory/ReorderForm"
import PriceUpdateModal from "@/components/inventory/PriceUpdateModal"
import PriceListUpdateModal from "@/components/inventory/PriceListUpdateModal"
import BulkDiscountModal from "@/components/inventory/BulkDiscountModal"
import { useNavigate } from "react-router-dom"
import { getAllProductAPI,getAllProductSummaryAPI } from "@/services2/operations/product"

interface FilterState {
  search: string
  category: string
  sortBy: string
  sortOrder: "asc" | "desc"
  stockLevel: string
}

const Inventory = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("products")
  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [lowStockAlertOpen, setLowStockAlertOpen] = useState(false)
  const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false)
  const [selectedProductForReorder, setSelectedProductForReorder] = useState<Product | null>(null)
  const [reorders, setReorders] = useState<Reorder[]>(getReorders())
  const [isPriceUpdateOpen, setIsPriceUpdateOpen] = useState(false)
  const [isPriceListOpen, setIsPriceListOpen] = useState(false)
  const [isBulkDiscountOpen, setIsBulkDiscountOpen] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // Filter and Sort State
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "all",
    sortBy: "name",
    sortOrder: "asc",
    stockLevel: "all",
  })

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await getAllProductSummaryAPI()
      console.log(response)
      if (response) {
        const updatedProducts = response.map((product) => ({
          ...product,
          id: product._id,
          lastUpdated: product?.updatedAt,
          // Mock order frequency data - replace with actual data from your API
          orderFrequency: Math.floor(Math.random() * 100),
          totalOrders: Math.floor(Math.random() * 50),
        }))
        setProducts(updatedProducts)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Get unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map((product) => product.category))]
    return uniqueCategories.filter(Boolean)
  }, [products])

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products]

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          product.category?.toLowerCase().includes(filters.search.toLowerCase()) ||
          product.description?.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    // Category filter
    if (filters.category !== "all") {
      filtered = filtered.filter((product) => product.category === filters.category)
    }

    // Stock level filter - improved quantity-based filtering
    if (filters.stockLevel !== "all") {
      switch (filters.stockLevel) {
        case "out-of-stock":
          filtered = filtered.filter((product) => Number(product.quantity) === 0)
          break
        case "low":
          filtered = filtered.filter((product) => {
            const qty = Number(product.quantity) || 0
            const reorderLevel = Number(product.reorderLevel) || 10
            return qty > 0 && qty <= reorderLevel
          })
          break
        case "medium":
          filtered = filtered.filter((product) => {
            const qty = Number(product.quantity) || 0
            const reorderLevel = Number(product.reorderLevel) || 10
            return qty > reorderLevel && qty <= reorderLevel * 3
          })
          break
        case "high":
          filtered = filtered.filter((product) => {
            const qty = Number(product.quantity) || 0
            const reorderLevel = Number(product.reorderLevel) || 10
            return qty > reorderLevel * 3
          })
          break
        case "very-low":
          filtered = filtered.filter((product) => {
            const qty = Number(product.quantity) || 0
            return qty > 0 && qty <= 5
          })
          break
        case "critical":
          filtered = filtered.filter((product) => {
            const qty = Number(product.quantity) || 0
            return qty > 0 && qty <= 2
          })
          break
      }
    }

    // Sort products - FIXED SORTING LOGIC
    filtered.sort((a, b) => {
      let aValue, bValue
      let result = 0

 switch (filters.sortBy) {
  case "name":
    aValue = (a.name || "").toLowerCase();
    bValue = (b.name || "").toLowerCase();
    result = aValue.localeCompare(bValue);
    break;

  case "category":
    aValue = (a.category || "").toLowerCase();
    bValue = (b.category || "").toLowerCase();
    result = aValue.localeCompare(bValue);
    break;

  case "quantity":
    aValue = parseFloat(a.quantity) || 0;
    bValue = parseFloat(b.quantity) || 0;
    result = aValue - bValue;
    break;

  case "price":
    aValue = parseFloat(a.price) || 0;
    bValue = parseFloat(b.price) || 0;
    result = aValue - bValue;
    break;

  case "updatedAt":
    aValue = new Date(a.updatedAt || 0).getTime();
    bValue = new Date(b.updatedAt || 0).getTime();
    result = aValue - bValue;
    break;

  case "totalOrder": // ✅ actual field name
    aValue = parseFloat(a.totalOrder) || 0;
    bValue = parseFloat(b.totalOrder) || 0;
    result = aValue - bValue;
    break;

  default:
    aValue = (a.name || "").toLowerCase();
    bValue = (b.name || "").toLowerCase();
    result = aValue.localeCompare(bValue);
}


      // Apply sort order (ascending or descending)
      return filters.sortOrder === "desc" ? -result : result
    })

    console.log(
      "Filtered and sorted products:",
      filtered.length,
      "Sort by:",
      filters.sortBy,
      "Order:",
      filters.sortOrder,
    )
    return filtered
  }, [products, filters])




  const lowStockProducts = getLowStockProducts()

  useEffect(() => {
    if (lowStockProducts.length > 0 && !lowStockAlertOpen) {
      setTimeout(() => {
        setLowStockAlertOpen(true)
      }, 1000)
    }
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSortOrderToggle = () => {
    setFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
    }))
  }

  // Debug function to test sorting
  const debugSort = () => {
    console.log("Current filters:", filters)
    console.log("Products count:", products.length)
    console.log("Filtered count:", filteredAndSortedProducts.length)
    console.log(
      "First 3 products:",
      filteredAndSortedProducts.slice(0, 3).map((p) => ({
        name: p.name,
        quantity: p.quantity,
        price: p.price,
        category: p.category,
      })),
    )
  }

  // Call debug function whenever filters change
  useEffect(() => {
    debugSort()
  }, [filters, filteredAndSortedProducts])

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "all",
      sortBy: "name",
      sortOrder: "asc",
      stockLevel: "all",
    })
  }

  const handleExport = () => {
    toast({
      title: "Exporting Inventory",
      description: "Your inventory data is being exported to CSV",
    })
  }

  const handleImport = () => {
    toast({
      title: "Import Inventory",
      description: "Please select a CSV file to import",
    })
  }

  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [...prev, newProduct])
    toast({
      title: "Product Added",
      description: `${newProduct.name} has been added to inventory`,
    })
  }

  const handleProductsSelect = (productIds: string[]) => {
    setSelectedProducts(productIds)
  }

  const handleUpdateProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts)
  }

  const handleOpenReorderDialog = (product: Product) => {
    setSelectedProductForReorder(product)
    setIsReorderDialogOpen(true)
  }

  const handleReorder = (
    reorderData: Omit<Reorder, "id" | "dateCreated" | "expectedDelivery" | "status" | "productName">,
  ) => {
    if (!selectedProductForReorder) return

    const newReorder = createReorder({
      ...reorderData,
      productName: selectedProductForReorder.name,
    })

    setReorders((prev) => [newReorder, ...prev])

    toast({
      title: "Reorder Created",
      description: `${reorderData.quantity} ${selectedProductForReorder.unit} of ${selectedProductForReorder.name} has been reordered`,
    })
  }

  const handleBulkReorder = () => {
    if (selectedProducts.length === 0) return

    const productToReorder = products.find((p) => p.id === selectedProducts[0])
    if (productToReorder) {
      handleOpenReorderDialog(productToReorder)
    }
  }

  const handleOpenPriceUpdate = () => {
    if (selectedProducts.length > 0 || products.length > 0) {
      setIsPriceUpdateOpen(true)
    } else {
      toast({
        title: "No Products Available",
        description: "There are no products to update prices for",
        variant: "destructive",
      })
    }
  }

  const handleOpenPriceList = () => {
    setIsPriceListOpen(true)
  }

  const handleOpenBulkDiscount = () => {
    setIsBulkDiscountOpen(true)
  }

  const navigateToPriceList = () => {
    navigate("/price-list")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar isOpen={isSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        <main className="flex-1 overflow-y-auto">
          <div className="container px-4 py-6 mx-auto max-w-7xl">
            <div className="mb-6">
              <PageHeader title="Inventory Management" description="Manage your product inventory efficiently">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="hidden sm:flex" onClick={handleExport}>
                    <Download size={16} className="mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="hidden sm:flex" onClick={handleImport}>
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

            {/* Enhanced Filter and Search Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Search & Filter Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search products..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Category Filter */}
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Stock Level Filter */}
                  {/* <Select value={filters.stockLevel} onValueChange={(value) => handleFilterChange("stockLevel", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Stock Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock Levels</SelectItem>
                      <SelectItem value="out-of-stock">Out of Stock (0)</SelectItem>
                      <SelectItem value="critical">Critical (1-2)</SelectItem>
                      <SelectItem value="very-low">Very Low (1-5)</SelectItem>
                      <SelectItem value="low">Low Stock (Below Reorder Level)</SelectItem>
                      <SelectItem value="medium">Medium Stock (1-3x Reorder Level)</SelectItem>
                      <SelectItem value="high">High Stock (Above 3x Reorder Level)</SelectItem>
                    </SelectContent>
                  </Select> */}

                  {/* Sort By */}
                  {/* <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Product Name</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="quantity">Quantity</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="lastUpdated">Last Updated</SelectItem>
                      <SelectItem value="orderFrequency">Order Frequency</SelectItem>
                      <SelectItem value="totalOrders">Total Orders</SelectItem>
                    </SelectContent>
                  </Select> */}

                  {/* Sort Order Toggle */}
                  {/* <Button variant="outline" onClick={handleSortOrderToggle} className="flex items-center gap-2">
                    {filters.sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    {filters.sortOrder === "asc" ? "Ascending" : "Descending"}
                  </Button> */}

                  {/* Clear Filters */}
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear Filters
                  </Button>
                </div>

                {/* Filter Summary */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {filters.search && <Badge variant="secondary">Search: "{filters.search}"</Badge>}
                  {filters.category !== "all" && <Badge variant="secondary">Category: {filters.category}</Badge>}
                  {filters.stockLevel !== "all" && (
                    <Badge variant="secondary">
                      Stock:{" "}
                      {filters.stockLevel === "out-of-stock"
                        ? "Out of Stock"
                        : filters.stockLevel === "critical"
                          ? "Critical (1-2)"
                          : filters.stockLevel === "very-low"
                            ? "Very Low (1-5)"
                            : filters.stockLevel === "low"
                              ? "Low Stock"
                              : filters.stockLevel === "medium"
                                ? "Medium Stock"
                                : filters.stockLevel === "high"
                                  ? "High Stock"
                                  : filters.stockLevel.replace("-", " ")}
                    </Badge>
                  )}
                  {/* <Badge variant="secondary">
                    Sort: {filters.sortBy.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} (
                    {filters.sortOrder === "asc" ? "A-Z" : "Z-A"})
                  </Badge> */}
                  <Badge variant="outline">
                    Showing {filteredAndSortedProducts.length} of {products.length} products
                  </Badge>
                </div>
              </CardContent>
            </Card>

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
                            handleOpenReorderDialog(lowStockProducts[0])
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
              products={filteredAndSortedProducts}
              onReorder={handleBulkReorder}
              onPriceUpdate={handleOpenPriceList}
              onBulkDiscount={handleOpenBulkDiscount}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="products">Products</TabsTrigger>
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
                          products={filteredAndSortedProducts}
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
                <InventoryStats products={filteredAndSortedProducts} />
              </TabsContent>

              <TabsContent value="reorders">
                <Card>
                  <CardContent className="p-4">
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr className="border-b">
                            <th className="p-3 text-left font-medium">Product</th>
                            <th className="p-3 text-left font-medium">Quantity</th>
                            <th className="p-3 text-left font-medium">Created</th>
                            <th className="p-3 text-left font-medium">Expected</th>
                            <th className="p-3 text-left font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reorders.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                No reorders found
                              </td>
                            </tr>
                          ) : (
                            reorders.map((reorder) => (
                              <tr key={reorder.id} className="border-b">
                                <td className="p-3 font-medium">{reorder.productName}</td>
                                <td className="p-3">{reorder.quantity}</td>
                                <td className="p-3">{reorder.dateCreated}</td>
                                <td className="p-3">
                                  {reorder.expectedDelivery}{" "}
                                  {reorder.expedited && (
                                    <Badge variant="outline" className="ml-1 bg-blue-100 text-blue-700 border-blue-300">
                                      Express
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-3">
                                  <Badge
                                    className={`
                                      ${reorder.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-300" : ""}
                                      ${reorder.status === "ordered" ? "bg-blue-100 text-blue-700 border-blue-300" : ""}
                                      ${reorder.status === "received" ? "bg-green-100 text-green-700 border-green-300" : ""}
                                      ${reorder.status === "cancelled" ? "bg-red-100 text-red-700 border-red-300" : ""}
                                    `}
                                  >
                                    {reorder.status.charAt(0).toUpperCase() + reorder.status.slice(1)}
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

            {/* All existing dialogs remain the same */}
            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
              <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">Add New Product</DialogTitle>
                </DialogHeader>
                <AddProductForm
                  onSuccess={() => {
                    setIsAddProductOpen(false)
                    fetchProducts()
                  }}
                  onAddProduct={handleAddProduct}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isReorderDialogOpen} onOpenChange={setIsReorderDialogOpen}>
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
                selectedProducts.map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[]
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
  )
}

export default Inventory
