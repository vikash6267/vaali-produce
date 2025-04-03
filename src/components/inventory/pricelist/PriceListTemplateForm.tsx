import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PriceListTemplate, PriceListProduct, PriceListTemplateFormProps } from '@/components/inventory/forms/formTypes';
import { products, formatCurrency } from '@/lib/data';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ImageIcon, Edit, DollarSign } from 'lucide-react';
import { convertBulkDiscountToFormFormat } from '@/data/clientData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAllProductAPI } from "@/services2/operations/product";

const formSchema = z.object({
  name: z.string().min(2, 'Template name is required'),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived'])
});

type FormValues = z.infer<typeof formSchema>;

const PriceListTemplateForm: React.FC<PriceListTemplateFormProps> = ({
  template,
  onSave,
  onCancel
}) => {
  const [selectedProducts, setSelectedProducts] = useState<PriceListProduct[]>(
    template?.products || []
  );
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [availableProducts,setAvailableProducts] = useState([])



  const fetchProducts = async () => {
    try {
      const response = await getAllProductAPI();
      console.log(response);
      if (response) {
        const updatedProducts = response.map((product) => ({
          ...product,
          id: product._id,
          lastUpdated:product?.updatedAt
        }));
        setAvailableProducts(updatedProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: template?.name || '',
      description: template?.description || '',
      status: template?.status || 'draft'
    }
  });
  
  const handleSubmit = (values: FormValues) => {
    if (selectedProducts.length === 0) {
      form.setError('root', { 
        type: 'manual', 
        message: 'You must select at least one product for the price list' 
      });
      return;
    }
    

    console.log(selectedProducts)

    const newTemplate: PriceListTemplate = {
      id: template?.id || 'temp-id',
      name: values.name,
      description: values.description,
      status: values.status,
      createdAt: template?.createdAt || new Date().toISOString(),
      products: selectedProducts
    };
    
    onSave(newTemplate);
  };
  
  const handleToggleProduct = (product: PriceListProduct) => {
    const isSelected = selectedProducts.some(p => p.id === product.id);
    
    if (isSelected) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  };
  
  const startEditingPrice = (productId: string, currentPrice: number) => {
    setEditingProductId(productId);
    setEditPrice(currentPrice.toString());
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditPrice(e.target.value);
  };
  
  const savePrice = () => {
    if (!editingProductId) return;
    
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) return;
    
    setSelectedProducts(prev => 
      prev.map(product => 
        product.id === editingProductId 
          ? { ...product, price } 
          : product
      )
    );
    
    setEditingProductId(null);
  };
  
  const cancelEditPrice = () => {
    setEditingProductId(null);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      savePrice();
    } else if (e.key === 'Escape') {
      cancelEditPrice();
    }
  };
  
  const handleQuantityChange = (productId: string, value: string) => {
    const quantity = parseInt(value, 10);
    if (!isNaN(quantity) && quantity >= 0) {
      setQuantities(prevQuantities => ({
        ...prevQuantities,
        [productId]: quantity
      }));
  
      // Update selectedProducts with the new quantity
      setSelectedProducts(prevProducts => 
        prevProducts.map(product =>
          product.id === productId ? { ...product, quantity } : product
        )
      );
    }
  };
  
  



  // const availableProducts = products.map(p => {
  //   const formattedDiscounts = p.bulkDiscounts ? 
  //     convertBulkDiscountToFormFormat(p.bulkDiscounts) : 
  //     undefined;
    
  //   return {
  //     id: p.id,
  //     productId: p.id,
  //     productName: p.name,
  //     category: p.category,
  //     unit: p.unit,
  //     price: p.price,
  //     bulkDiscounts: formattedDiscounts,
  //     image: p.image
  //   };
  // }).filter(p => !selectedProducts.some(sp => sp.id === p.id));

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
                <Textarea 
                  placeholder="Enter an optional description for this price list" 
                  rows={3}
                  {...field} 
                />
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-md">
                            <AvatarImage 
                              src={product.image} 
                              alt={product.productName}
                              className="object-cover"
                            />
                            <AvatarFallback className="rounded-md bg-muted">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          <span>{product.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell className="text-right">
                        {editingProductId === product.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              value={editPrice}
                              onChange={handlePriceChange}
                              onKeyDown={handleKeyDown}
                              onBlur={savePrice}
                              autoFocus
                              step="0.01"
                              min="0"
                              className="w-24 text-right"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {formatCurrency(product.price)}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => startEditingPrice(product.id, product.price)}
                              type="button"
                              className="h-7 w-7"
                            >
                              <Edit className="h-3.5 w-3.5 text-blue-500" />
                            </Button>
                          </div>
                        )}
                        {product.bulkDiscounts && product.bulkDiscounts.length > 0 && (
                          <div className="text-xs text-green-600 font-medium">
                            Volume discounts available
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number" 
                          min="0"
                          value={product.quantity || ''}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                          className="w-20 mx-auto text-center"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleToggleProduct(product)}
                          type="button"
                        >
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
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 rounded-md">
                              <AvatarImage 
                                src={product.image} 
                                alt={product.productName}
                                className="object-cover"
                              />
                              <AvatarFallback className="rounded-md bg-muted">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </AvatarFallback>
                            </Avatar>
                            <span>{product.productName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
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
          <div className="text-sm font-medium text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PriceListTemplateForm;
