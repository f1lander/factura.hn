"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  companyService,
  Company,
} from "@/lib/supabase/services/company";
import { Label } from "@/components/ui/label";

export default function CompanyDataForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Company>();
  const [message, setMessage] = useState("");
  const [isNewCompany, setIsNewCompany] = useState(true);

  useEffect(() => {
    logIn();
    fetchCompanyData();
  }, []);

  const logIn = async () => {
    try {
      const data = await companyService.login(
        "filanderuclez@gmail.com",
        "tipNuv-7wiffo-migfyx"
      );
      if (!data) {
        console.error("Error signing in:");
      }

      console.log("Signed in successfully");
    } catch (err) {
      console.error("Error signing in:", err);
    }
  };
  const fetchCompanyData = async () => {
    try {
      const data = await companyService.getCompany();
      if (data) {
        reset(data);
        setIsNewCompany(false);
      } else {
        setIsNewCompany(true);
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      setMessage(
        "Error al cargar los datos de la compañía. Por favor, intente de nuevo."
      );
    }
  };

  const onSubmit = async (data: Company) => {
    try {
      setMessage("");
      let result;
      if (isNewCompany) {
        result = await companyService.createCompany(data);
      } else {
        result = await companyService.updateCompany(data.id!, data);
      }

      console.log("result", result);

      if (result) {
        setMessage("¡Datos de la compañía guardados con éxito!");
        setIsNewCompany(false);
        // reset(result);
      } else {
        setMessage(
          "Error al guardar los datos de la compañía. Por favor, intente de nuevo."
        );
      }
    } catch (error) {
      console.error("Error saving company data:", error);
      setMessage(
        "Ocurrió un error al guardar los datos. Por favor, intente de nuevo."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {isNewCompany
              ? "Crear nueva compañía"
              : "Datos generales de la compañía"}
          </CardTitle>
          <CardDescription>
            {isNewCompany
              ? "Ingrese la información general de su nueva compañía."
              : "Actualice la información general de su compañía en el sistema."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre de la compañía</Label>
            <Input
              id="name"
              {...register("name", { required: "Este campo es requerido" })}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="rtn">RTN</Label>
            <Input
              id="rtn"
              {...register("rtn", { required: "Este campo es requerido" })}
            />
            {errors.rtn && (
              <p className="text-red-500 text-sm">{errors.rtn.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address0">Dirección línea 1</Label>
            <Input id="address0" {...register("address0")} />
          </div>

          <div>
            <Label htmlFor="address1">Dirección línea 2</Label>
            <Input id="address1" {...register("address1")} />
          </div>

          <div>
            <Label htmlFor="address2">Dirección línea 3</Label>
            <Input id="address2" {...register("address2")} />
          </div>

          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" {...register("phone")} />
          </div>

          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              {...register("email", {
                required: "Este campo es requerido",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Dirección de correo inválida",
                },
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos de Facturación</CardTitle>
          <CardDescription>
            Ingrese la información relacionada con la facturación de su
            compañía.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cai">CAI</Label>
            <Input id="cai" {...register("cai")} />
          </div>

          <div>
            <Label htmlFor="limit_date">Fecha límite</Label>
            <Input id="limit_date" type="date" {...register("limit_date")} />
          </div>

          <div>
            <Label htmlFor="range_invoice1">Rango de factura inicio</Label>
            <Input id="range_invoice1" {...register("range_invoice1")} />
          </div>

          <div>
            <Label htmlFor="range_invoice2">Rango de factura fin</Label>
            <Input id="range_invoice2" {...register("range_invoice2")} />
          </div>

          {message && (
            <p
              className={`text-sm ${
                message.includes("éxito") ? "text-green-500" : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Guardando..."
              : isNewCompany
              ? "Crear compañía"
              : "Guardar cambios"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
