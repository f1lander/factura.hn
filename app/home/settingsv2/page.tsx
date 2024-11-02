// "use client";

import { getAuthAndCompanyDataClient } from "@/lib/supabase/client-utils";

// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useToast } from "@/components/ui/use-toast";
// import CompanyDataForm from "@/components/molecules/CompanyDataForm";
// import { getAuthAndCompanyDataClient } from "@/lib/supabase/client-utils";
// import { Company } from "@/lib/supabase/services/company";

export default async function Settings() {
  const res = await getAuthAndCompanyDataClient();
  console.log("The info about the auth and company data client is: ", res);
  return <div>configuraciones</div>;
}

function SettingsOld() {
  // console.log("Se ha renderizado la página de settings");
  // const [isLoading, setIsLoading] = useState(true);
  // const [company, setCompany] = useState<Company | null>(null);
  // const [error, setError] = useState<string | null>(null);
  // const router = useRouter();
  // const { toast } = useToast();
  //
  // console.log("Antes del useEffect");
  // useEffect(() => {
  //   console.log("Se ha ejecutado el useEffect");
  //   async function loadData() {
  //     console.log("Vamos a ejecutar la función asíncrona");
  //     try {
  //       console.log("Se va a ejecutar el try");
  //       const { isAuthenticated, user, company, error } =
  //         await getAuthAndCompanyDataClient();
  //
  //       if (!isAuthenticated || !user) {
  //         console.log("No pa, no estás autenticado");
  //         router.push("/auth/login");
  //         return;
  //       }
  //
  //       if (error) {
  //         console.log("Mijo, tuvimos un error al cargar la compañía");
  //         throw new Error("Failed to load user or company data");
  //       }
  //
  //       console.log("estableciendo los datos de la compañía...");
  //       setCompany(company);
  //
  //       if (!company) {
  //         toast({
  //           title: "Se requiere información de la compañía",
  //           description:
  //             "Por favor, añada información sobre su compañía para continuar.",
  //           duration: 5000,
  //         });
  //       }
  //     } catch (err) {
  //       console.log("Pasó un error. El error es: ", err);
  //       setError(
  //         err instanceof Error ? err.message : "An unexpected error occurred",
  //       );
  //       toast({
  //         title: "Error",
  //         description: "Failed to load user or company data. Please try again.",
  //         variant: "destructive",
  //       });
  //     } finally {
  //       console.log("Se ha establecido el estado a false");
  //       setIsLoading(false);
  //     }
  //   }
  //
  //   loadData();
  // }, []);
  // console.log("Después del useEffect");
  //
  // if (isLoading) {
  //   return <div>Loading...</div>;
  // }
  //
  // if (error) {
  //   return <div>Error: {error}</div>;
  // }
  //
  // return (
  //   <main className="container mx-auto">
  //     <CompanyDataForm initialCompany={company} />
  //   </main>
  // );
}
