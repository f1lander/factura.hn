import React, { useState, useEffect } from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  PDFViewer,
  PDFDownloadLink,
  pdf,
} from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Invoice, InvoiceItem } from '@/lib/supabase/services/invoice';
import { Company } from '@/lib/supabase/services/company';
import { PrinterIcon, DownloadIcon } from 'lucide-react';
import { format } from 'date-fns';
import { getSignedLogoUrl } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { sarCaiService } from '@/lib/supabase/services/sar_cai';

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  companyInfo: {
    flex: 1,
    fontSize: 10,
  },
  companyInfoText: {
    marginBottom: 2,
    fontSize: 10,
  },
  companyInfoTextBold: {
    marginBottom: 2,
    fontSize: 10,
    fontWeight: 'bold',
  },
  companyTitle: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  logo: {
    width: 'auto',
    height: 100,
    objectFit: 'contain',
    alignSelf: 'flex-end',
  },
  invoiceHeader: {
    marginTop: 4,
    textAlign: 'right',
    fontSize: 10,
  },
  invoiceNumber: {
    marginTop: 4,
    textAlign: 'right',
    fontSize: 10,
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
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
  },
  customerSection: {
    backgroundColor: '#808080',
    padding: 8,
    flexDirection: 'row',
    marginBottom: 15,
  },
  customerInfo: {
    flex: 1,
    color: 'white',
  },
  customerInfoBold: {
    // flex: 1,
    // color: 'white',
    fontWeight: 'bold',
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
    // borderTopWidth: 1,
    borderColor: '#000',
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 2,
    // paddingVertical: 5,
  },
  descriptionCol: { width: '40%', paddingHorizontal: 5 },
  quantityCol: { width: '15%', textAlign: 'center' },
  priceCol: { width: '15%', textAlign: 'right' },
  discountCol: { width: '15%', textAlign: 'right' },
  totalCol: { width: '15%', textAlign: 'right', paddingHorizontal: 5 },
  totalsSection: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingRight: 5,
  },
  totalLabel: {
    width: 200,
    textAlign: 'right',
    paddingRight: 10,
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
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
    paddingRight: 5,
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
    // marginVertical: 10,
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
    marginTop: 10,
  },
  tableRowStriped: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderStyle: 'solid',
    paddingHorizontal: 2,
    // paddingVertical: 5,
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
    padding: '0 4px',
    // borderWidth: 1,
    // borderColor: '#000',
    // borderStyle: 'solid',
  },
  footer: {
    fontSize: 8,
    padding: 0,
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

const InvoiceViewPdf: React.FC<InvoiceViewPdfProps> = ({
  invoice,
  company,
}) => {
  const {
    data: companyLogo,
    isLoading,
    isFetching,
  } = useQuery(
    ['companyLogo', company?.logo_url],
    () => getSignedLogoUrl(company?.logo_url),
    {
      enabled: !!company?.logo_url,
    }
  );

  const pdfTitle = `factura-${
    invoice.invoice_number || invoice.proforma_number
  }-${invoice.customers.name}`;

  // Query to fetch SAR CAI data
  const {
    data: sarCaiData,
    isLoading: isSarCaiLoading,
    isFetching: isSarCaiFetching,
    error,
  } = useQuery({
    queryKey: ['sarCai', invoice?.id, invoice?.sar_cai_id],
    queryFn: () => sarCaiService.getSarCaiById(invoice?.sar_cai_id ?? ''),
    enabled: !!invoice?.sar_cai_id && !invoice?.is_proforma,
  });

  if (!invoice) {
    return <div>No invoice data available</div>;
  }

  if ((isLoading && isFetching) || (isSarCaiLoading && isSarCaiFetching)) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary' />
      </div>
    );
  }

  // Create Invoice Document Component with the logo passed in
  const InvoicePDF = () => {
    // Get current date
    const currentDate = format(new Date(), 'dd/MM/yyyy');

    // Check if it's a proforma invoice
    const isProforma = invoice.is_proforma;

    return (
      <Document author='factura.hn' title={pdfTitle}>
        <Page size='A4' style={styles.page}>
          <View style={styles.header}>
            <View style={styles.companyInfo}>
              <Text style={styles.companyTitle}>{company?.name}</Text>
              <Text style={styles.companyInfoText}>
                <Text style={styles.companyInfoTextBold}>RTN: </Text>
                {company?.rtn}
              </Text>
              <Text style={styles.companyInfoText}>
                <Text style={styles.companyInfoTextBold}>Email: </Text>
                {company?.email}
              </Text>
              <Text style={styles.companyInfoTextBold}>Dirección:</Text>
              <Text style={styles.companyInfoText}>{company?.address0}</Text>
              <Text style={styles.companyInfoText}>
                <Text style={styles.companyInfoTextBold}>Teléfono: </Text>
                {company?.phone}
              </Text>
              {!isProforma && (
                <>
                  <Text style={styles.companyInfoText}>
                    <Text style={styles.companyInfoTextBold}>CAI: </Text>
                    {sarCaiData?.cai}
                  </Text>
                  <Text style={styles.companyInfoTextBold}>
                    RANGO AUTORIZADO
                  </Text>
                  <Text style={styles.companyInfoText}>
                    <Text style={styles.companyInfoTextBold}>DEL </Text>
                    {sarCaiData?.range_invoice1}
                    <Text style={styles.companyInfoTextBold}> AL </Text>
                    {sarCaiData?.range_invoice2}
                  </Text>
                  <Text style={styles.companyInfoText}>
                    <Text style={styles.companyInfoTextBold}>
                      Fecha Límite de Emisión:{' '}
                    </Text>
                    {format(sarCaiData?.limit_date ?? new Date(), 'dd/MM/yyyy')}
                  </Text>
                </>
              )}
            </View>
            <View>
              {companyLogo ? (
                <Image src={companyLogo} style={styles.logo} />
              ) : (
                <Text style={styles.companyName}>{company?.name}</Text>
              )}
              <Text style={styles.invoiceHeader}>Fecha: {currentDate}</Text>
              {!isProforma && (
                <Text style={styles.invoiceHeader}>
                  <Text style={styles.companyInfoTextBold}>FACTURA # </Text>
                  {invoice.invoice_number}
                </Text>
              )}
            </View>
          </View>

          {/* Proforma Title if applicable */}
          {isProforma && (
            <View>
              <Text style={styles.title}>
                FACTURA PROFORMA # {invoice.invoice_number}
              </Text>
            </View>
          )}

          <View style={styles.customerSection}>
            <View style={styles.customerInfo}>
              <Text style={styles.customerInfoBold}>Facturar A: </Text>
              <Text>{invoice.customers?.name}</Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerInfoBold}>RTN: </Text>
              <Text>{invoice.customers?.rtn}</Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerInfoBold}>Email: </Text>
              <Text>{invoice.customers?.email}</Text>
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.descriptionCol}>Descripción</Text>
              <Text style={styles.quantityCol}>Cantidad</Text>
              <Text style={styles.priceCol}>Precio</Text>
              <Text style={styles.discountCol}>Descuento</Text>
              <Text style={styles.totalCol}>Total</Text>
            </View>

            {invoice.invoice_items?.map((item, index) => (
              <View
                key={index}
                style={
                  index % 2 === 0 ? styles.tableRow : styles.tableRowStriped
                }
              >
                <Text style={styles.descriptionCol}>{item.description}</Text>
                <Text style={styles.quantityCol}>{item.quantity}</Text>
                <Text style={styles.priceCol}>
                  Lps. {formatCurrency(item.unit_cost)}
                </Text>
                <Text style={styles.discountCol}>
                  Lps. {formatCurrency(item.discount || 0)}
                </Text>
                <Text style={styles.totalCol}>
                  Lps. {formatCurrency(item.unit_cost * item.quantity)}
                </Text>
              </View>
            ))}
          </View>

          {/* Totals Section */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sub Total</Text>
              <Text style={styles.totalValue}>
                Lps. {formatCurrency(invoice.subtotal || 0)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Importe Exonerado:</Text>
              <Text style={styles.totalsValue}>
                Lps. {formatCurrency(invoice.tax_exonerado || 0)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Importe Exento:</Text>
              <Text style={styles.totalsValue}>
                Lps. {formatCurrency(invoice.tax_exento || 0)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Importe Gravado 15%:</Text>
              <Text style={styles.totalsValue}>
                Lps. {formatCurrency(invoice.tax_gravado_15 || 0)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Importe Gravado 18%:</Text>
              <Text style={styles.totalsValue}>
                Lps. {formatCurrency(invoice.tax_gravado_18 || 0)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>I.S.V 15%:</Text>
              <Text style={styles.totalsValue}>
                Lps. {formatCurrency(invoice.tax || 0)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>I.S.V 18%:</Text>
              <Text style={styles.totalsValue}>
                Lps. {formatCurrency(invoice.tax_18 || 0)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Total:</Text>
              <Text style={styles.totalsValue}>
                Lps. {formatCurrency(invoice.total || 0)}
              </Text>
            </View>
          </View>

          {/* Footer Sections */}
          <View style={{ ...styles.border, padding: 4, borderRadius: 5 }}>
            <Text style={{ fontWeight: 'bold' }}>
              VALOR EN LETRAS: {invoice.numbers_to_letters}
            </Text>
          </View>

          <Text
            style={{
              ...styles.footer,
              marginTop: 4,
              marginBottom: 2,
              fontWeight: 'bold',
            }}
          >
            &quot;LA FACTURA ES BENEFICIO DE TODOS EXÍJALA&quot;
          </Text>

          {/* Table for SAG information */}
          <View
            style={{
              ...styles.table,
              marginTop: 0,
              borderWidth: 1,
              borderBottom: 0,
              borderColor: '#000',
              borderStyle: 'solid',
            }}
          >
            <View
              style={{
                ...styles.tableRow,
                paddingVertical: 2,
                borderBottom: 1,
                borderColor: '#000',
                borderStyle: 'solid',
              }}
            >
              <Text style={styles.tableCell50}>
                N° Correlativo de orden de compra exenta
              </Text>
              <Text
                style={{
                  ...styles.tableCell50,
                  borderLeft: 1,
                  borderColor: '#000',
                  borderStyle: 'solid',
                }}
              ></Text>
            </View>
            <View
              style={{
                ...styles.tableRowStriped,
                paddingVertical: 2,
                borderBottom: 1,
                borderColor: '#000',
                borderStyle: 'solid',
              }}
            >
              <Text style={styles.tableCell50}>
                N° Correlativo de constancia de registro exonerado
              </Text>
              <Text
                style={{
                  ...styles.tableCell50,
                  borderLeft: 1,
                  borderColor: '#000',
                  borderStyle: 'solid',
                }}
              ></Text>
            </View>
            <View
              style={{
                ...styles.tableRow,
                paddingVertical: 2,
                borderBottom: 1,
                borderColor: '#000',
                borderStyle: 'solid',
              }}
            >
              <Text style={styles.tableCell50}>
                N° identificativo del registro de la SAG
              </Text>
              <Text
                style={{
                  ...styles.tableCell50,
                  borderLeft: 1,
                  borderColor: '#000',
                  borderStyle: 'solid',
                }}
              ></Text>
            </View>
          </View>

          <Text
            style={{
              ...styles.footer,
              marginTop: 10,
              marginBottom: 2,
              fontWeight: 'bold',
            }}
          >
            ORIGINAL: CLIENTE COPIA: EMISOR
          </Text>

          {/* Notes Section */}
          <View style={{ ...styles.notes, marginTop: 0 }}>
            <Text style={{ fontWeight: 'bold' }}>Notas: {invoice.notes}</Text>
          </View>
        </Page>
      </Document>
    );
  };

  const pdfObject = pdf(<InvoicePDF />);

  const handlePrint = async () => {
    try {
      // const iframeRef = document.getElementsByTagName('iframe')[0];
      // iframeRef?.contentWindow?.print();

      const printIframe = document.getElementById(
        'printIframe'
      ) as HTMLIFrameElement;
      const blob = await pdfObject.toBlob();
      const blobUrl = URL.createObjectURL(blob);
      const iframe = printIframe || document.createElement('iframe');
      iframe.src = blobUrl;

      if (!printIframe) {
        iframe.id = 'printIframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.onload = () => {
          iframe.contentWindow?.print();
        };
      } else {
        iframe.contentWindow?.print();
      }

      // Print the PDF from new window
      //Generate PDF blob
      // const blob = await pdf(<InvoicePDF />).toBlob();

      // // Create object URL
      // const blobUrl = URL.createObjectURL(blob);

      // // Open in new window and print
      // const printWindow = window.open(blobUrl, '_blank');
      // if (printWindow) {
      //   printWindow.onload = () => {
      //     printWindow.print();
      //     // Clean up
      //     URL.revokeObjectURL(blobUrl);
      //   };
      // }
    } catch (error) {
      console.error('Print failed:', error);
    }
  };

  return (
    <div className='flex flex-col gap-4'>
      {/* PDF Viewer */}
      <div className='h-[calc(100vh-220px)] w-full border border-gray-300 rounded-md relative flex flex-row'>
        {/* <PDFViewer width='100%' height='100%' className='border-none'>
          <InvoicePDF />
        </PDFViewer> */}
        <PDFViewer width='100%' height='100%' className='border-none'>
          <InvoicePDF />
        </PDFViewer>
      </div>

      {/* Action Buttons */}
      <div className='flex gap-3 justify-end'>
        {/* Print Button */}
        <Button
          onClick={handlePrint}
          size='sm'
          className='flex items-center gap-2'
        >
          <PrinterIcon size={16} />
          <span>Imprimir</span>
        </Button>

        {/* Download Button */}
        <PDFDownloadLink
          document={<InvoicePDF />}
          fileName={`${pdfTitle}.pdf`}
          // className='inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
        >
          {({ loading }) => (
            <Button
              disabled={loading}
              className='flex items-center gap-2'
              size='sm'
            >
              {loading ? (
                'Preparando documento...'
              ) : (
                <>
                  <DownloadIcon size={16} className='mr-2' />
                  <span>Descargar PDF</span>
                </>
              )}
            </Button>
          )}
        </PDFDownloadLink>
      </div>
    </div>
  );
};

export default InvoiceViewPdf;
