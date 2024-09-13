import React from 'react';
import { notFound } from 'next/navigation';
import { invoiceService } from '@/lib/supabase/services/invoice';
import InvoiceViewClient from '@/components/organisms/InvoiceTemplate';
import { getAuthAndCompanyData } from '@/lib/supabase/utils';

export const dynamic = 'force-dynamic';

async function getInvoiceData(id: string) {
  const invoice = await invoiceService.getInvoiceById(id);
  if (!invoice) {
    notFound();
  }
  return invoice;
}

export default async function InvoiceViewPage({ params }: { params: { id: string } }) {
  const invoice = await getInvoiceData(params.id);

  const { company } = await getAuthAndCompanyData();

  if (!company) {
    return <p>No company found</p>
  }

  return <InvoiceViewClient invoice={invoice} company={company} />;
}