'use client';

import { InputMask } from '@react-input/mask';
import React, { useState } from 'react';
import { FileInputIcon } from 'lucide-react';
import {
  addUserAndCompany,
  checkUserExistence,
  createUser,
} from '@/lib/supabase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { InvoiceQuote } from '@/components/invoice-quote';
import Image from 'next/image';
import { FacturaLogo } from '@/components/molecules/Navigation';

export interface SignupForm {
  company_name: string;
  rtn: string;
  full_name: string;
  email: string;
  password: string;
}

const SignupPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { register, handleSubmit } = useForm<SignupForm>({
    defaultValues: {
      company_name: '',
      rtn: '',
      full_name: '',
      email: '',
      password: '',
    },
  });
  const onSubmit: SubmitHandler<SignupForm> = async (data) => {
    setIsLoading(true);
    toast({
      title: '(1 de 4) Verificando existencia de usuario...',
    });

    try {
      const { success, message } = await checkUserExistence(data);
      if (!success) {
        setIsLoading(false);
        return toast({
          title: 'Registro fallido',
          variant: 'destructive',
          description: message,
        });
      }
      toast({
        title: '(2 de 4) Creando usuario...',
      });
      const {
        success: createUserSuccess,
        message: userCreationMessage,
        userId,
      } = await createUser(data);
      if (!createUserSuccess || userId === undefined) {
        return toast({
          title: 'Registro fallido',
          variant: 'destructive',
          description: userCreationMessage,
        });
      }
      toast({
        title: '(3 de 4) Añadiendo usuario y compañía...',
      });
      const { success: companySuccess, message: companyCreationMessage } =
        await addUserAndCompany(data, userId);
      if (!companySuccess) {
        return toast({
          title: 'Registro fallido',
          variant: 'destructive',
          description: companyCreationMessage,
        });
      }
      toast({
        title: '(4 de 4) Registro exitoso',
        description:
          'Te has registrado exitosamente. Lee las instrucciones que te mostramos a continuación',
      });

      return router.push(
        `/auth/confirm-email?name=${data.full_name}&email=${data.email}`
      );
    } catch (error) {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Pane - Illustration (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 bg-white text-black relative">


        {/* Full-size image that covers the entire left pane */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/factura-login.png"
            alt="Login illustration"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Overlay with the quote */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-black/30 backdrop-blur-sm">
          <InvoiceQuote />
        </div>
      </div>

      {/* Right Pane - Signup Form */}
      <div className="flex flex-col w-full lg:w-1/2 items-center justify-center bg-gray-100 p-4">
        <div className="flex items-center justify-center space-x-2 mb-6 w-full">

          <FacturaLogo />

        </div>
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">


          <h1 className="text-xl font-semibold text-center mb-6">Crear una cuenta</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nombre de la compañía</Label>
              <Input
                {...register('company_name', {
                  required: 'Se requiere el nombre de la compañía',
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
                mask="______________"
                replacement={{ _: /\d/ }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                {...register('rtn', {
                  required: 'Por favor, ingrese su RTN',
                })}
                id="rtn"
                name="rtn"
                type="text"
                required
                placeholder="00000000000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                {...register('full_name', {
                  required: 'Por favor, ingrese su nombre completo',
                })}
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder="Ingresa tu nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                {...register('email', {
                  required:
                    'Por favor, ingrese su dirección de correo electrónico',
                })}
                id="email"
                name="email"
                type="email"
                required
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                {...register('password', {
                  required: 'Por favor, ingrese su contraseña',
                })}
                id="password"
                name="password"
                type="password"
                required
                placeholder="Ingresa tu contraseña"
              />
            </div>
            <Button type="submit" className="w-full bg-facturaBlue text-white hover:bg-gray-800" disabled={isLoading}>
              {isLoading ? 'Registrando...' : 'Registrarse'}
            </Button>

            <div className="text-sm text-center w-full mt-4">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/auth/login"
                className="text-blue-600 hover:underline focus:outline-none"
              >
                Inicia sesión
              </Link>
            </div>

            <div className="text-balance text-center text-xs text-muted-foreground mt-2">
              Al registrarte, aceptas nuestros <Link href="/terms" className="underline underline-offset-4 hover:text-blue-600">Términos de Servicio</Link>{" "}
              y <Link href="/privacy" className="underline underline-offset-4 hover:text-blue-600">Política de Privacidad</Link>.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
