import { Toaster } from "@/components/ui/toaster";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
 
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
