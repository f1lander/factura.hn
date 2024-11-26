import React, { Suspense } from "react";

export default function CreateInvoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense>{children}</Suspense>;
}
