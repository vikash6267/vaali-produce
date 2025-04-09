import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PriceListTemplate,
  PriceListProduct,
  InvoiceData,
} from "@/components/inventory/forms/formTypes";
import { formatCurrency } from "@/utils/formatters";
import { Check, FileText, Loader2, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportInvoiceToPDF } from "@/utils/pdf";
import { getAllStoresAPI } from "@/services2/operations/auth";
import { getSinglePriceAPI } from "@/services2/operations/priceList";
import Select2 from "react-select";
import { createOrderAPI } from "@/services2/operations/order";
import { getUserAPI } from "@/services2/operations/auth";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { OrderItem } from "@/types";
import { useNavigate } from "react-router-dom";
import StoreRegistration from "./StoreRegistration";
import AddressForm from "@/components/AddressFields";

const CreateOrderModalStore = ({ }) => {
  const user = useSelector((state: RootState) => state.auth?.user ?? null);
  const [selectedStore, setSelectedStore] = useState<{
    label: string;
    value: string;
  } | null>(
    user && user.role !== "admin"
      ? { label: user.storeName || user.name, value: user._id }
      : null
  );


  const [email, setEmail] = useState("");
  const [template, setTemlate] = useState<PriceListTemplate | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const { toast } = useToast();
  const [stores, setStores] = useState([]);
  const token = useSelector((state: RootState) => state.auth?.token ?? null);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(true);
  const urlParams = new URLSearchParams(window.location.search);
  const storeId = urlParams.get("storeId");
  const templateId = urlParams.get("templateId");
  const navigate = useNavigate();


  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [storeLoading, setStoreLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    email: "",
    phone:"",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  })
  const [billingAddress, setBillingAddress] = useState({
    name: "",
    email: "",
    address: "",
    phone:"",

    city: "",
    postalCode: "",
    country: "",
  })
  const [sameAsBilling, setSameAsBilling] = useState(false)

  // useEffect(() => {
  //   if (!selectedStore?.value) return;

  //   const id = selectedStore.value;

  //   const fetchStoreDetails = async () => {
  //     try {
  //       setStoreLoading(true);

  //       const res = await getUserAPI({ id });
  //       console.log(res)
  //       if (res) {
  //         setBillingAddress({
  //           name: res.ownerName || "",
  //           email: res.email || "",
  //           address: res.address || "",
  //           city: res.city || "",
  //           postalCode: res.zipCode || "",
  //           country: res.state || "",
  //         });
  //       }
  //     } catch (error) {
  //       console.error("Error fetching store user:", error);
  //     } finally {
  //       setStoreLoading(false);
  //     }
  //   };

  //   fetchStoreDetails();
  // }, [selectedStore]);





  console.log("Store ID:", storeId);
  console.log("Template ID:", templateId);

  if (!templateId) {
    return (
      <h2 className="text-red-500 text-center text-xl">
        This template is not for you
      </h2>
    );
  }

  const categories = [
    "all",
    ...new Set(template?.products.map((product) => product.category || "Uncategorized")),
  ];

  const fetchStores = async () => {
    try {
      const storesData = await getAllStoresAPI();
      const formattedStores = storesData.map(({ _id, storeName }) => ({
        value: _id,
        label: storeName,
      }));

      setStores(formattedStores);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };
  useEffect(() => {
    const fetchTmplate = async () => {
      try {
        const tempLate = await getSinglePriceAPI(templateId);
        console.log(tempLate);
        setTemlate(tempLate);
      } catch (error) {
        console.error("Error fetching stores:", error);
      }
    };
    fetchTmplate();
    fetchStores();
  }, []);

  const handleFindUser = async () => {
    setStoreLoading(true);

    const response = await getUserAPI({email, setIsGroupOpen});
    console.log(response);

    setBillingAddress({
      name: response.ownerName || "",
      email: response.email || "",
      phone: response.phone || "",
      address: response.address || "",
      city: response.city || "",
      postalCode: response.zipCode || "",
      country: response.state || "",
    });
    if (response) {
      setSelectedStore({
        label: response.storeName,
        value: response._id,
      });
    } else {
      setIsGroupOpen(true);
    }
    setStoreLoading(false);

  };

  const handleQuantityChange = (productId: string, value: string) => {
    const quantity = parseInt(value) || 0;
    setQuantities((prev) => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const calculateTotal = () => {
    if (!template) return 0;

    return template.products.reduce((total, product) => {
      const quantity = quantities[product.id] || 0;
      return total + product.pricePerBox * quantity;
    }, 0);
  };

  const handleCreateOrder = async () => {
    if (!template || !selectedStore) return;

    console.log(template);
    console.log(selectedStore);

    const orderedProducts = template.products
      .filter((product) => (quantities[product.id] || 0) > 0)
      .map((product) => {
        const quantity = quantities[product.id] || 0;
        return {
          product: product.id,
          name: product.name,
          price: product.pricePerBox,
          quantity: quantity,
          productId: product.id,
          productName: product.name,
          unitPrice: product.pricePerBox,
          total: product.pricePerBox * quantity,
        };
      });

    console.log(orderedProducts);

    if (orderedProducts.length === 0) {
      toast({
        title: "No Products Selected",
        description: "Please select at least one product to create an order",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const selectedStoreName =
      stores.find((store) => store.id === selectedStore)?.name || "";
    const totalAmount = calculateTotal();

    const order = {
      id: `${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`,
      date: new Date().toISOString(),
      clientId: selectedStore,
      clientName: selectedStore?.label,
      items: orderedProducts,
      total: totalAmount,
      status: "pending" as const,
      paymentStatus: "pending" as const,
      subtotal: totalAmount,
      store: selectedStore.value,
      billingAddress,
      shippingAddress: sameAsBilling ? billingAddress : shippingAddress,
    };

    console.log(order);

    await createOrderAPI(order, token);

    console.log("Created order:", order);

    setOrderDetails(order);
    setOrderConfirmed(true);

    try {
      const invoiceData: InvoiceData = {
        invoiceNumber: order.id,
        customerName: selectedStore.label,
        items: orderedProducts.map((item) => ({
          productName: item.productName || item.name,
          price: item.unitPrice || item.pricePerBox,
          quantity: item.quantity,
          total: (item.unitPrice || item.pricePerBox) * item.quantity,
        })),
        total: order.total,
        date: order.date,
      };

      exportInvoiceToPDF({
        id: invoiceData.invoiceNumber,
        clientId: selectedStore.value,
        clientName: invoiceData.customerName,
        date: invoiceData.date,
        status: "pending",
        items: orderedProducts,
        total: invoiceData.total,
        paymentStatus: "pending",
        subtotal: order.subtotal,
      });
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
    }

    toast({
      title: "Order Created Successfully",
      description: `Order ${order.id} has been created for ${selectedStore.label}`,
    });

    setIsSubmitting(false);
  };


  const filteredProducts = template?.products?.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });



  const handleClose = () => {
    setSelectedStore({ label: "", value: "" });
    setQuantities({});
    setOrderConfirmed(false);
    setOrderDetails(null);
    setIsCreateOrderModalOpen(false);
    navigate("/");
  };

  const downloadConfirmation = () => {
    if (!orderDetails) return;

    console.log(orderDetails);

    try {
      const invoiceData: InvoiceData = {
        invoiceNumber: orderDetails.id,
        customerName: orderDetails.clientName,
        items: orderDetails.items.map((item) => ({
          productName: item.productName || item.name,
          price: item.unitPrice || item.pricePerBox,
          quantity: item.quantity,
          total: (item.unitPrice || item.pricePerBox) * item.quantity,
        })),
        total: orderDetails.total,
        date: orderDetails.date,
      };

      exportInvoiceToPDF({
        id: invoiceData.invoiceNumber,
        clientId: orderDetails.clientId.value,
        clientName: invoiceData.customerName,
        date: invoiceData.date,
        status: "pending",
        items: orderDetails.items,
        total: invoiceData.total,
        paymentStatus: "pending",
        subtotal: orderDetails.total,
      });

      toast({
        title: "Order Confirmation Downloaded",
        description: "The order confirmation PDF has been generated",
      });
    } catch (error) {
      console.error("Error generating confirmation PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate confirmation PDF",
        variant: "destructive",
      });
    }
  };

  if (!template) return null;

  return (
    <div>
      <Dialog open={isCreateOrderModalOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {orderConfirmed
                ? "Order Confirmation"
                : "Create Order from Price List"}
            </DialogTitle>
            <DialogDescription>
              {orderConfirmed
                ? "Your order has been created successfully. You can download the confirmation PDF."
                : `Create a new order based on "${template?.name}" price list.`}
            </DialogDescription>
          </DialogHeader>

          {!orderConfirmed ? (
            <>
              <div className="space-y-4 py-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="store">Select Store</Label>

                  <Select2
                    options={stores}
                    value={selectedStore}
                    onChange={setSelectedStore}
                    placeholder="Search and select a store..."
                    isSearchable={true}
                    isDisabled={true}
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleFindUser}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Find User
                  </button>
                </div>


                {storeLoading ? (
                  <div className="flex justify-center items-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span className="text-sm">Finding user details...</span>
                  </div>
                ) : (
                  <AddressForm
                    billingAddress={billingAddress}
                    setBillingAddress={setBillingAddress}
                    shippingAddress={shippingAddress}
                    setShippingAddress={setShippingAddress}
                    sameAsBilling={sameAsBilling}
                    setSameAsBilling={setSameAsBilling}
                  />
                )}
               

                <div className="border rounded-md overflow-hidden">
                  <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full md:w-1/2"
                    />

                    <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="w-[150px] text-center">
                          Quantity
                        </TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const quantity = quantities[product.id] || 0;
                        const total = product.pricePerBox * quantity;

                        return (
                          <TableRow key={product.id}>

                            <TableCell className="font-medium flex items-center gap-4">
                              <img src={product.image} alt="" className="h-14" loading="lazy" />

                              {product.name}
                            </TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(product.pricePerBox)}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={quantity || ""}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    product.id,
                                    e.target.value
                                  )
                                }
                                className="w-20 mx-auto"
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(total)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end">
                  <div className="bg-muted p-4 rounded-md">
                    <div className="text-sm text-muted-foreground mb-1">
                      Order Total
                    </div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(calculateTotal())}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOrder}
                  disabled={
                    !selectedStore || isSubmitting || calculateTotal() === 0
                  }
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Create Order
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-100 rounded-md p-4 mb-6 flex items-start gap-3">
                <div className="bg-green-100 rounded-full p-1 mt-0.5">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-green-800">
                    Order Created Successfully
                  </h3>
                  <p className="text-green-700 text-sm mt-1">
                    Order #{orderDetails?.id} has been created for{" "}
                    {orderDetails?.clientName}
                  </p>
                </div>
              </div>

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderDetails?.items.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {product.productName || product.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(product.unitPrice || product.pricePerBox)}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            (product.unitPrice || product.pricePerBox) *
                            product.quantity
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center mt-6">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button onClick={downloadConfirmation} variant="default">
                  <FileText className="mr-2 h-4 w-4" />
                  Download Confirmation PDF
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isGroupOpen} onOpenChange={setIsGroupOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Add New Store
            </DialogTitle>
          </DialogHeader>
          <StoreRegistration
            setIsGroupOpen={(value: boolean) => setIsGroupOpen(value)}
            isEdit={false}
            groups={null}
            fetchStores={fetchStores}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateOrderModalStore;
