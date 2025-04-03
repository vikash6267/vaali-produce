
import React, { useState } from 'react';
import { PriceListTemplate as PriceListTemplateType, EmailSendOptions } from '@/components/inventory/forms/formTypes';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Copy, Edit, Trash2, Send, Mail, Download, FileText, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import EmailForm from '@/components/shared/EmailForm';
import { useToast } from '@/hooks/use-toast';
import { sendPriceListTemplateEmail } from '@/utils/email/inventoryEmailUtils';
import { exportPriceListToPDF } from '@/utils/pdf';

interface PriceListTemplateProps {
  template: PriceListTemplateType;
  onSend: (templateId: string) => void;
  onEdit: (templateId: string) => void;
  onDelete: (templateId: string) => void;
  onCreateOrder: (templateId: string) => void;
}

const PriceListTemplate: React.FC<PriceListTemplateProps> = ({ 
  template, 
  onSend, 
  onEdit, 
  onDelete, 
  onCreateOrder 
}) => {
  const formattedDate = format(new Date(template.createdAt), 'MMMM dd, yyyy');
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const { toast } = useToast();
  
  const handleSendEmail = async (emailData) => {
    setIsSendingEmail(true);
    try {
      // Generate PDF before sending email
      const pdfDoc = exportPriceListToPDF(template);
      
      const emailOptions: EmailSendOptions = {
        webhookUrl: '/api/email', // Replace with your actual webhook URL
        fromName: 'Vali Produce',
        showNotifications: true,
        attachments: [
          {
            filename: `price-list-${template.name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
            data: pdfDoc.output('datauristring')
          }
        ]
      };
      
      const result = await sendPriceListTemplateEmail(
        template,
        emailData.clientIds || [], // You would need to populate this with selected clients
        emailOptions
      );
      
      if (result.success) {
        toast({
          title: "Price List Sent",
          description: `Successfully sent to ${result.sent} stores`,
          variant: "default"
        });
        setIsConfirmationVisible(true);
        setTimeout(() => setIsConfirmationVisible(false), 3000);
      } else {
        toast({
          title: "Error Sending Price List",
          description: `Failed to send to ${result.failed} stores`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error sending price list:", error);
      toast({
        title: "Error Generating PDF",
        description: "Failed to generate and send the price list PDF",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
      setIsEmailDialogOpen(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      console.log(template)
      exportPriceListToPDF(template);
      toast({
        title: "PDF Downloaded",
        description: "Price list PDF has been generated and downloaded",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">{template.name}</h3>
          <p className="text-gray-500 text-sm mt-1">Created on {formattedDate}</p>
          {template.description && (
            <p className="text-gray-600 mt-2">{template.description}</p>
          )}
          <div className="mt-2">
            {template.status === 'active' && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Active
              </Badge>
            )}
            {template.status === 'draft' && (
              <Badge variant="secondary">Draft</Badge>
            )}
            {template.status === 'archived' && (
              <Badge variant="destructive">Archived</Badge>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <Edit className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setIsEmailDialogOpen(true)}>
              <Send className="h-4 w-4 mr-2" />
              Send to Stores
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateOrder(template.id)}>
              <FileText className="h-4 w-4 mr-2" />
              Create Order
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(template.id)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Template
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(template.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-4">
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleDownloadPDF}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Download className="h-4 w-4 mr-1" />
          Download PDF
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setIsEmailDialogOpen(true)}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          <Send className="h-4 w-4 mr-1" />
          Send to Stores
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onCreateOrder(template.id)}
          className="text-purple-600 border-purple-200 hover:bg-purple-50"
        >
          <FileText className="h-4 w-4 mr-1" />
          Create Order
        </Button>
      </div>
      
      {isConfirmationVisible && (
        <div className="mt-3 p-2 bg-green-50 text-green-700 rounded-md flex items-center">
          <Check className="h-4 w-4 mr-2" />
          Price list successfully sent to stores
        </div>
      )}

      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Price List</DialogTitle>
            <DialogDescription>
              The price list will be sent as a PDF attachment to the selected stores.
            </DialogDescription>
          </DialogHeader>
          <EmailForm
            onClose={() => setIsEmailDialogOpen(false)}
            onSubmit={handleSendEmail}
            defaultSubject={`Price List: ${template.name}`}
            defaultMessage={`${template.id}`}
            templates={true}
            attachmentsEnabled={true}
            webhookUrl="/api/email" // Replace with your actual webhook URL
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEmailDialogOpen(false)}
              disabled={isSendingEmail}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="email-form"
              disabled={isSendingEmail}
              isLoading={isSendingEmail}
            >
              Send Price List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PriceListTemplate;
