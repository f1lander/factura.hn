import React, { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Invoice, InvoiceItem } from '@/lib/supabase/services/invoice';
import { Company } from '@/lib/supabase/services/company';
import { PrinterIcon, DownloadIcon } from 'lucide-react';
import { format } from 'date-fns';
import { getSignedLogoUrl } from '@/lib/utils';


// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 30,
  },
  section: {
    margin: 8,
    padding: 8,
  },
  container: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  column: {
    flex: 1,
  },
  columnRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logo: {
    width: 120,
    height: 'auto',
    marginBottom: 5,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 8,
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
  },
  customerSection: {
    backgroundColor: '#808080',
    padding: 10,
    flexDirection: 'row',
    color: 'white',
    marginBottom: 10,
  },
  customerColumn: {
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  value: {
    maxWidth: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingVertical: 5,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 5,
  },
  tableCol4: {
    width: '40%',
  },
  tableCol1: {
    width: '10%',
    textAlign: 'center',
  },
  tableCol2: {
    width: '20%',
    textAlign: 'center',
  },
  tableCol3: {
    width: '30%',
    textAlign: 'right',
  },
  totalsRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  totalsLabel: {
    width: '70%',
    textAlign: 'right',
    paddingRight: 10,
  },
  totalsValue: {
    width: '30%',
    textAlign: 'right',
  },
  border: {
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    padding: 10,
    backgroundColor: '#808080',
    color: 'white',
    marginVertical: 10,
  },
  notes: {
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    padding: 10,
    backgroundColor: '#fff',
    marginVertical: 10,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    marginVertical: 10,
  },
  tableRowStriped: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderStyle: 'solid',
    paddingVertical: 5,
    backgroundColor: '#ddd',
  },
  tableCell: {
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    padding: 4,
  },
  tableCell50: {
    width: '50%',
    padding: 4,
  },
  footer: {
    fontSize: 8,
    marginTop: 8,
  },
});

// Format currency
const formatCurrency = (amount: number) => {
  return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

interface InvoiceViewPdfProps {
  invoice: Invoice;
  company?: Company;
}

const InvoiceViewPdf: React.FC<InvoiceViewPdfProps> = ({ invoice, company }) => {
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    if (company?.logo_url) {
      getSignedLogoUrl(company?.logo_url).then((base64image: string | null) => {
        setCompanyLogo(base64image);
      });
    }
  }, [company]);

  if (!invoice) {
    return <div>No invoice data available</div>;
  }

  // Create Invoice Document Component with the logo passed in
  const InvoicePDF = () => {
    // Get current date
    const currentDate = format(new Date(), 'dd/MM/yyyy');
    
    // Check if it's a proforma invoice
    const isProforma = invoice.is_proforma;
    
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Header Section */}
          <View style={styles.container}>
            {/* Company Info - Left Column */}
            <View style={styles.column}>
              <Text style={styles.companyInfo}>{company?.name}</Text>
              <Text style={styles.companyInfo}>RTN: {company?.rtn}</Text>
              <Text style={styles.companyInfo}>Email: {company?.email}</Text>
              <Text style={styles.companyInfo}>Dirección: {company?.address0}</Text>
              <Text style={styles.companyInfo}>Teléfono: {company?.phone}</Text>
              {!isProforma && (
                <>
                  <Text style={styles.companyInfo}>CAI: {company?.cai}</Text>
                  <Text style={styles.companyInfo}>RANGO AUTORIZADO DEL {company?.range_invoice1} AL {company?.range_invoice2}</Text>
                  <Text style={styles.companyInfo}>Fecha Límite de Emisión: {company?.limit_date}</Text>
                </>
              )}
            </View>
            
            {/* Logo and Invoice Number - Right Column */}
            <View style={styles.columnRight}>
              {companyLogo ? (
                <Image src={companyLogo} style={styles.logo} />
              ) : (
                <Text style={styles.companyName}>{company?.name}</Text>
              )}
              <Text style={styles.companyInfo}>Fecha: {currentDate}</Text>
              {!isProforma && (
                <Text style={styles.companyInfo}>FACTURA # {invoice.invoice_number}</Text>
              )}
            </View>
          </View>
          
          {/* Proforma Title if applicable */}
          {isProforma && (
            <View>
              <Text style={styles.title}>FACTURA PROFORMA # {invoice.invoice_number}</Text>
            </View>
          )}
          
          {/* Customer Information */}
          <View style={styles.customerSection}>
            <View style={styles.customerColumn}>
              <Text>
                <Text style={styles.label}>Facturar A:</Text> {invoice.customers?.name}
              </Text>
            </View>
            <View style={styles.customerColumn}>
              <Text>
                <Text style={styles.label}>RTN:</Text> {invoice.customers?.rtn}
              </Text>
            </View>
            <View style={styles.customerColumn}>
              <Text>
                <Text style={styles.label}>Email:</Text> {invoice.customers?.email}
              </Text>
            </View>
          </View>
          
          {/* Items Table */}
          <View>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.tableCol4}>Descripción</Text>
              <Text style={styles.tableCol1}>Cantidad</Text>
              <Text style={styles.tableCol2}>Precio</Text>
              <Text style={styles.tableCol2}>Descuento</Text>
              <Text style={styles.tableCol3}>Total</Text>
            </View>
            
            {/* Table Rows */}
            {invoice.invoice_items?.map((item: InvoiceItem, index: number) => (
              <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowStriped}>
                <Text style={styles.tableCol4}>{item.description}</Text>
                <Text style={styles.tableCol1}>{item.quantity}</Text>
                <Text style={styles.tableCol2}>Lps. {formatCurrency(item.unit_cost)}</Text>
                <Text style={styles.tableCol2}>Lps. {formatCurrency(item.discount || 0)}</Text>
                <Text style={styles.tableCol3}>Lps. {formatCurrency(item.unit_cost * item.quantity)}</Text>
              </View>
            ))}
            
            {/* Totals Section */}
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Sub Total</Text>
              <Text style={styles.totalsValue}>Lps. {formatCurrency(invoice.subtotal || 0)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Importe Exonerado:</Text>
              <Text style={styles.totalsValue}>Lps. {formatCurrency(invoice.tax_exonerado || 0)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Importe Exento:</Text>
              <Text style={styles.totalsValue}>Lps. {formatCurrency(invoice.tax_exento || 0)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Importe Gravado 15%:</Text>
              <Text style={styles.totalsValue}>Lps. {formatCurrency(invoice.tax_gravado_15 || 0)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Importe Gravado 18%:</Text>
              <Text style={styles.totalsValue}>Lps. {formatCurrency(invoice.tax_gravado_18 || 0)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>I.S.V 15%:</Text>
              <Text style={styles.totalsValue}>Lps. {formatCurrency(invoice.tax || 0)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>I.S.V 18%:</Text>
              <Text style={styles.totalsValue}>Lps. {formatCurrency(invoice.tax_18 || 0)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Total:</Text>
              <Text style={styles.totalsValue}>Lps. {formatCurrency(invoice.total || 0)}</Text>
            </View>
          </View>
          
          {/* Footer Sections */}
          <View style={styles.border}>
            <Text style={{ fontWeight: 'bold' }}>VALOR EN LETRAS: {invoice.numbers_to_letters}</Text>
          </View>
          
          <Text style={styles.footer}>"LA FACTURA ES BENEFICIO DE TODOS EXÍJALA "</Text>
          
          {/* Table for SAG information */}
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell50}>N° Correlativo de orden de compra exenta</Text>
              <Text style={styles.tableCell50}></Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell50}>N° Correlativo de constancia de registro exonerado</Text>
              <Text style={styles.tableCell50}></Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell50}>N° identificativo del registro de la SAG</Text>
              <Text style={styles.tableCell50}></Text>
            </View>
          </View>
          
          <Text style={styles.footer}>ORIGINAL: CLIENTE   COPIA: EMISOR</Text>
          
          {/* Notes Section */}
          <View style={styles.notes}>
            <Text style={{ fontWeight: 'bold' }}>Notas: {invoice.notes}</Text>
          </View>
        </Page>
      </Document>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* PDF Viewer */}
      <div className="h-[calc(100vh-220px)] w-full border border-gray-300 rounded-md">
        <PDFViewer width="100%" height="100%" className="border-none">
          <InvoicePDF />
        </PDFViewer>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        {/* Print Button */}
        <Button
          onClick={() => {
            // Access the iframe and trigger print
            const iframe = document.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
            }
          }}
          className="flex items-center gap-2"
        >
          <PrinterIcon size={16} />
          <span>Imprimir</span>
        </Button>
        
        {/* Download Button */}
        <PDFDownloadLink
          document={<InvoicePDF />}
          fileName={`factura-${invoice.invoice_number}.pdf`}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          {({ loading }) => (
            <>
              {loading ? 'Preparando documento...' : (
                <>
                  <DownloadIcon size={16} className="mr-2" />
                  <span>Descargar PDF</span>
                </>
              )}
            </>
          )}
        </PDFDownloadLink>
      </div>
    </div>
  );
};

export default InvoiceViewPdf; 