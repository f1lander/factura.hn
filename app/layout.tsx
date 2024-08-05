import type { Metadata } from "next";
import "./globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
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
  const header = headers();
  const pathname = header.get('next-url')
  console.log("pathname", pathname)
  return (
    <html lang="en">
      <body
        suppressHydrationWarning={true}
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
