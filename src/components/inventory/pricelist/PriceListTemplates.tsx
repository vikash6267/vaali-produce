import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, SendHorizontal } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import PriceListTemplate from './PriceListTemplate';
import PriceListTemplateForm from './PriceListTemplateForm';
import { PriceListTemplate as PriceListTemplateType, PriceListProduct } from '@/components/inventory/forms/formTypes';
import { useToast } from '@/hooks/use-toast';
import CreateOrderModal from './CreateOrderModal';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { createPriceListAPI, getAllPriceListAPI,updatePriceList } from "@/services2/operations/priceList"

// Mock data for price list templates
const initialTemplates: PriceListTemplateType[] = [
  {
    id: 'p1',
    name: 'Summer Vegetables',
    description: 'Special pricing for summer vegetables and fruits',
    status: 'active',
    createdAt: '2023-07-10T10:00:00Z',
    products: [
      { id: 'item1', productId: 'prod1', productName: 'Organic Tomatoes', category: 'Vegetables', price: 3.99, unit: 'lb' },
      { id: 'item2', productId: 'prod2', productName: 'Bell Peppers', category: 'Vegetables', price: 2.49, unit: 'lb' },
      { id: 'item3', productId: 'prod3', productName: 'Zucchini', category: 'Vegetables', price: 1.99, unit: 'lb' },
      { id: 'item4', productId: 'prod4', productName: 'Yellow Squash', category: 'Vegetables', price: 1.89, unit: 'lb' },
      { id: 'item5', productId: 'prod5', productName: 'Watermelon', category: 'Fruits', price: 5.99, unit: 'each' },
      { id: 'item6', productId: 'prod6', productName: 'Peaches', category: 'Fruits', price: 3.49, unit: 'lb' },
      { id: 'item7', productId: 'prod7', productName: 'Sweet Corn', category: 'Vegetables', price: 0.75, unit: 'ear' }
    ]
  },
  {
    id: 'p2',
    name: 'Organic Selection',
    description: 'Premium pricing for certified organic products',
    status: 'active',
    createdAt: '2023-06-15T14:30:00Z',
    products: [
      { id: 'item8', productId: 'prod8', productName: 'Organic Apples', category: 'Fruits', price: 4.99, unit: 'lb' },
      { id: 'item9', productId: 'prod9', productName: 'Organic Carrots', category: 'Vegetables', price: 3.49, unit: 'lb' },
      { id: 'item10', productId: 'prod10', productName: 'Organic Spinach', category: 'Leafy Greens', price: 4.29, unit: 'bunch' },
      { id: 'item11', productId: 'prod11', productName: 'Organic Blueberries', category: 'Berries', price: 6.99, unit: 'pint' },
      { id: 'item12', productId: 'prod12', productName: 'Organic Potatoes', category: 'Root Vegetables', price: 5.49, unit: 'lb' }
    ]
  },
  {
    id: 'p3',
    name: 'Economy Pack',
    description: 'Budget-friendly options for wholesale buyers',
    status: 'draft',
    createdAt: '2023-07-05T09:15:00Z',
    products: [
      { id: 'item13', productId: 'prod13', productName: 'Russet Potatoes (10lb)', category: 'Root Vegetables', price: 7.99, unit: 'bag' },
      { id: 'item14', productId: 'prod14', productName: 'Yellow Onions (5lb)', category: 'Vegetables', price: 4.29, unit: 'bag' },
      { id: 'item15', productId: 'prod15', productName: 'Gala Apples (5lb)', category: 'Fruits', price: 8.99, unit: 'bag' },
      { id: 'item16', productId: 'prod16', productName: 'Bananas (40lb case)', category: 'Fruits', price: 25.99, unit: 'case' },
      { id: 'item17', productId: 'prod17', productName: 'Carrots (25lb)', category: 'Root Vegetables', price: 19.99, unit: 'bag' }
    ]
  }
];



const PriceListTemplates = () => {
  const [templates, setTemplates] = useState<PriceListTemplateType[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<PriceListTemplateType | null>(null);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PriceListTemplateType | null>(null);
  const { toast } = useToast();
  const token = useSelector((state: RootState) => state.auth?.token ?? null);

  const handleAddNew = () => {
    setCurrentTemplate(null);
    setIsFormOpen(true);
  };


  const fetchProducts = async () => {
    try {
      const response = await getAllPriceListAPI();
      console.log(response);
      if (response) {
        console.log(response)
        setTemplates(response)
        // const updatedProducts = response.map((product) => ({
        //   ...product,
        //   id: product._id,
        //   lastUpdated:product?.updatedAt
        // }));

      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);


  const handleEdit = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCurrentTemplate(template);
      setIsFormOpen(true);
    }
  };

  const handleDelete = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    toast({
      title: "Template Deleted",
      description: "The price list template has been deleted successfully"
    });
  };

  const handleSaveTemplate = async (template: PriceListTemplateType) => {
    if (currentTemplate) {
      console.log(currentTemplate)

      await updatePriceList(template.id,template,token)
      setTemplates(templates.map(t => t.id === template.id ? template : t));
      toast({
        title: "Template Updated",
        description: "Price list template has been updated successfully"
      });

      
    } else {
      // const newTemplate = {
      //   ...template,
      //   id: `p${templates.length + 1}`,
      //   createdAt: new Date().toISOString(),
      // };
      // setTemplates([...templates, newTemplate]);

      await createPriceListAPI(template, token)

      toast({
        title: "Template Created",
        description: "New price list template has been created successfully"
      });
    }
    setIsFormOpen(false);
  };

  const handleSendClick = (templateId: string) => {
    console.log("Send clicked for template", templateId);
  };

  const handleCreateOrder = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setIsCreateOrderModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Price List Templates</h2>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-muted rounded-lg p-10 text-center">
          <SendHorizontal className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Price Lists Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Create your first price list template to share with stores. You can customize products, prices, and categories.
          </p>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Template
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <PriceListTemplate
              key={template.id}
              template={template}
              onSend={handleSendClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreateOrder={handleCreateOrder}
            />
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
          <PriceListTemplateForm
            template={currentTemplate}
            onSave={handleSaveTemplate}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <CreateOrderModal
        isOpen={isCreateOrderModalOpen}
        onClose={() => setIsCreateOrderModalOpen(false)}
        template={selectedTemplate}
      />
    </div>
  );
};

export default PriceListTemplates;
