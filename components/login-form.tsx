import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/lib/supabase/auth';
import { toast } from '@/components/ui/use-toast';
import { useIsLoadedStore } from '@/store/isLoadedStore';
import { useCompanyStore } from '@/store/companyStore';
import { useCustomersStore } from '@/store/customersStore';
import { useInvoicesStore } from '@/store/invoicesStore';
import { useProductsStore } from '@/store/productsStore';
import Link from 'next/link';
import { Card } from './ui/card';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
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
    }, 100);
  };

  return (
    <Card className='p-4'>
      <div className={cn('flex flex-col gap-4', className)} {...props}>
        <div>
          <h1 className='text-xl font-semibold mb-2 text-black text-center'>
            Iniciar Sesión
          </h1>
          <h2 className='text-sm font-semibold mb-4 text-gray-500 text-center'>
            Accede a tu cuenta para gestionar tus facturas
          </h2>
        </div>
        {/* 
      <div className="flex flex-col lg:flex-row items-center justify-between mb-2">
        <div className="w-full lg:w-1/2 mb-2 lg:mb-0 lg:mr-1">
          <button type="button" className="w-full flex justify-center items-center gap-2 bg-white text-sm text-gray-600 p-2 rounded-md hover:bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-4" id="google">
              <path fill="#fbbb00" d="M113.47 309.408 95.648 375.94l-65.139 1.378C11.042 341.211 0 299.9 0 256c0-42.451 10.324-82.483 28.624-117.732h.014L86.63 148.9l25.404 57.644c-5.317 15.501-8.215 32.141-8.215 49.456.002 18.792 3.406 36.797 9.651 53.408z"></path>
              <path fill="#518ef8" d="M507.527 208.176C510.467 223.662 512 239.655 512 256c0 18.328-1.927 36.206-5.598 53.451-12.462 58.683-45.025 109.925-90.134 146.187l-.014-.014-73.044-3.727-10.338-64.535c29.932-17.554 53.324-45.025 65.646-77.911h-136.89V208.176h245.899z"></path>
              <path fill="#28b446" d="m416.253 455.624.014.014C372.396 490.901 316.666 512 256 512c-97.491 0-182.252-54.491-225.491-134.681l82.961-67.91c21.619 57.698 77.278 98.771 142.53 98.771 28.047 0 54.323-7.582 76.87-20.818l83.383 68.262z"></path>
              <path fill="#f14336" d="m419.404 58.936-82.933 67.896C313.136 112.246 285.552 103.82 256 103.82c-66.729 0-123.429 42.957-143.965 102.724l-83.397-68.276h-.014C71.23 56.123 157.06 0 256 0c62.115 0 119.068 22.126 163.404 58.936z"></path>
            </svg>
            <span>Google</span>
          </button>
        </div>
      </div>

      <div className="mt-2 text-sm text-gray-600 text-center">
        <p>o con tu correo</p>
      </div> */}

        <form onSubmit={handleSubmit} className='space-y-4 mt-2'>
          <div>
            <Label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700'
            >
              Correo Electrónico
            </Label>
            <Input
              id='email'
              name='email'
              type='email'
              placeholder='usuario@ejemplo.com'
              required
              className='mt-1 p-2 w-full border rounded-md focus:border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors duration-300'
            />
          </div>

          <div>
            <div className='flex items-center justify-between mb-1'>
              <Label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700'
              >
                Contraseña
              </Label>
              <Link
                href='/auth/forgot-password'
                className='text-sm text-blue-600 hover:underline'
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id='password'
              name='password'
              type='password'
              required
              className='mt-1 p-2 w-full border rounded-md focus:border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors duration-300'
            />
          </div>

          <Button
            type='submit'
            className='w-full bg-facturaBlue text-white p-2 rounded-md hover:bg-gray-800 focus:outline-none focus:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors duration-300'
          >
            Iniciar Sesión
          </Button>
        </form>

        <div className='mt-4 text-sm text-gray-600 text-center'>
          <p>
            ¿No tienes una cuenta?{' '}
            <Link href='/auth/signup' className='text-black hover:underline'>
              Regístrate aquí
            </Link>
          </p>
        </div>

        <div className='text-balance text-center text-xs text-muted-foreground mt-2'>
          Al hacer clic en continuar, aceptas nuestros{' '}
          <Link
            href='https://factura.hn/terms'
            target='_blank'
            rel='noopener noreferrer'
            className='underline underline-offset-4 hover:text-blue-600'
          >
            Términos de Servicio
          </Link>{' '}
          y{' '}
          <Link
            href='https://factura.hn/privacy'
            target='_blank'
            rel='noopener noreferrer'
            className='underline underline-offset-4 hover:text-blue-600'
          >
            Política de Privacidad
          </Link>
          .
        </div>
      </div>
    </Card>
  );
}
