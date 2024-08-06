import type { Metadata } from "next";
import "./globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
const fontSans = FontSans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "factura.hn",
  description: "Facturación electrónica para Honduras",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
 
  return (
    <html lang="en">
      <body
        suppressHydrationWarning={true}
        className={cn(
          "min-h-screen bg-background antialiased",
          fontSans.className
        )}
      >
        {children}
      </body>
    </html>
  );
}
