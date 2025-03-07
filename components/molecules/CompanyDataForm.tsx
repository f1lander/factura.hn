'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { companyService, Company } from '@/lib/supabase/services/company';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import supabase from '@/lib/supabase/client';
import { usePhoto } from '@/hooks/usePhoto';
import CloudIcon from './icons/CloudIcon';
import { useRouter } from 'next/navigation';
import { InputMask } from '@react-input/mask';
import { invoiceService } from '@/lib/supabase/services/invoice';
import { useCompanyStore } from '@/store/companyStore';
import { endOfDay, format, transpose } from 'date-fns';
import { tz } from '@date-fns/tz';
import { SarCai, sarCaiService } from '@/lib/supabase/services/sar_cai';
import { UTCDate } from '@date-fns/utc';
import { useQuery } from '@tanstack/react-query';
/** The fact that initialCompany can be null is extremely important:
 *
 * If the initialCompany is null, then it means that we have a new user and it'll
 * change the actions to be taken from now on
 * */
interface CompanyDataFormProps {
  initialCompany: Company | null;
}

type CompanyFormData = Omit<Company & { sarCaiData: Omit<SarCai, 'id'> }, 'id'>;

export default function CompanyDataForm({
  initialCompany,
}: CompanyDataFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { syncCompany } = useCompanyStore();

  const { photo, handleFileChange, handleDrop, handleDragOver, setPhoto } =
    usePhoto();

  // In case there's already a company, then get the logo_url with a presigned url
  useEffect(() => {
    if (initialCompany !== null && initialCompany.logo_url !== null) {
      console.log('The value of initialCompany is: ', initialCompany.logo_url);
      supabase()
        .storage.from('company-logos')
        .createSignedUrl(initialCompany.logo_url!, 600)
        .then((value) => {
          if (value.error || !value.data)
            return console.log('There was an error fetching the image');
          setPhoto(value.data.signedUrl);
        });
    } else {
      setPhoto('/placeholder.jpg');
    }
  }, [initialCompany, setPhoto]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormData>({
    defaultValues: initialCompany
      ? {
          ...initialCompany,
          limit_date:
            initialCompany.limit_date &&
            format(new Date(initialCompany.limit_date), 'yyyy-MM-dd'),
        }
      : undefined,
  });

  const { data: sarCaiData } = useQuery({
    queryKey: ['sar_cai', initialCompany?.id],
    queryFn: () =>
      sarCaiService.getActiveSarCaiByCompanyId(initialCompany!.id!),
    enabled: !!initialCompany,
    onSuccess: (data) => {
      setValue('sarCaiData', {
        cai: data?.cai || '',
        limit_date: data?.limit_date
          ? format(new Date(data?.limit_date), 'yyyy-MM-dd')
          : '',
        range_invoice1: data?.range_invoice1 || '',
        range_invoice2: data?.range_invoice2 || '',
        company_id: initialCompany?.id || '',
        created_at: data?.created_at || new Date().toISOString(),
        updated_at: data?.updated_at || new Date().toISOString(),
      });
    },
  });

  const handleLogoUpload = async (
    companyId: string,
    photoBase64: string
  ): Promise<string | null> => {
    try {
      const fileType = photoBase64.split(';')[0].split(':')[1];
      const fileExtension = fileType.split('/')[1];
      const imageData = photoBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(imageData, 'base64');

      const { data: uploadedPhoto, error: uploadPhotoError } = await supabase()
        .storage.from('company-logos')
        .upload(`public/company_${companyId}.${fileExtension}`, buffer, {
          cacheControl: '3600',
          contentType: fileType,
          upsert: true, // Add this to update existing files
        });

      if (uploadPhotoError || !uploadedPhoto) {
        console.error('Photo upload failed:', uploadPhotoError);
        return null;
      }

      return uploadedPhoto.path;
    } catch (error) {
      console.error('Error uploading logo:', error);
      return null;
    }
  };

  const onSubmit = async (data: CompanyFormData) => {
    data.logo_url = '';

    try {
      const {
        data: { user },
      } = await supabase().auth.getUser();
      data.user_id = user?.id!;

      if (initialCompany) {
        toast({
          title: 'Actualizando datos de compañía...',
        });

        const updates: Partial<Company> = {
          ...data,
          limit_date:
            data.limit_date &&
            transpose(
              endOfDay(new UTCDate(data.limit_date)),
              tz(Intl.DateTimeFormat().resolvedOptions().timeZone)
            ).toISOString(),
        };

        // Handle logo update if photo changed
        if (photo) {
          const logoPath = await handleLogoUpload(initialCompany.id, photo);
          if (logoPath) {
            updates.logo_url = logoPath;
          }
        }
        const result = await companyService.updateCompany(
          initialCompany.id,
          updates
        );
        syncCompany();

        if (result.error !== null) {
          return toast({
            variant: 'destructive',
            title: 'Error al actualizar la compañía',
            description:
              'Hubo un error al intentar actualizar los datos de compañía. Por favor, intente más tarde',
          });
        }

        // Check if sarCaiData has changed
        if (
          sarCaiData &&
          (data.sarCaiData.cai !== sarCaiData.cai ||
            data.sarCaiData.limit_date !==
              format(new Date(sarCaiData.limit_date), 'yyyy-MM-dd') ||
            data.sarCaiData.range_invoice1 !== sarCaiData.range_invoice1 ||
            data.sarCaiData.range_invoice2 !== sarCaiData.range_invoice2)
        ) {
          // Create new SarCai record
          await sarCaiService.createSarCai({
            ...data.sarCaiData,
            company_id: initialCompany.id,
            limit_date: transpose(
              endOfDay(new UTCDate(data.sarCaiData.limit_date)),
              tz(Intl.DateTimeFormat().resolvedOptions().timeZone)
            ).toISOString(),
          });
        }

        return toast({
          title: 'Se actualizaron los datos de compañía con éxito',
        });
      } else {
        // Create new company
        const result = await companyService.createCompany(data);
        if (!result) {
          return toast({
            variant: 'destructive',
            title: 'Error al crear la compañía',
          });
        }

        // Create initial SarCai record for new company
        if (data.sarCaiData) {
          await sarCaiService.createSarCai({
            ...data.sarCaiData,
            company_id: result[0].id,
            limit_date: transpose(
              endOfDay(new UTCDate(data.sarCaiData.limit_date)),
              tz(Intl.DateTimeFormat().resolvedOptions().timeZone)
            ).toISOString(),
          });
        }

        if (photo) {
          const logoPath = await handleLogoUpload(result[0].id, photo);
          if (logoPath) {
            await companyService.updateCompany(result[0].id, {
              logo_url: logoPath,
            });
          }
        }

        toast({
          title: 'Éxito',
          description:
            'Los datos de la compañía se han guardado correctamente. En unos instantes te redirigiremos a la página de facturas.',
        });
        router.push('/home/load-data');
      }
    } catch (error) {
      console.error('Error saving company data:', error);
      toast({
        title: 'Error',
        description:
          'Ocurrió un error al guardar los datos. Por favor, intente de nuevo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>
            {initialCompany
              ? 'Datos generales de la compañía'
              : 'Crear nueva compañía'}
          </CardTitle>
          <CardDescription>
            {initialCompany
              ? 'Actualice la información general de su compañía en el sistema.'
              : 'Ingrese la información general de su nueva compañía.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/*Here it goes!*/}
          <div className='flex flex-col gap-2'>
            <Label htmlFor='something'>Logo de la compañía</Label>
            <div className='flex flex-col justify-around settingsPageMin:flex-row gap-3'>
              <div className='relative w-full settingsPageMin:w-[50%] h-[100px] settingsPageMin:h-auto z-0'>
                <Image
                  src={photo !== null ? photo : '/placeholder.jpg'}
                  alt='concierto-coldplay'
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <label
                htmlFor='coverImage'
                className='flex settingsPageMin:w-1/3 w-[80%] mx-auto'
              >
                <div
                  className='flex flex-col justify-center items-center gap-2 w-full border-dashed border-2 border-gray-300 p-4 rounded-[14px]'
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <input
                    id='coverImage'
                    {...register('logo_url')}
                    type='file'
                    accept='image/*'
                    onChange={handleFileChange}
                    className='hidden'
                  />
                  <CloudIcon />
                  <span className='font-medium text-sm text-[#2A302D]'>
                    Selecciona un archivo o arrástralo
                  </span>
                  <span className='font-normal text-[11px] text-[#6B736F]'>
                    JPG, PNG
                  </span>
                </div>
              </label>
            </div>
            {errors.logo_url && (
              <p className='text-red-500 text-sm bottom-0'>
                {errors.logo_url.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor='name'>Nombre de la compañía</Label>

            <Input
              id='name'
              {...register('name', { required: 'Este campo es requerido' })}
            />
            {errors.name && (
              <p className='text-red-500 text-sm'>{errors.name.message}</p>
            )}
          </div>
          <div className='flex flex-col settingsPageMin:flex-row gap-3'>
            <div className='w-full'>
              <Label htmlFor='ceo_name'>Nombre (Gerente)</Label>

              <Input id='ceo_name' {...register('ceo_name')} />
              {errors.ceo_name && (
                <p className='text-red-500 text-sm'>
                  {errors.ceo_name.message}
                </p>
              )}
            </div>
            <div className='w-full'>
              <Label htmlFor='ceo_name'>Apellido</Label>

              <Input id='ceo_lastname' {...register('ceo_lastname')} />
              {errors.ceo_lastname && (
                <p className='text-red-500 text-sm'>
                  {errors.ceo_lastname.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor='rtn'>RTN</Label>
            <InputMask
              mask='____-______-____'
              replacement={{ _: /\d/ }}
              className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
              {...register('rtn', {
                required: 'Por favor, ingrese su RTN',
              })}
              id='rtn'
              name='rtn'
              type='text'
              required
              placeholder='Ingresa tu RTN'
            />
            {errors.rtn && (
              <p className='text-red-500 text-sm'>{errors.rtn.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor='address0'>Dirección línea 1</Label>
            <Textarea id='address0' {...register('address0')} />
            {errors.address0 && (
              <p className='text-red-500 text-sm'>{errors.address0.message}</p>
            )}
          </div>
          <div className='flex gap-3 flex-col settingsPageMin:flex-row'>
            <div className='w-full'>
              <Label htmlFor='phone'>Teléfono</Label>
              <Input type='number' id='phone' {...register('phone')} />
              {errors.phone && (
                <p className='text-red-500 text-sm'>{errors.phone.message}</p>
              )}
            </div>

            <div className='w-full'>
              <Label htmlFor='email'>Correo electrónico</Label>
              <Input
                id='email'
                type='email'
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Dirección de correo inválida',
                  },
                })}
              />
              {errors.email && (
                <p className='text-red-500 text-sm'>{errors.email.message}</p>
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
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='cai'>CAI</Label>
            <InputMask
              id='sarCaiData.cai'
              {...register('sarCaiData.cai', {
                required: 'Por favor, ingresa tu CAI',
              })}
              placeholder='000000-000000000000-000000-000000-00'
              className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
              mask='______-____________-______-______-__'
              replacement={{ _: /[A-Z0-9]/ }}
            />
            {errors.cai && (
              <p className='text-red-500 text-sm'>{errors.cai.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor='limit_date'>Fecha límite</Label>
            <Input
              id='limit_date'
              type='date'
              {...register('sarCaiData.limit_date')}
            />
            {errors.limit_date && (
              <p className='text-red-500 text-sm'>
                {errors.limit_date.message}
              </p>
            )}
          </div>
          <div className='flex flex-col settingsPageMin:flex-row gap-3'>
            <div className='w-full'>
              <Label htmlFor='range_invoice1'>Rango de factura inicio</Label>
              <InputMask
                className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                mask='___-___-__-________'
                replacement={{ _: /\d/ }}
                {...register('sarCaiData.range_invoice1', {
                  required: 'Por favor, ingresa un rango de factura de inicio',
                  pattern: {
                    value: /^(\d{3})-(\d{3})-(\d{2})-(\d{8})$/,
                    message:
                      'El formato del rango de factura de inicio no es válido',
                  },
                })}
                placeholder='000-000-00-00000000'
              />
              {errors.range_invoice1 && (
                <p className='text-red-500 text-sm'>
                  {errors.range_invoice1.message}
                </p>
              )}
            </div>

            <div className='w-full'>
              <Label htmlFor='range_invoice2'>Rango de factura fin</Label>
              <InputMask
                className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                mask='___-___-__-________'
                replacement={{ _: /\d/ }}
                id='range_invoice2'
                {...register('sarCaiData.range_invoice2', {
                  required: 'Por favor, ingresa un rango de factura de fin',
                  pattern: {
                    value: /^(\d{3})-(\d{3})-(\d{2})-(\d{8})$/,
                    message:
                      'El formato del rango de factura de fin no es válido',
                  },
                  validate: (value, formValues) => {
                    // If they're undefined, they'll be validated by other rules
                    if (
                      value === undefined &&
                      formValues.range_invoice2 === undefined
                    )
                      return true;

                    const invoiceRange1 = formValues.range_invoice1 as string;
                    const invoiceRange2 = value as string;
                    const isRange1LessThanRange2 =
                      invoiceService.compareInvoiceNumbers(
                        invoiceRange1,
                        invoiceRange2
                      ) === 'first less than second';
                    if (!isRange1LessThanRange2)
                      return 'El rango de factura fin debe ser mayor que el rango de factura de inicio';
                  },
                })}
                placeholder='000-000-00-00000000'
              />
              {errors.range_invoice2 && (
                <p className='text-red-500 text-sm'>
                  {errors.range_invoice2.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className='border-t px-6 py-4'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting
              ? 'Guardando...'
              : initialCompany
              ? 'Guardar cambios'
              : 'Crear compañía'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
