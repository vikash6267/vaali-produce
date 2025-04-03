
import { Order } from '@/lib/data';
import { 
  exportInvoiceToPDF, 
  exportTransportationReceiptToPDF, 
  exportBillOfLadingToPDF 
} from './pdf';

export interface InvoiceOptions {
  includeHeader: boolean;
  includeCompanyDetails: boolean;
  includePaymentTerms: boolean;
  includeLogo: boolean;
  includeSignature: boolean;
  dueDate: string;
  invoiceTemplate: string;
}

export interface TransportationReceiptData {
  driverName: string;
  vehicleId: string;
  departureDate: string;
  estimatedArrival: string;
  notes?: string;
  signature: string;
  transportCompany?: string;
  deliveryLocation?: string;
  routeNumber?: string;
  packagingType?: string;
  temperatureRequirements?: string;
}

export interface BillOfLadingData {
  bolNumber: string;
  shipperName: string;
  shipperAddress: string;
  shipperCity: string;
  shipperState: string;
  shipperZip: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeCity: string;
  consigneeState: string;
  consigneeZip: string;
  carrierName: string;
  trailerNumber: string;
  sealNumber?: string;
  freightTerms: "Prepaid" | "Collect" | "Third Party";
  specialInstructions?: string;
  hazardousMaterials: boolean;
  signatureShipper: string;
  serviceLevel: "Standard" | "Expedited" | "Same Day";
}

export const generateInvoicePDF = (order: Order, options: InvoiceOptions) => {
  try {
    exportInvoiceToPDF(order, {
      includeHeader: options.includeHeader,
      includeCompanyDetails: options.includeCompanyDetails,
      includePaymentTerms: options.includePaymentTerms,
      includeLogo: options.includeLogo,
      includeSignature: options.includeSignature,
      dueDate: options.dueDate,
      invoiceTemplate: options.invoiceTemplate
    });
    return true;
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return false;
  }
};

export const generateTransportationReceiptPDF = (
  order: Order, 
  data: TransportationReceiptData,
  receiptType: 'standard' | 'detailed' | 'qr' = 'standard'
) => {
  try {
    exportTransportationReceiptToPDF(order, data, receiptType);
    return true;
  } catch (error) {
    console.error('Error generating transportation receipt PDF:', error);
    return false;
  }
};

export const generateBillOfLadingPDF = (
  order: Order,
  data: BillOfLadingData
) => {
  try {
    exportBillOfLadingToPDF(order, data);
    return true;
  } catch (error) {
    console.error('Error generating bill of lading PDF:', error);
    return false;
  }
};
