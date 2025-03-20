'use client';

import { Button } from '@/components/ui/button';
import { ShareIcon } from 'lucide-react';
import { pdf, PDFDownloadLink } from '@react-pdf/renderer';
import { useState } from 'react';
import { Invoice } from '@/lib/supabase/services/invoice';
import { Company } from '@/lib/supabase/services/company';
import { InvoicePDF } from './InvoiceViewPdf';

interface SharePdfButtonProps {
  invoice: Invoice;
  company: Company | null;
  sarCaiData: any;
  companyLogo: string;
  pdfTitle: string;
}

const SharePdfButton = ({
  invoice,
  company,
  sarCaiData,
  companyLogo,
  pdfTitle,
}: SharePdfButtonProps) => {
  const [isSharing, setIsSharing] = useState(false);

  const pdfObject = pdf(
    <InvoicePDF
      invoice={invoice}
      company={company}
      sarCaiData={sarCaiData}
      companyLogo={companyLogo!}
      pdfTitle={pdfTitle}
    />
  );

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const blob = await pdfObject.toBlob();
      const file = new File([blob], `${pdfTitle}.pdf`, {
        type: 'application/pdf',
      });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: pdfTitle,
          text: 'Compartir factura',
        });
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      onClick={handleShare}
      size='sm'
      className='flex sm:hidden items-center gap-2'
      disabled={isSharing}
    >
      <ShareIcon size={16} />
      {/* <span>{isSharing ? 'Compartiendo...' : 'Compartir'}</span> */}
    </Button>
  );
};

export default SharePdfButton;
