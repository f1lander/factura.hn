"use client";

import React, { useState } from "react";
import { FileInputIcon } from "lucide-react";
import { login, signup } from "@/lib/supabase/auth";
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

const LoginPage: React.FC = () => {
  const { resetCompany } = useCompanyStore();
  const { resetCustomers } = useCustomersStore();
  const { resetInvoices } = useInvoicesStore();
  const { resetIsLoaded } = useIsLoadedStore();
  const { resetProducts } = useProductsStore();
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => setIsLogin(!isLogin);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // 1. Make sure to delete all kind of user data!
    resetProducts();
    resetIsLoaded();
    resetInvoices();
    resetCustomers();
    resetCompany();
    const formData = new FormData(event.currentTarget);

    try {
      if (isLogin) {
        toast({
          title: "Iniciando sesión...",
          description: "Por favor espera mientras procesamos tu solicitud.",
        });
        const { success, message } = await login(formData);
        if (!success)
          return toast({
            title: "Inicio de sesión fallido",
            description: message,
            variant: "destructive",
          });

        toast({
          title: "Inicio de sesión exitoso",
          description:
            "En unos instantes vas a ser redirigido a la pantalla principal",
        });

        setTimeout(() => {
          window.location.replace("/home/load-data");
        }, 100); // 2 seconds delay
      } else {
        toast({
          title: "Creando cuenta...",
          description: "Por favor espera mientras procesamos tu solicitud.",
        });
        const { success, message } = await signup(formData);
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
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Error de autenticación",
        description:
          "Ocurrió un error durante el proceso. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
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
            {isLogin ? "Iniciar Sesión en tu Cuenta" : "Crear una Cuenta"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="Ingresa tu nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Apellido</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      required
                      placeholder="Ingresa tu apellido"
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico de facturas</Label>
                <Input
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
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Ingresa tu contraseña"
                />
              </div>
              <Button type="submit" className="w-full">
                {isLogin ? "Iniciar Sesión" : "Registrarse"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-center w-full">
            {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}
            <button
              onClick={toggleForm}
              className="ml-1 text-blue-600 hover:underline focus:outline-none"
            >
              {isLogin ? "Regístrate" : "Inicia Sesión"}
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
