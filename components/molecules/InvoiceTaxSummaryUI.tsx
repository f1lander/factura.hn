import React from 'react';
import { Invoice } from '@/lib/supabase/services/invoice';

// Format currency
const formatCurrency = (amount: number) => {
  return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

interface InvoiceTaxSummaryUIProps {
  invoice: Invoice;
}

export const InvoiceTaxSummaryUI: React.FC<InvoiceTaxSummaryUIProps> = ({ invoice }) => {
  return (
    <div className="mt-6 border rounded-md overflow-hidden">
      <h3 className="text-lg font-semibold p-3 bg-gray-100">Resumen de la Factura</h3>
      
      <div className="p-4 space-y-2">
        <div className="grid grid-cols-2 border-b pb-2">
          <div className="text-gray-600">Subtotal:</div>
          <div className="text-right">Lps. {formatCurrency(invoice.subtotal)}</div>
        </div>
        
        <div className="grid grid-cols-2">
          <div className="text-gray-600">Exonerado:</div>
          <div className="text-right text-red-500">Lps. {formatCurrency(invoice.tax_exonerado)}</div>
        </div>
        
        <div className="grid grid-cols-2">
          <div className="text-gray-600">Exento:</div>
          <div className="text-right text-red-500">Lps. {formatCurrency(invoice.tax_exento)}</div>
        </div>
        
        <div className="grid grid-cols-2">
          <div className="text-gray-600">Gravado 15%:</div>
          <div className="text-right text-red-500">Lps. {formatCurrency(invoice.tax_gravado_15)}</div>
        </div>
        
        <div className="grid grid-cols-2">
          <div className="text-gray-600">Gravado 18%:</div>
          <div className="text-right text-red-500">Lps. {formatCurrency(invoice.tax_gravado_18)}</div>
        </div>
        
        <div className="grid grid-cols-2">
          <div className="text-gray-600">ISV 15%:</div>
          <div className="text-right">Lps. {formatCurrency(invoice.tax)}</div>
        </div>
        
        <div className="grid grid-cols-2">
          <div className="text-gray-600">ISV 18%:</div>
          <div className="text-right">Lps. {formatCurrency(invoice.tax_18)}</div>
        </div>
        
        <div className="grid grid-cols-2 border-t pt-2 font-semibold">
          <div>Total:</div>
          <div className="text-right">Lps. {formatCurrency(invoice.total)}</div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTaxSummaryUI; 