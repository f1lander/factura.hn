"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import CompanyDataForm from "@/components/molecules/CompanyDataForm";
import { getAuthAndCompanyDataClient } from "@/lib/supabase/client-utils";
import { Company } from "@/lib/supabase/services/company";

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const { isAuthenticated, user, company, error } =
          await getAuthAndCompanyDataClient();

        if (!isAuthenticated || !user) {
          router.push("/auth/login");
          return;
        }

        if (error) {
          throw new Error("Failed to load user or company data");
        }

        setCompany(company);

        if (!company) {
          toast({
            title: "Se requiere información de la compañía",
            description:
              "Por favor, añada información sobre su compañía para continuar.",
            duration: 5000,
          });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
        toast({
          title: "Error",
          description: "Failed to load user or company data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [router, toast]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <main className="container mx-auto">
      <CompanyDataForm initialCompany={company} />
    </main>
  );
}
