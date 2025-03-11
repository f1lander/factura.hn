'use client';

import React from 'react';
import { FileInputIcon } from 'lucide-react';
import { login } from '@/lib/supabase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useIsLoadedStore } from '@/store/isLoadedStore';
import { useCompanyStore } from '@/store/companyStore';
import { useCustomersStore } from '@/store/customersStore';
import { useInvoicesStore } from '@/store/invoicesStore';
import { useProductsStore } from '@/store/productsStore';
import Link from 'next/link';

const LoginPage: React.FC = () => {
  const { resetCompany } = useCompanyStore();
  const { resetCustomers } = useCustomersStore();
  const { resetInvoices } = useInvoicesStore();
  const { resetIsLoaded } = useIsLoadedStore();
  const { resetProducts } = useProductsStore();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetProducts();
    resetIsLoaded();
    resetInvoices();
    resetCustomers();
    resetCompany();
    const formData = new FormData(event.currentTarget);

    toast({
      title: 'Iniciando sesión...',
      description: 'Por favor espera mientras procesamos tu solicitud.',
    });
    const { success, message } = await login(formData);
    if (!success)
      return toast({
        title: 'Inicio de sesión fallido',
        description: message,
        variant: 'destructive',
      });

    toast({
      title: 'Inicio de sesión exitoso',
      description:
        'En unos instantes vas a ser redirigido a la pantalla principal',
    });

    setTimeout(() => {
      window.location.replace('/home/load-data');
    }, 100); // 2 seconds delay
  };

  return (
    <div className='h-[100dvh] w-full bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <div className='flex items-center justify-center space-x-2 mb-4'>
            <FileInputIcon className='h-12 w-12 text-blue-600' />
            <span
              className='text-3xl font-bold text-blue-600'
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              factura.hn
            </span>
          </div>
          <CardTitle className='text-2xl font-bold text-center'>
            Iniciar Sesión en tu Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Usuario</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  required
                  placeholder='usuario@ejemplo.com'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='password'>Contraseña</Label>
                <Input
                  id='password'
                  name='password'
                  type='password'
                  required
                  placeholder='Ingresa tu contraseña'
                />
              </div>
              <Button type='submit' className='w-full'>
                Iniciar sesión
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <div className='text-sm text-center w-full'>
            ¿No tienes una cuenta?
            <Link
              href='/auth/signup'
              className='ml-1 text-blue-600 hover:underline focus:outline-none'
            >
              Regístrate
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
