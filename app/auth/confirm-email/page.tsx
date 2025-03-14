import React from 'react';
import { FileInputIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export default function ConfirmEmail({
  searchParams,
}: {
  searchParams: {
    name?: string;
    email?: string;
  };
}) {
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
            ¡Un último paso: Por favor, verifica tu correo!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Hola, <strong>{searchParams.name}</strong>.
          </p>
          <br />
          <ul>
            <li>
              Revisa tu bandeja de entrada en{' '}
              <strong>{searchParams.email}</strong> y haz click en el enlace de
              confirmación que hemos enviado.
            </li>
            <br />
            <li>
              <strong>Nota: </strong> Si no encuentras el correo, verifica
              también tu carpeta de spam o correo no deseado.
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Link
            href='/auth/login'
            className='text-blue-600 hover:underline focus:outline-none mx-auto'
          >
            Inicia sesión
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
