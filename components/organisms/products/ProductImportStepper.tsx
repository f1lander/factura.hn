import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataGrid } from '@/components/molecules/DataGrid';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMediaQuery } from '@/lib/hooks';
import { Switch } from '@/components/ui/switch';
import { Product } from '@/lib/supabase/services/product';

interface ProductImportStepperProps {
  onCancel: () => void;
  onComplete: (mappedData: any[]) => Promise<void>;
  xlsFile: any[] | null;
  fileName: string;
  tableFieldnames: string[];
  handleXlsFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProductImportStepper({
  onCancel,
  onComplete,
  xlsFile,
  fileName,
  tableFieldnames,
  handleXlsFileUpload,
}: ProductImportStepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [mappedData, setMappedData] = useState<any[]>([]);
  const { control, handleSubmit } = useForm({
    defaultValues: {
      sku: '',
      description: '',
      unit_cost: '',
      is_service: '',
    },
  });

  // Add media query hook
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Update steps with Spanish names
  const steps = [
    { id: 1, name: 'Subir Archivo' },
    { id: 2, name: 'Mapear Campos' },
    { id: 3, name: 'Revisar Datos' },
  ];

  const handleFieldMapping = (data: any) => {
    if (!xlsFile) return;

    const transformedRows = xlsFile.map((row) => ({
      sku: row[data.sku] || '',
      description: row[data.description] || '',
      unit_cost: row[data.unit_cost] || 0,
      is_service: Boolean(row[data.is_service]?.toLowerCase()),
    }));

    setMappedData(transformedRows);
    setCurrentStep(3);
  };

  const handleRowUpdate = async (index: number, newData: Product) => {
    const newMappedData = [...mappedData];
    newMappedData[index] = newData;
    setMappedData(newMappedData);
  };

  const handleRowDelete = async (index: number, data: Product) => {
    const newMappedData = [...mappedData];
    newMappedData.splice(index, 1);
    setMappedData(newMappedData);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className='flex flex-col items-center gap-6 p-4 md:p-8'>
            <h2 className='text-xl md:text-2xl font-semibold'>
              Subir Archivo Excel
            </h2>
            <div className='w-full max-w-96 text-center'>
              <Button
                variant='outline'
                className='w-full h-24 mb-4 flex flex-col items-center justify-center gap-2 border-dashed'
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                  <polyline points='17 8 12 3 7 8' />
                  <line x1='12' y1='3' x2='12' y2='15' />
                </svg>
                <span>
                  {fileName ? 'Reemplazar archivo' : 'Subir archivo Excel'}
                </span>
              </Button>
              <Input
                id='file-upload'
                type='file'
                accept='.xlsx,.xls,.csv'
                onChange={handleXlsFileUpload}
                className='hidden'
              />
              {fileName && (
                <p className='text-sm text-muted-foreground'>
                  Archivo seleccionado: {fileName}
                </p>
              )}
            </div>
            <Button
              onClick={() => xlsFile && setCurrentStep(2)}
              disabled={!xlsFile}
            >
              Siguiente
            </Button>
          </div>
        );

      case 2:
        return (
          <div className='flex flex-col gap-6 p-4 md:p-8'>
            <h2 className='text-xl md:text-2xl font-semibold'>Mapear Campos</h2>
            <form
              onSubmit={handleSubmit(handleFieldMapping)}
              className='space-y-6'
            >
              {[
                { key: 'sku', label: 'Código' },
                { key: 'description', label: 'Descripción' },
                { key: 'unit_cost', label: 'Precio Unitario' },
                { key: 'is_service', label: 'Tipo de Producto' },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  className='flex flex-col md:flex-row md:items-center gap-2 md:gap-4 md:justify-between'
                >
                  <span className='font-medium'>{label}</span>
                  <Controller
                    control={control}
                    // @ts-ignore
                    name={key}
                    render={({ field: { onChange, value } }) => (
                      <Select onValueChange={onChange} value={value}>
                        <SelectTrigger className='w-full md:w-[200px]'>
                          <SelectValue placeholder='Seleccionar columna' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Columnas</SelectLabel>
                            {tableFieldnames.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              ))}
              <div className='flex justify-end gap-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setCurrentStep(1)}
                >
                  Atrás
                </Button>
                <Button type='submit'>Siguiente</Button>
              </div>
            </form>
          </div>
        );

      case 3:
        return (
          <div className='flex flex-col gap-6 p-4 md:p-8'>
            <h2 className='text-xl md:text-2xl font-semibold'>Revisar Datos</h2>
            {isMobile ? (
              <div className='space-y-4'>
                {mappedData.map((item, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className='text-sm'>
                        Item #{index + 1}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      {Object.entries(item).map(([key, value]) => (
                        <div key={key} className='flex flex-col gap-1'>
                          <span className='text-sm font-medium'>
                            {key === 'sku'
                              ? 'SKU'
                              : key === 'description'
                              ? 'Descripción'
                              : key === 'unit_cost'
                              ? 'Precio Unitario'
                              : 'Es Servicio'}
                          </span>
                          {key === 'is_service' ? (
                            <div className='flex items-center justify-between space-x-2'>
                              <Switch
                                id={`toggle-${index}`}
                                checked={value as boolean}
                                onCheckedChange={(checked) => {
                                  const newData = [...mappedData];
                                  newData[index] = {
                                    ...newData[index],
                                    [key]: checked,
                                  };
                                  setMappedData(newData);
                                }}
                                className='data-[state=checked]:bg-primary'
                              />
                              <label
                                htmlFor={`toggle-${index}`}
                                className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                              >
                                {value ? 'Servicio' : 'Producto'}
                              </label>
                            </div>
                          ) : (
                            <Input
                              value={value as string}
                              onChange={(e) => {
                                const newData = [...mappedData];
                                newData[index] = {
                                  ...newData[index],
                                  [key]:
                                    key === 'unit_cost'
                                      ? Number(e.target.value)
                                      : e.target.value,
                                };
                                setMappedData(newData);
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <DataGrid
                title='Vista Previa'
                description='Revisa y edita antes de importar'
                data={mappedData}
                columnDefs={[
                  { field: 'sku', headerName: 'SKU', editable: true },
                  {
                    field: 'description',
                    headerName: 'Descripción',
                    editable: true,
                  },
                  {
                    field: 'unit_cost',
                    headerName: 'Precio Unitario',
                    editable: true,
                  },
                  {
                    field: 'is_service',
                    headerName: 'Es Servicio',
                    editable: true,
                  },
                ]}
                onRowDelete={handleRowDelete}
                autoUpdate
              />
            )}
            <div className='flex justify-end gap-4'>
              <Button variant='outline' onClick={() => setCurrentStep(2)}>
                Atrás
              </Button>
              <Button onClick={() => onComplete(mappedData)}>
                Importar Productos
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <div className='border-b'>
        <div className='flex h-16 items-center px-4 overflow-x-auto'>
          <div className='flex space-x-2 md:space-x-4'>
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center whitespace-nowrap ${
                  currentStep === step.id
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <div className='flex items-center'>
                  <span className='mr-2 h-6 w-6 rounded-full border flex items-center justify-center text-sm'>
                    {step.id}
                  </span>
                  <span className='text-sm md:text-base'>{step.name}</span>
                </div>
                {step.id !== steps.length && <span className='mx-2'>→</span>}
              </div>
            ))}
          </div>
          <Button
            variant='ghost'
            className='ml-auto whitespace-nowrap'
            onClick={onCancel}
          >
            Cancelar
          </Button>
        </div>
      </div>
      <div className='container mx-auto'>{renderStep()}</div>
    </div>
  );
}
