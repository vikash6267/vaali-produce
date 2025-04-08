import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, User } from "lucide-react";
import { Order } from "@/types";
import { getAllMembersAPI } from "@/services2/operations/auth";
import { getAllProductAPI } from "@/services2/operations/product";
import Select2, { GroupBase, Options } from "react-select";

// Define the OrderItem type with required fields
interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

// Define the order form schema
const formSchema = z.object({
  store: z.string().min(1, "Shop  is required"),
  status: z.string().min(1, "Status is required"),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Product ID is required"),
      productName: z.string().min(1, "Product name is required"),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      unitPrice: z.number().min(0, "Unit price must be at least 0"),
    })
  ),
});

type OrderFormValues = z.infer<typeof formSchema>;

interface OrderEditFormProps {
  order?: Order;
  onSubmit: (data: OrderFormValues) => void;
  setStoreDetails?: (data: string) => void;
  onCancel: () => void;
  onViewClientProfile?: () => void;
}

const OrderEditForm: React.FC<OrderEditFormProps> = ({
  order,
  onSubmit,
  onCancel,
  onViewClientProfile,
  setStoreDetails
}) => {
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState([]);
  const [products, setProducts] = useState([]);


  console.log(order)
  // Define default values for the form
  const defaultValues: OrderFormValues = {
    store: order?.store || "",
    status: order?.status || "pending",
    items: order?.items || [
      {
        productId: "",
        productName: "",
        quantity: 1,
        unitPrice: 0,
      },
    ],
  };

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Function to add a new item to the order
  const addItem = () => {
    const currentItems = form.getValues("items") || [];
    form.setValue("items", [
      ...currentItems,
      {
        productId: "",
        productName: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    const currentItems = form.getValues("items");
    if (currentItems.length > 1) {
      form.setValue(
        "items",
        currentItems.filter((_, i) => i !== index)
      );
    }
  };

  const calculateTotal = () => {
    const items = form.getValues("items");
    return items.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0
    );
  };

  const fetchStores = async () => {
    setLoading(true);
    try {
      const data = await getAllMembersAPI();
      const filteredData = data.filter((store) => store.role === "store");

      const formattedData = filteredData.map(({ _id, ...rest }) => ({
        id: _id,
        ...rest,
      }));

      setStore(formattedData);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await getAllProductAPI();
      console.log(response);
      if (response) {
        const updatedProducts = response.map((product) => ({
          ...product,
          id: product._id,
          lastUpdated: product?.updatedAt,
        }));
        console.log(updatedProducts)
        setProducts(updatedProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchStores();
    fetchProducts();
  }, []);



  const productOptions: { value: string; label: string, price: Number }[] = products.map(
    (product) => ({
      value: product.id,
      label: product.name,
      price: Number(product.pricePerBox),
    })
  );


  useEffect(()=>{

    
    setStoreDetails(form.getValues("store"))
  },[form.watch("store")])



  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="store"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Store</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select Store" />
                      </SelectTrigger>
                      <SelectContent>
                        {store.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.storeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {onViewClientProfile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={onViewClientProfile}
                        className="flex-shrink-0"
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border p-4 rounded-md">
          <h3 className="font-medium mb-4">Order Items</h3>



          {form.watch("items").map((_, index) => {
            return (
              <div key={index} className="grid grid-cols-12 gap-2 mb-4 items-end">

                {/* Product Select Dropdown */}
                <div className="col-span-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.productId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product</FormLabel>
                        <FormControl>
                          <Select2
                         
                            options={productOptions}
                            onChange={(selectedOption) => {
                              console.log(selectedOption)
                              field.onChange(selectedOption.value);
                              form.setValue(`items.${index}.productName`, selectedOption.label);
                              form.setValue(`items.${index}.unitPrice`, selectedOption.price);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Product Name (Disabled) */}
                <div className="col-span-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.productName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Quantity */}
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Unit Price */}
                <div className="col-span-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Remove Item Button */}
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={form.watch("items").length <= 1}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>

              </div>
            );
          })}


          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="mt-2 w-full"
          >
            Add Item
          </Button>

          <div className="mt-4 text-right">
            <p className="font-medium">Total: ${calculateTotal().toFixed(2)}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {order ? "Update Order" : "Create Order"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default OrderEditForm;