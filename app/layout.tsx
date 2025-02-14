import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { Inter as FontSans } from 'next/font/google';
import { cn } from '@/lib/utils';
import ReactQueryProvider from '@/utils/providers/ReactQueryProvider';
import Script from 'next/script';

const fontSans = FontSans({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'factura.hn - Facturación simplificada para Honduras',
  description:
    'Simplifica tu facturación electrónica en Honduras con factura.hn. Gestiona clientes, productos y servicios de forma fácil y eficiente.',
  openGraph: {
    title: 'factura.hn - Facturación simplificada para Honduras',
    description:
      'factura.hn es tu solución integral para la facturación electrónica en Honduras. Gestiona clientes, productos y servicios, crea facturas con facilidad, realiza un seguimiento de pagos y genera informes detallados. Simplifica tu proceso de facturación y cumple con las regulaciones fiscales hondureñas de manera eficiente.',
    url: 'https://factura.hn',
    siteName: 'factura.hn',
    images: [
      {
        url: 'https://factura.hn/og-facturahn.png',
        width: 1200,
        height: 630,
        alt: 'factura.hn - Facturación simplificada para Honduras',
      },
    ],
    locale: 'es_HN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'factura.hn - Facturación simplificada para Honduras',
    description:
      'Simplifica tu facturación electrónica en Honduras. Gestiona clientes, productos, servicios y cumple con las regulaciones fiscales de forma fácil y eficiente.',
    images: ['https://factura.hn/og-facturahn.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ReactQueryProvider>
      <html lang='es'>
        <Script src='../lib/scripts/clarity.js' />
        <body
          suppressHydrationWarning={true}
          className={cn(
            'min-h-screen bg-background antialiased',
            fontSans.className
          )}
        >
          <>
            {children}
            <Toaster />
          </>
        </body>
      </html>
    </ReactQueryProvider>
  );
}
