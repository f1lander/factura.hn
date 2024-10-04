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
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const toggleForm = () => setIsLogin(!isLogin);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      if (isLogin) {
        toast({
          title: "Iniciando sesión...",
          description: "Por favor espera mientras procesamos tu solicitud.",
        });
        await login(formData);
        // If the code reaches this section, it means the await code
        // didn't throw
        toast({
          title: "Inicio de sesión exitoso",
          description: "Redirigiendo a la página de facturas...",
        });
        setTimeout(() => {
          window.location.replace("/home/load-data");
        }, 100); // 2 seconds delay
      } else {
        toast({
          title: "Creando cuenta...",
          description: "Por favor espera mientras procesamos tu solicitud.",
        });
        await signup(formData);
        toast({
          title: "Cuenta creada exitosamente",
          description: "Redirigiendo a la página de configuración...",
        });
        setTimeout(() => {
          window.location.replace("/home/settings");
        }, 1000); // 2 seconds delay
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
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Ingresa tu correo electrónico"
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
