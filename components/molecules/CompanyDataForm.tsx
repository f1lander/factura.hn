"use client";

import React from "react";
import Image from "next/image";
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
import supabase from "@/lib/supabase/client";
import { usePhoto } from "@/hooks/usePhoto";
import CloudIcon from "./icons/CloudIcon";

interface CompanyDataFormProps {
  initialCompany: Company | null;
}

export default function CompanyDataForm({
  initialCompany,
}: CompanyDataFormProps) {
  const { toast } = useToast();

  const { photo, handleFileChange, handleDrop, handleDragOver } = usePhoto();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Omit<Company, "id">>({
    defaultValues: initialCompany || undefined,
  });

  const onSubmit = async (data: Omit<Company, "id">) => {
    try {
      const { data: userData } = await supabase().auth.getUser();
      data.user_id = userData.user!.id;
      let result;
      data.company_logo = ""; // we can't upload an entire data url to a PostgreSQL row, so I'll leave it empty for now
      if (initialCompany) {
        result = await companyService.updateCompany(initialCompany!.id, data);
      } else {
        console.log("since there's no company, we're running the code here");
        result = await companyService.createCompany(data);
        console.log(
          "our result after creating the brand new company is: ",
          result,
        );
      }

      if (result) {
        toast({
          title: "Éxito",
          description:
            "Los datos de la compañía se han guardado correctamente.",
        });
      } else {
        console.log("The value of result was: ", result);
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
          {/*Here it goes!*/}
          <div className="flex flex-col gap-2">
            <Label htmlFor="something">Logo de la compañía</Label>
            <div className="flex">
              <div className="relative w-[50%] h-auto z-0">
                <Image
                  src={photo !== null ? photo : "/placeholder.jpg"}
                  alt="concierto-coldplay"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>
              <label htmlFor="coverImage" className="flex w-1/3">
                <div
                  className="flex flex-col justify-center items-center gap-2 w-full border-dashed border-2 border-gray-300 p-4 rounded-[14px]"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <input
                    id="coverImage"
                    {...register("company_logo", {
                      required: "Necesitas un logo para tu compañía",
                    })}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <CloudIcon />
                  <span className="font-medium text-sm text-[#2A302D]">
                    Selecciona un archivo o arrástralo
                  </span>
                  <span className="font-normal text-[11px] text-[#6B736F]">
                    JPG, PNG
                  </span>
                </div>
              </label>
            </div>
            {errors.company_logo && (
              <p className="text-red-500 text-sm bottom-0">
                {errors.company_logo.message}
              </p>
            )}
          </div>

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
              {errors.ceo_name && (
                <p className="text-red-500 text-sm">
                  {errors.ceo_name.message}
                </p>
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
              {errors.ceo_lastname && (
                <p className="text-red-500 text-sm">
                  {errors.ceo_lastname.message}
                </p>
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
            {errors.address0 && (
              <p className="text-red-500 text-sm">{errors.address0.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 space-x-2">
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                type="number"
                id="phone"
                {...register("phone", {
                  required: "Este campo es requerido",
                  valueAsNumber: true,
                })}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone.message}</p>
              )}
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
            <Input
              id="limit_date"
              type="date"
              {...register("limit_date", {
                required: "Este campo es requerido",
              })}
            />
            {errors.limit_date && (
              <p className="text-red-500 text-sm">
                {errors.limit_date.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 space-x-2">
            <div>
              <Label htmlFor="range_invoice1">Rango de factura inicio</Label>
              <Input
                id="range_invoice1"
                {...register("range_invoice1", {
                  required: "Este campo es requerido",
                })}
              />
              {errors.range_invoice1 && (
                <p className="text-red-500 text-sm">
                  {errors.range_invoice1.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="range_invoice2">Rango de factura fin</Label>
              <Input
                id="range_invoice2"
                {...register("range_invoice2", {
                  required: "Este campo es requerido",
                })}
              />
              {errors.range_invoice2 && (
                <p className="text-red-500 text-sm">
                  {errors.range_invoice2.message}
                </p>
              )}
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
