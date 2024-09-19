"use client";

import React from "react";
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
import { companyService, Company } from "@/lib/supabase/services/company";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface CompanyDataFormProps {
  initialCompany: Company | null;
}

export default function CompanyDataForm({
  initialCompany,
}: CompanyDataFormProps) {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Omit<Company, "id" | "user_id">>({
    defaultValues: initialCompany || undefined,
  });

  const onSubmit = async (data: Omit<Company, "id" | "user_id">) => {
    try {
      let result;
      if (initialCompany) {
        result = await companyService.updateCompany(initialCompany.id, data);
      } else {
        result = await companyService.createCompany(data);
      }

      if (result) {
        toast({
          title: "Éxito",
          description:
            "Los datos de la compañía se han guardado correctamente.",
        });
      } else {
        throw new Error("Failed to save company data");
      }
    } catch (error) {
      console.error("Error saving company data:", error);
      toast({
        title: "Error",
        description:
          "Ocurrió un error al guardar los datos. Por favor, intente de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {initialCompany
              ? "Datos generales de la compañía"
              : "Crear nueva compañía"}
          </CardTitle>
          <CardDescription>
            {initialCompany
              ? "Actualice la información general de su compañía en el sistema."
              : "Ingrese la información general de su nueva compañía."}
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
          <div className="grid grid-cols-2 space-x-2">
            <div>
              <Label htmlFor="ceo_name">Nombre (Gerente)</Label>

              <Input
                id="ceo_name"
                {...register("ceo_name", {
                  required: "Este campo es requerido",
                })}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="ceo_name">Apellido</Label>

              <Input
                id="ceo_lastname"
                {...register("ceo_lastname", {
                  required: "Este campo es requerido",
                })}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>
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
            <Textarea
              id="address0"
              {...register("address0", {
                required: "Este campo es requerido",
              })}
            />
          </div>
          <div className="grid grid-cols-2 space-x-2">
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
            <Input
              id="cai"
              {...register("cai", {
                required: "Este campo es requerido",
                pattern: {
                  value:
                   /^[0-9A-Fa-f]{6}-[0-9A-Fa-f]{12}-[0-9A-Fa-f]{6}-[0-9A-Fa-f]{6}-[0-9A-Fa-f]{2}$/,
                  message: "El formato del CAI no es válido",
                },
              })}
            />
            {errors.cai && (
              <p className="text-red-500 text-sm">{errors.cai.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="limit_date">Fecha límite</Label>
            <Input id="limit_date" type="date" {...register("limit_date")} />
          </div>
          <div className="grid grid-cols-2 space-x-2">
            <div>
              <Label htmlFor="range_invoice1">Rango de factura inicio</Label>
              <Input id="range_invoice1" {...register("range_invoice1")} />
            </div>

            <div>
              <Label htmlFor="range_invoice2">Rango de factura fin</Label>
              <Input id="range_invoice2" {...register("range_invoice2")} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Guardando..."
              : initialCompany
                ? "Guardar cambios"
                : "Crear compañía"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
