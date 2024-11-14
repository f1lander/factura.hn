"use client";

import { InputMask } from "@react-input/mask";
import React from "react";
import { FileInputIcon } from "lucide-react";
import { signupv2 } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useIsLoadedStore } from "@/store/isLoadedStore";
import { useCompanyStore } from "@/store/companyStore";
import { useCustomersStore } from "@/store/customersStore";
import { useInvoicesStore } from "@/store/invoicesStore";
import { useProductsStore } from "@/store/productsStore";
import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";

export interface SignupForm {
  company_name: string;
  rtn: string;
  full_name: string;
  email: string;
  password: string;
}

const SignupPage: React.FC = () => {
  const { resetCompany } = useCompanyStore();
  const { resetCustomers } = useCustomersStore();
  const { resetInvoices } = useInvoicesStore();
  const { resetIsLoaded } = useIsLoadedStore();
  const { resetProducts } = useProductsStore();
  const { register, handleSubmit } = useForm<SignupForm>({
    defaultValues: {
      company_name: "",
      rtn: "",
      full_name: "",
      email: "",
      password: "",
    },
  });
  const onSubmit: SubmitHandler<SignupForm> = async (data) => {
    // reset stores
    resetProducts();
    resetIsLoaded();
    resetInvoices();
    resetCustomers();
    resetCompany();
    toast({
      title: "Creando cuenta...",
      description: "Por favor espera mientras procesamos tu solicitud.",
    });
    const { success, message } = await signupv2(data);
    if (!success) {
      return toast({
        title: "Registro fallido",
        variant: "destructive",
        description: message,
      });
    }

    toast({
      title: "Cuenta creada exitosamente",
      description:
        "Revisa tu bandeja de entrada de tu correo electrónico para verificar tu cuenta y, posteriormente, iniciar sesión con ella",
    });
  };

  return (
    <div className="h-[100dvh] w-full bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <FileInputIcon className="h-12 w-12 text-blue-600" />
            <span
              className="text-3xl font-bold text-blue-600"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              factura.hn
            </span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Crear una cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nombre de la compañía</Label>
                <Input
                  {...register("company_name", {
                    required: "Se requiere el nombre de la compañía",
                  })}
                  id="company_name"
                  name="company_name"
                  type="text"
                  required
                  placeholder="Ingresa el nombre de tu compañía"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rtn">RTN</Label>
                <InputMask
                  mask="____-______-____"
                  replacement={{ _: /\d/ }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("rtn", {
                    required: "Por favor, ingrese su RTN",
                  })}
                  id="rtn"
                  name="rtn"
                  type="text"
                  required
                  placeholder="0000-000000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input
                  {...register("full_name", {
                    required: "Por favor, ingrese su nombre completo",
                  })}
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  placeholder="Ingresa tu nombre completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico de facturas</Label>
                <Input
                  {...register("email", {
                    required:
                      "Por favor, ingrese su dirección de correo electrónico",
                  })}
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Ingresa tu correo electrónico de facturas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  {...register("password", {
                    required: "Por favor, ingrese su contraseña",
                  })}
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Ingresa tu contraseña"
                />
              </div>
              <Button type="submit" className="w-full">
                Registrarse
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-center w-full">
            ¿Ya tienes una cuenta?
            <Link
              href="/auth/login"
              className="ml-1 text-blue-600 hover:underline focus:outline-none"
            >
              Inicia sesión
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignupPage;
