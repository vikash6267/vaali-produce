"use client"

import type React from "react"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { deleteProductAPI } from "@/services2/operations/product"
import {
  ChevronDown,
  ChevronUp,
  Trash,
  FileEdit,
  MoreHorizontal,
  Image,
  AlertTriangle,
  Calendar,
  Package,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Product } from "@/types"
import { format, isAfter, isBefore, addDays } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import AddProductForm from "./AddProductForm"
import { getSingleProductOrderAPI } from "@/services2/operations/product"

interface InventoryTableProps {
  products: Product[]
  onProductsSelect: (ids: string[]) => void
  selectedProducts: string[]
  onReorderProduct: (product: Product) => void
  fetchProducts: () => void
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  products,
  onProductsSelect,
  selectedProducts,
  onReorderProduct,
  fetchProducts,
}) => {
  const [sortField, setSortField] = useState("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [editProduct, setEditProduct] = useState(null)
  const [isEditProduct, setIsEditProduct] = useState(false)
  const [orderDetails, setOrderDetails] = useState(false)
  const [productOrderData, setProductOrderData] = useState(null)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedProducts = [...products].sort((a, b) => {
    let aValue = a[sortField as keyof Product]
    let bValue = b[sortField as keyof Product]

    if (typeof aValue === "string" && typeof bValue === "string") {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue === bValue) return 0

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      onProductsSelect([])
    } else {
      onProductsSelect(products.map((p) => p.id))
    }
  }

  const handleSelectProduct = (id: string) => {
    const isSelected = selectedProducts.includes(id)
    if (isSelected) {
      onProductsSelect(selectedProducts.filter((p) => p !== id))
    } else {
      onProductsSelect([...selectedProducts, id])
    }
  }

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
  }

  // Check if a product is nearing expiry (within 7 days)
  const isNearingExpiry = (product: Product) => {
    if (!product.expiryDate) return false
    const today = new Date()
    const expiryDate = new Date(product.expiryDate)
    const warningDate = addDays(today, 7) // 7 days from now
    return isBefore(expiryDate, warningDate) && isAfter(expiryDate, today)
  }

  const handleDelete = async (id) => {
    await deleteProductAPI(id)
    fetchProducts()
  }

  // Check if a product is expired
  const isExpired = (product: Product) => {
    if (!product.expiryDate) return false
    const today = new Date()
    const expiryDate = new Date(product.expiryDate)
    return isBefore(expiryDate, today)
  }

  const fetchProductOrder = async (id: string) => {
    const response = await getSingleProductOrderAPI(id)
    console.log(response)
    setProductOrderData(response)
    setOrderDetails(true)
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]">
              <Checkbox
                checked={selectedProducts.length === products.length && products.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="w-[60px]">Image</TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
              <div className="flex items-center">Product {renderSortIcon("name")}</div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
              <div className="flex items-center">Category {renderSortIcon("category")}</div>
            </TableHead>
            <TableHead className="text-right cursor-pointer" onClick={() => handleSort("quantity")}>
              <div className="flex items-center justify-end">Quantity {renderSortIcon("quantity")}</div>
            </TableHead>
            {/* <TableHead className="text-right cursor-pointer" onClick={() => handleSort("price")}>
              <div className="flex items-center justify-end">Price {renderSortIcon("price")}</div>
            </TableHead> */}
            <TableHead className="text-right">
              <div className="flex items-center justify-end">Price</div>
            </TableHead>
            {/* <TableHead className="cursor-pointer" onClick={() => handleSort("expiryDate")}>
              <div className="flex items-center">Expiry {renderSortIcon("expiryDate")}</div>
            </TableHead> */}
            <TableHead className="text-right cursor-pointer" onClick={() => handleSort("lastUpdated")}>
              <div className="flex items-center justify-end">Updated {renderSortIcon("lastUpdated")}</div>
            </TableHead>
            <TableHead className="text-right "> Order Actions</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProducts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                No products found
              </TableCell>
            </TableRow>
          ) : (
            sortedProducts.map((product) => (
              <TableRow
                key={product.id}
                className={`
                  ${selectedProducts.includes(product.id) ? "bg-muted/40" : ""}
                  ${isExpired(product) ? "bg-red-50 dark:bg-red-950/20" : ""}
                  ${isNearingExpiry(product) && !isExpired(product) ? "bg-amber-50 dark:bg-amber-950/20" : ""}
                `}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={() => handleSelectProduct(product.id)}
                  />
                </TableCell>
                <TableCell>
                  {product.image ? (
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded-md"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                      <Image className="w-5 h-5 text-muted-foreground/70" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium truncate max-w-[200px]">{product.name}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.palette && (
                      <div
                        className="w-3 h-3 rounded-full inline-block mr-1"
                        style={{ backgroundColor: product.palette }}
                      />
                    )}
                    {product.organic && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                        Organic
                      </Badge>
                    )}
                    {product.origin && (
                      <Badge variant="outline" className="text-xs">
                        {product.origin}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {product.category}
                  </Badge>
                  {product.batchInfo && (
                    <div className="text-xs text-muted-foreground mt-1">Batch: {product.batchInfo}</div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className={`font-medium ${product.quantity <= product.threshold ? "text-red-600" : ""}`}>
                    {product.quantity} 
                  </div>
                  {/* {product.weightVariation && product.weightVariation > 0 && (
                    <div className="text-xs text-muted-foreground">±{product.weightVariation}%</div>
                  )} */}
                </TableCell>
                {/* <TableCell className="text-right">
                  <div className="font-medium">
                    ${product.price.toFixed(2)}/{product.unit}
                  </div>
                  {product.bulkDiscounts && product.bulkDiscounts.length > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                      Volume Discount
                    </Badge>
                  )}
                </TableCell> */}
                <TableCell className="text-right">
                  {product.pricePerBox && product.boxSize ? (
                    <div className="flex items-center justify-end gap-1">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">${product.pricePerBox.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">
                       
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                {/* <TableCell>
                  {product.expiryDate ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span
                        className={`
                        text-sm 
                        ${isExpired(product) ? "text-red-600 font-medium" : ""} 
                        ${isNearingExpiry(product) && !isExpired(product) ? "text-amber-600 font-medium" : ""}
                      `}
                      >
                        {format(new Date(product.expiryDate), "MMM d, yyyy")}
                      </span>
                      {isExpired(product) && <AlertTriangle className="h-3 w-3 text-red-600 ml-1" />}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">N/A</span>
                  )}
                  {isNearingExpiry(product) && !isExpired(product) && (
                    <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-700 border-amber-300 text-xs">
                      Sell Soon
                    </Badge>
                  )}
                  {isExpired(product) && (
                    <Badge variant="outline" className="mt-1 bg-red-50 text-red-700 border-red-300 text-xs">
                      Expired
                    </Badge>
                  )}
                </TableCell> */}
                <TableCell className="text-right text-muted-foreground">
                  {new Date(product.lastUpdated).toLocaleDateString()}
                </TableCell>
                <TableCell
                  onClick={() => fetchProductOrder(product?._id)}
                  className="text-right text-muted-foreground cursor-pointer underline text-blue-800"
                >
                  {/* {product?.totalOrder} */}
                 Total
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {/* <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onReorderProduct(product)}
                      disabled={product.quantity > product.threshold}
                    >
                      <Truck className="h-4 w-4" />
                    </Button> */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditProduct(product.id)
                            setIsEditProduct(true)
                          }}
                        >
                          <FileEdit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {/* <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem> */}
                        <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-red-600">
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={isEditProduct} onOpenChange={setIsEditProduct}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Product</DialogTitle>
          </DialogHeader>
          <AddProductForm
            onSuccess={() => {
              fetchProducts()
              setIsEditProduct(false)
            }}
            editProduct={editProduct}
            isEditProduct={isEditProduct}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={orderDetails} onOpenChange={setOrderDetails}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Order Details (Last Mon,Tue,Wed)</DialogTitle>
          </DialogHeader>
          {productOrderData && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={productOrderData.productImage || "/placeholder.svg"}
                  alt={productOrderData.productTitle}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <h3 className="text-lg font-medium">{productOrderData.productTitle}</h3>
              </div>

              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">Buyers</h4>
                {productOrderData.buyers && productOrderData.buyers.length > 0 ? (
                  <div className="space-y-3">
                    {productOrderData.buyers.map((buyer, index) => (
                      <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                        <div className="flex justify-between">
                          <span className="font-medium">{buyer.name}</span>
                          <span className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            {buyer.quantity} 
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(buyer.orderDate).toLocaleDateString()} at{" "}
                          {new Date(buyer.orderDate).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No orders in the last 7 days</p>
                )}
              </div>
            </div>
          )}

          <div>
            Total Orders - {productOrderData?.totalOrdersThisWeek}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InventoryTable
