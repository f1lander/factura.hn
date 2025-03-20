'use client';
import { DocumentProps } from '@react-pdf/renderer';
import dynamic from 'next/dynamic';
import { JSXElementConstructor, ReactElement } from 'react';

// Import PDF components with no SSR
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  { ssr: false }
);

interface PdfViewerProps {
  children: ReactElement<DocumentProps, string | JSXElementConstructor<any>>;
}

const PdfViewer = ({ children }: PdfViewerProps) => {
  return (
    <PDFViewer width='100%' height='100%' className='border-none'>
      {children}
    </PDFViewer>
  );
};

export default PdfViewer;
