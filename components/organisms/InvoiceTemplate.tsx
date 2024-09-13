import React from 'react';
import { Invoice } from '@/lib/supabase/services/invoice';
import { Company } from '@/lib/supabase/services/company';
import { numberToWords, numberToCurrency } from '@/lib/utils';

interface InvoiceTemplateProps {
  invoice: Invoice;
  company: Company;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, company }) => {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow-sm my-6" id="invoice">
      <div className="grid grid-cols-2 items-center">
        <div>
          <img id="company_logo" src="https://st3.depositphotos.com/43745012/44906/i/450/depositphotos_449066958-stock-photo-financial-accounting-logo-financial-logo.jpg" alt="company-logo" className="h-24 w-auto" />
        </div>
        <div className="text-right text-sm">
          <p>{company.name}</p>
          <p>RTN: {company.rtn}</p>
          <p>Email: {company.email}</p>
          <p>Dirección: {company.address0}</p>
          <p>{company.address1}</p>
          <p>{company.address2}</p>
          <p>Teléfono: {company.phone}</p>
          {!invoice.is_proforma && (
            <>
              <p>CAI: {company.cai}</p>
              <p>RANGO AUTORIZADO DEL {company.range_invoice1} AL {company.range_invoice2}</p>
              <p>Fecha Límite de Emisión: {company.limit_date}</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 text-right text-sm">
        <p>Fecha: {new Date(invoice.date).toLocaleDateString()}</p>
        {!invoice.is_proforma && (
          <p>FACTURA # {invoice.invoice_number}</p>
        )}
      </div>

      {invoice.is_proforma && (
        <div className="w-full text-center mt-4">
          <p className="text-lg font-bold">FACTURA PROFORMA # {invoice.proforma_number}</p>
        </div>
      )}

      <div className="grid grid-cols-2 items-center mt-8 text-sm">
        <div>
          <p className="font-bold text-gray-800">Facturar A:</p>
          <p>{invoice.customers.name}</p>
          <p><strong>RTN:</strong> {invoice.customers.rtn}</p>
          <p><strong>Email:</strong> {invoice.customers.email}</p>
        </div>
      </div>

      <div className="-mx-4 mt-8 flow-root sm:mx-0">
        <table className="min-w-full">
          <thead className="border-b border-gray-300 text-gray-900">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold">Descripción</th>
              <th scope="col" className="hidden px-3 py-3.5 text-right text-sm font-semibold sm:table-cell">Cantidad</th>
              <th scope="col" className="hidden px-3 py-3.5 text-right text-sm font-semibold sm:table-cell">Precio</th>
              <th scope="col" className="hidden px-3 py-3.5 text-right text-sm font-semibold sm:table-cell">Descuento</th>
              <th scope="col" className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.invoice_items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="max-w-0 py-5 pl-4 pr-3 text-sm sm:pl-0">
                  <div className="font-medium text-gray-900">{item.description}</div>
                </td>
                <td className="hidden px-3 py-5 text-right text-sm text-gray-500 sm:table-cell">{item.quantity}</td>
                <td className="hidden px-3 py-5 text-right text-sm text-gray-500 sm:table-cell">Lps. {numberToCurrency(item.unit_cost)}</td>
                <td className="hidden px-3 py-5 text-right text-sm text-gray-500 sm:table-cell">Lps. {numberToCurrency(item.discount)}</td>
                <td className="py-5 pl-3 pr-4 text-right text-sm text-gray-500 sm:pr-0">Lps. {numberToCurrency(item.quantity * item.unit_cost - item.discount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={4} className="hidden pl-4 pr-3 pt-6 text-right text-sm font-normal text-gray-500 sm:table-cell sm:pl-0">Sub Total</th>
              <td className="pl-3 pr-6 pt-6 text-right text-sm text-gray-500 sm:pr-0">Lps. {numberToCurrency(invoice.subtotal)}</td>
            </tr>
            <tr>
              <th scope="row" colSpan={4} className="hidden pl-4 pr-3 pt-4 text-right text-sm font-normal text-gray-500 sm:table-cell sm:pl-0">Importe Exonerado</th>
              <td className="pl-3 pr-6 pt-4 text-right text-sm text-gray-500 sm:pr-0">Lps. {numberToCurrency(invoice.tax_exonerado)}</td>
            </tr>
            <tr>
              <th scope="row" colSpan={4} className="hidden pl-4 pr-3 pt-4 text-right text-sm font-normal text-gray-500 sm:table-cell sm:pl-0">Importe Exento</th>
              <td className="pl-3 pr-6 pt-4 text-right text-sm text-gray-500 sm:pr-0">Lps. {numberToCurrency(invoice.tax_exento)}</td>
            </tr>
            <tr>
              <th scope="row" colSpan={4} className="hidden pl-4 pr-3 pt-4 text-right text-sm font-normal text-gray-500 sm:table-cell sm:pl-0">Importe Gravado 15%</th>
              <td className="pl-3 pr-6 pt-4 text-right text-sm text-gray-500 sm:pr-0">Lps. {numberToCurrency(invoice.tax_gravado_15)}</td>
            </tr>
            <tr>
              <th scope="row" colSpan={4} className="hidden pl-4 pr-3 pt-4 text-right text-sm font-normal text-gray-500 sm:table-cell sm:pl-0">Importe Gravado 18%</th>
              <td className="pl-3 pr-6 pt-4 text-right text-sm text-gray-500 sm:pr-0">Lps. {numberToCurrency(invoice.tax_gravado_18)}</td>
            </tr>
            <tr>
              <th scope="row" colSpan={4} className="hidden pl-4 pr-3 pt-4 text-right text-sm font-normal text-gray-500 sm:table-cell sm:pl-0">I.S.V 15%</th>
              <td className="pl-3 pr-6 pt-4 text-right text-sm text-gray-500 sm:pr-0">Lps. {numberToCurrency(invoice.tax)}</td>
            </tr>
            <tr>
              <th scope="row" colSpan={4} className="hidden pl-4 pr-3 pt-4 text-right text-sm font-normal text-gray-500 sm:table-cell sm:pl-0">I.S.V 18%</th>
              <td className="pl-3 pr-6 pt-4 text-right text-sm text-gray-500 sm:pr-0">Lps. {numberToCurrency(invoice.tax_18)}</td>
            </tr>
            <tr>
              <th scope="row" colSpan={4} className="hidden pl-4 pr-3 pt-4 text-right text-sm font-semibold text-gray-900 sm:table-cell sm:pl-0">Total</th>
              <td className="pl-3 pr-4 pt-4 text-right text-sm font-semibold text-gray-900 sm:pr-0">Lps. {numberToCurrency(invoice.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-8 text-sm">
        <div className="bg-gray-100 p-4 rounded"><strong>VALOR EN LETRAS: {numberToWords(invoice.total)}</strong></div>
        <div className="mt-4">
          <p>"LA FACTURA ES BENEFICIO DE TODOS EXÍJALA "</p>
          <table className="w-full mt-2">
            <tr>
              <td width="50%">N° Correlativo de orden de compra exenta</td>
              <td width="20%">&emsp;</td>
            </tr>
            <tr>
              <td width="50%">N° Correlativo de constancia de registro exonerado</td>
              <td width="20%">&emsp;</td>
            </tr>
            <tr>
              <td width="50%">N° identificativo del registro de la SAG</td>
              <td width="20%">&emsp;</td>
            </tr>
          </table>
          <p className="mt-4">ORIGINAL: CLIENTE &emsp; COPIA: EMISOR</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate;