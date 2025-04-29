"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type {
  PriceListTemplate,
  PriceListProduct,
  PriceListTemplateFormProps,
} from "@/components/inventory/forms/formTypes"
import { formatCurrency } from "@/lib/data"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ImageIcon, Edit } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getAllProductAPI } from "@/services2/operations/product"

const formSchema = z.object({
  name: z.string().min(2, "Template name is required"),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]),
})

type FormValues = z.infer<typeof formSchema>

const PriceListTemplateForm: React.FC<PriceListTemplateFormProps> = ({ template, onSave, onCancel }) => {
  const [selectedProducts, setSelectedProducts] = useState<PriceListProduct[]>(template?.products || [])
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<string>("")
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [availableProducts, setAvailableProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [editingPriceField, setEditingPriceField] = useState(null)
  const [editPriceValue, setEditPriceValue] = useState("")

  // Start editing any price
  const startEditingPrice = (productId, field, value) => {
    setEditingProductId(productId)
    setEditingPriceField(field)
    setEditPriceValue(value ?? "") // agar undefined hai to empty
  }

  // Save edited price
  const savePrice = () => {
    if (editingProductId && editingPriceField) {
      setSelectedProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === editingProductId
            ? { ...product, [editingPriceField]: Number.parseFloat(editPriceValue) || 0 }
            : product,
        ),
      )
    }
    setEditingProductId(null)
    setEditingPriceField(null)
    setEditPriceValue("")
  }

  // Handle price input change
  const handlePriceChange = (e) => {
    setEditPriceValue(e.target.value)
  }

  // Handle Enter key to save

  // Render price input or text
  const renderEditablePrice = (productId, price, field) => {
    if (editingProductId === productId && editingPriceField === field) {
      return (
        <Input
          type="number"
          value={editPriceValue}
          onChange={handlePriceChange}
          onKeyDown={handleKeyDown}
          onBlur={savePrice}
          autoFocus
          step="0.01"
          min="0"
          className="w-24 text-right"
        />
      )
    }
    return (
      <div className="flex items-center justify-end gap-2">
        {formatCurrency(price)}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => startEditingPrice(productId, field, price)}
          type="button"
          className="h-7 w-7"
        >
          <Edit className="h-3.5 w-3.5 text-blue-500" />
        </Button>
      </div>
    )
  }

  const fetchProducts = async () => {
    try {
      const response = await getAllProductAPI()
      console.log(response)
      if (response) {
        const updatedProducts = response.map((product) => ({
          ...product,
          id: product._id,
          lastUpdated: product?.updatedAt,
        }))

        // Filter out products that are already in selectedProducts
        const filteredAvailableProducts = updatedProducts.filter(
          (product) => !selectedProducts.some((p) => p.id === product.id),
        )

        setAvailableProducts(filteredAvailableProducts)
        const categoryOptions = Array.from(new Set(updatedProducts.map((p) => p.category))).map((category) => ({
          label: category,
          value: category,
        }))
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      status: template?.status || "draft",
    },
  })

  const handleSubmit = (values: FormValues) => {
    if (selectedProducts.length === 0) {
      form.setError("root", {
        type: "manual",
        message: "You must select at least one product for the price list",
      })
      return
    }

    console.log(selectedProducts)

    const newTemplate: PriceListTemplate = {
      id: template?.id || "temp-id",
      name: values.name,
      description: values.description,
      status: values.status,
      createdAt: template?.createdAt || new Date().toISOString(),
      products: selectedProducts,
    }

    onSave(newTemplate)
  }

  const handleToggleProduct = (product) => {
    const isSelected = selectedProducts.some((p) => p.id === product.id)

    if (isSelected) {
      // Remove from selected and add back to available
      setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id))
      setAvailableProducts((prev) => [...prev, product])
    } else {
      // Remove from available and add to selected
      setAvailableProducts((prev) => prev.filter((p) => p.id !== product.id))
      setSelectedProducts((prev) => [...prev, { ...product, quantity: 0 }])
    }
  }

  const cancelEditPrice = () => {
    setEditingProductId(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      savePrice()
    } else if (e.key === "Escape") {
      cancelEditPrice()
    }
  }

  const handleQuantityChange = (productId: string, value: string) => {
    const quantity = Number.parseInt(value, 10)
    if (!isNaN(quantity) && quantity >= 0) {
      setQuantities((prevQuantities) => ({
        ...prevQuantities,
        [productId]: quantity,
      }))

      // Update selectedProducts with the new quantity
      setSelectedProducts((prevProducts) =>
        prevProducts.map((product) => (product.id === productId ? { ...product, quantity } : product)),
      )
    }
  }

  const handleSelectAll = () => {
    // Get all filtered products that aren't already selected
    const productsToSelect = filteredProducts.filter((product) => !selectedProducts.some((p) => p.id === product.id))

    // Add all filtered products to selected
    setSelectedProducts((prev) => [...prev, ...productsToSelect.map((product) => ({ ...product, quantity: 0 }))])

    // Remove all filtered products from available
    setAvailableProducts((prev) => prev.filter((product) => !filteredProducts.includes(product)))
  }

  const categories = ["All", ...new Set(availableProducts.map((p) => p.category))]

  const filteredProducts = availableProducts.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  useEffect(() => {
    // Filter out selected products from available products
    setAvailableProducts((prev) => prev.filter((product) => !selectedProducts.some((p) => p.id === product.id)))
  }, [selectedProducts])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter a name for this price list" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter an optional description for this price list" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <h3 className="text-lg font-medium mb-2">Selected Products</h3>
          {selectedProducts.length === 0 ? (
            <div className="text-center py-6 bg-muted/30 rounded-md border">
              <p className="text-muted-foreground">No products selected</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">A Price</TableHead>
                    <TableHead className="text-right">B Price</TableHead>
                    <TableHead className="text-right">C Price</TableHead>
                    <TableHead className="text-right">Restaurant Price</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-md">
                            <AvatarImage
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="object-cover"
                            />
                            <AvatarFallback className="rounded-md bg-muted">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          <span>{product.productName}</span>
                        </div>
                      </TableCell>

                      <TableCell>{product.name}</TableCell>

                      {/* Main Price */}
                      <TableCell className="text-right">
                        {renderEditablePrice(product.id, product.pricePerBox, "price")}
                      </TableCell>

                      {/* A Price */}
                      <TableCell className="text-right">
                        {renderEditablePrice(product.id, product.aPrice || 0, "aPrice")}
                      </TableCell>

                      {/* B Price */}
                      <TableCell className="text-right">
                        {renderEditablePrice(product.id, product.bPrice || 0, "bPrice")}
                      </TableCell>

                      {/* C Price */}
                      <TableCell className="text-right">
                        {renderEditablePrice(product.id, product.cPrice || 0, "cPrice")}
                      </TableCell>

                      {/* Restaurant Price */}
                      <TableCell className="text-right">
                        {renderEditablePrice(product.id, product.restaurantPrice || 0, "restaurantPrice")}
                      </TableCell>

                      {/* Quantity */}
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          value={product.quantity || ""}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                          className="w-20 mx-auto text-center"
                          placeholder="0"
                        />
                      </TableCell>

                      {/* Remove Product */}
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleToggleProduct(product)} type="button">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Available Products</h3>
          {availableProducts.length === 0 ? (
            <div className="text-center py-6 bg-muted/30 rounded-md border">
              <p className="text-muted-foreground">No additional products available</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-1/3"
                />

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border rounded-md p-2"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <Button type="button" onClick={handleSelectAll} variant="outline" className="whitespace-nowrap">
                  Select All 
                </Button>
              </div>

              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>

                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts?.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 rounded-md">
                              <AvatarImage
                                src={product.image || "/placeholder.svg"}
                                alt={product.name}
                                className="object-cover"
                              />
                              <AvatarFallback className="rounded-md bg-muted">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </AvatarFallback>
                            </Avatar>
                            <span>{product.name}</span>
                          </div>
                        </TableCell>

                        <TableCell>{product.unit}</TableCell>
                        <TableCell className="text-right">{formatCurrency(product.pricePerBox)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleProduct(product)}
                            type="button"
                          >
                            <Plus className="h-4 w-4 text-green-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </div>

        {form.formState.errors.root && (
          <div className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{template ? "Update Template" : "Create Template"}</Button>
        </div>
      </form>
    </Form>
  )
}

export default PriceListTemplateForm
