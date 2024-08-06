import type { Metadata } from "next";
import "../globals.css";
import { Navigation } from "@/components/molecules/Navigation";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "factura.hn",
  description: "Facturación electrónica para Honduras",
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navigation />
      {children}
      <Toaster />
    </>);
}
