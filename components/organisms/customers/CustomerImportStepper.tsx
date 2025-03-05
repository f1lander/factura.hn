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
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useMediaQuery } from '@/lib/hooks';
import { Customer, customerService } from '@/lib/supabase/services/customer';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { TrashIcon } from 'lucide-react';

type FieldMapping = {
  label: string;
  value: string;
};

enum STEPS {
  UPLOAD_FILE,
  MAP_FIELDS,
  REVIEW_DATA,
}

const steps = [
  { id: STEPS.UPLOAD_FILE, name: 'Subir Archivo' },
  { id: STEPS.MAP_FIELDS, name: 'Mapear Campos' },
  { id: STEPS.REVIEW_DATA, name: 'Revisar Datos' },
];

const defaultFieldNames = {
  name: 'name',
  rtn: 'rtn',
  email: 'email',
  // is_service: 'is_service',
};

const stepIconMap = [
  <svg
    key={STEPS.UPLOAD_FILE}
    xmlns='http://www.w3.org/2000/svg'
    width='16'
    height='16'
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
  </svg>,
  <svg
    key={STEPS.MAP_FIELDS}
    xmlns='http://www.w3.org/2000/svg'
    width='16'
    height='16'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <rect x='3' y='3' width='18' height='18' rx='2' />
    <path d='M3 9h18' />
    <path d='M9 21V9' />
  </svg>,
  <svg
    key={STEPS.REVIEW_DATA}
    xmlns='http://www.w3.org/2000/svg'
    width='16'
    height='16'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14' />
    <polyline points='22 4 12 14.01 9 11.01' />
  </svg>,
];

interface CustomersImportStepperProps {
  onCancel: () => void;
  onComplete: (mappedData: any[]) => Promise<void>;
  xlsFile: any[] | null;
  fileName: string;
  tableFieldnames: string[];
  sheetNames: string[];
  sheets?: Record<string, XLSX.Sheet>;
  handleXlsFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setCurrentSheet: React.Dispatch<React.SetStateAction<string>>;
  currentSheet: string;
  // requiredFields: string[];
  fieldMappings: FieldMapping[];
}

export function CustomerImportStepper({
  onCancel,
  onComplete,
  xlsFile,
  fileName,
  tableFieldnames,
  handleXlsFileUpload,
  sheetNames,
  setCurrentSheet,
  currentSheet,
  fieldMappings,
}: // requiredFields,
CustomersImportStepperProps) {
  const { data: existingCustomers } = useQuery(
    ['customers'],
    () => customerService.getCustomersByCompany(),
    {
      staleTime: 300000,
      cacheTime: 600000,
      refetchOnWindowFocus: true,
    }
  );
  const [currentStep, setCurrentStep] = useState(STEPS.UPLOAD_FILE);
  const [mappedData, setMappedData] = useState<any[]>([]);
  const { control, handleSubmit, setValue } = useForm({
    defaultValues: defaultFieldNames,
  });

  useEffect(() => {
    // Check if default field names exist in tableFieldnames
    Object.keys(defaultFieldNames).forEach((key) => {
      // @ts-ignore
      if (tableFieldnames.includes(defaultFieldNames[key])) {
        // @ts-ignore
        setValue(key, defaultFieldNames[key]);
      } else {
        // @ts-ignore
        setValue(key, '');
      }
    });
  }, [tableFieldnames, setValue]);

  // Add media query hook
  const isMobile = useMediaQuery('(max-width: 768px)');

  const getDuplicatedRtns = (data: Customer[]) => {
    const rtnuMap = new Map();
    const duplicates = new Set<string>();

    // Check duplicates within mappedData
    data.forEach((item) => {
      if (rtnuMap.has(item.rtn)) {
        duplicates.add(item.rtn);
      }
      rtnuMap.set(item.rtn, true);
    });

    // Check duplicates with existing Customers
    existingCustomers?.forEach((client) => {
      if (rtnuMap.has(client.rtn)) {
        duplicates.add(client.rtn);
      }
    });

    console.log({ duplicates, existingCustomers, data });

    return duplicates;
  };

  const handleFieldMapping = (data: any) => {
    if (!xlsFile) return;

    const transformedRows = xlsFile.map((row) => ({
      name: row[data.name] || '',
      rtn: String(row[data.rtn]) || '',
      email: row[data.email] || 0,
      // is_service: Boolean(row[data.is_service]?.toLowerCase()),
    }));

    setMappedData(transformedRows);
    setCurrentStep(STEPS.REVIEW_DATA);
  };

  const handleRowUpdate = async (index: number, newData: Customer) => {
    const newMappedData = [...mappedData];
    newMappedData[index] = newData;
    setMappedData(newMappedData);
  };

  const handleRowDelete = async (index: number, data: Customer) => {
    const newMappedData = [...mappedData];
    newMappedData.splice(index, 1);
    setMappedData(newMappedData);
  };

  const canGoToStep = (targetStep: STEPS) => targetStep >= currentStep;

  const handlePreviousStep = (targetStep: STEPS) => {
    // Validate if target step is less than current step
    if (canGoToStep(targetStep)) {
      return;
    }

    setCurrentStep(targetStep);
  };

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.UPLOAD_FILE:
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
              <div className='mt-4'>
                <Button
                  variant='link'
                  className='text-sm text-muted-foreground'
                  onClick={() => {
                    // Create download link for template
                    const link = document.createElement('a');
                    link.href = '/templates/Plantilla Bulk Import.xlsx';
                    link.download = 'Plantilla Bulk Import.xlsx';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  Descargar plantilla de ejemplo
                </Button>
              </div>
              {fileName && (
                <p className='text-sm text-muted-foreground'>
                  Archivo seleccionado: {fileName}
                </p>
              )}
            </div>
            <Button
              onClick={() => xlsFile && setCurrentStep(STEPS.MAP_FIELDS)}
              disabled={!xlsFile}
            >
              Siguiente
            </Button>
          </div>
        );

      case STEPS.MAP_FIELDS:
        return (
          <div className='flex flex-col gap-6 p-4 md:p-8'>
            <h2 className='text-xl md:text-2xl font-semibold'>Mapear Campos</h2>
            {/* Add sheet selector if there are multiple sheets */}
            {sheetNames.length > 0 && (
              <div className='flex flex-col md:flex-row md:items-center gap-2 md:gap-4 md:justify-between'>
                <span className='font-medium'>Hoja de Excel</span>
                <Select
                  value={currentSheet}
                  onValueChange={(value) => setCurrentSheet(value)}
                >
                  <SelectTrigger className='w-full md:w-[200px]'>
                    <SelectValue placeholder='Seleccionar hoja' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Hojas disponibles</SelectLabel>
                      {sheetNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
            <form
              onSubmit={handleSubmit(handleFieldMapping)}
              className='space-y-6'
            >
              {fieldMappings.map(({ value, label }) => (
                <div
                  key={value}
                  className='flex flex-col md:flex-row md:items-center gap-2 md:gap-4 md:justify-between'
                >
                  <span className='font-medium'>{label}</span>
                  <Controller
                    control={control}
                    // @ts-ignore
                    name={value}
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
                  onClick={() => setCurrentStep(STEPS.UPLOAD_FILE)}
                >
                  Atrás
                </Button>
                <Button type='submit'>Siguiente</Button>
              </div>
            </form>
          </div>
        );

      case STEPS.REVIEW_DATA: {
        const duplicatedRtns = getDuplicatedRtns(mappedData);
        const hasErrors = duplicatedRtns.size > 0;

        return (
          <div className='flex flex-col gap-6 p-4 md:p-8'>
            <h2 className='text-xl md:text-2xl font-semibold'>Revisar Datos</h2>
            {hasErrors && (
              <div className='rounded-md bg-destructive/15 p-3'>
                <div className='flex'>
                  <div className='ml-3'>
                    <h3 className='text-sm font-medium text-destructive'>
                      Se encontraron Clients duplicados (RTNs)
                    </h3>
                    <div className='mt-2 text-sm text-destructive/90'>
                      <ul className='list-disc space-y-1 pl-5'>
                        {Array.from(duplicatedRtns).map((rtn) => (
                          <li key={rtn}>{rtn}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {isMobile ? (
              <div className='space-y-4'>
                {mappedData.map((item, index) => (
                  <Card
                    key={index}
                    className={
                      duplicatedRtns.has(item.rtn) ? 'border-destructive' : ''
                    }
                  >
                    <CardHeader>
                      <CardTitle className='text-sm flex justify-between items-center'>
                        <span>Client #{index + 1}</span>
                        {duplicatedRtns.has(item.rtn) && (
                          <span className='text-xs text-destructive'>
                            RTN duplicado
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      {Object.entries(item).map(([key, value]) => (
                        <div key={key} className='flex flex-col gap-1'>
                          <span className='text-sm font-medium'>
                            {fieldMappings.find(
                              (mapping) => mapping.value === key
                            )?.label || key}
                          </span>
                          <Input
                            value={value as string}
                            onChange={(e) => {
                              const newData = [...mappedData];
                              newData[index] = {
                                ...newData[index],
                                [key]: e.target.value,
                              };
                              setMappedData(newData);
                            }}
                          />
                        </div>
                      ))}
                    </CardContent>
                    <CardFooter className='flex justify-end'>
                      <Button
                        variant='destructive'
                        size='icon'
                        className='bottom-4 right-4'
                        onClick={() => handleRowDelete(index, item)}
                      >
                        <TrashIcon />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <DataGrid
                title='Vista Previa'
                description='Revisa y edita antes de importar'
                data={mappedData}
                columnDefs={[
                  {
                    field: 'name',
                    headerName: 'Nombre',
                    editable: true,
                    cellStyle: (params) => ({
                      backgroundColor: duplicatedRtns.has(params.value)
                        ? 'rgba(239, 68, 68, 0.1)'
                        : '',
                      color: duplicatedRtns.has(params.value)
                        ? 'rgb(239, 68, 68)'
                        : '',
                    }),
                  },
                  {
                    field: 'rtn',
                    headerName: 'RTN',
                    editable: true,
                  },
                  {
                    field: 'email',
                    headerName: 'Email',
                    editable: true,
                  },
                ]}
                onRowUpdate={handleRowUpdate}
                onRowDelete={handleRowDelete}
                autoUpdate
              />
            )}
            <div className='flex justify-end gap-4'>
              <Button
                variant='outline'
                onClick={() => setCurrentStep(STEPS.MAP_FIELDS)}
              >
                Atrás
              </Button>
              <Button
                onClick={() => onComplete(mappedData)}
                disabled={hasErrors}
              >
                Importar Clientes
              </Button>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <div className='border-b'>
        <div className='flex h-16 items-center px-4 overflow-x-auto'>
          <div className='flex space-x-2 md:space-x-4'>
            {steps.map((step) => (
              <div
                key={`${step.id}`}
                className={`flex items-center whitespace-nowrap ${
                  currentStep === step.id
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                <Button
                  variant='ghost'
                  className={`flex items-center p-0 hover:bg-transparent ${
                    !canGoToStep(step.id)
                      ? 'cursor-pointer'
                      : `cursor-not-allowed ${
                          step.id !== currentStep && 'opacity-50'
                        }`
                  }`}
                  onClick={() => handlePreviousStep(step.id)}
                  disabled={canGoToStep(step.id) && step.id !== currentStep}
                >
                  <span
                    className={`mr-2 h-6 w-6 rounded-full flex items-center justify-center text-sm transition-all duration-200 ${
                      currentStep === step.id
                        ? 'bg-primary text-primary-foreground scale-110 shadow-sm'
                        : 'border text-muted-foreground'
                    }`}
                  >
                    {stepIconMap[step.id]}
                  </span>
                  {!isMobile && (
                    <span
                      className={`text-sm md:text-base transition-all duration-200 ${
                        currentStep === step.id ? 'transform translate-x-1' : ''
                      }`}
                    >
                      {step.name}
                    </span>
                  )}
                </Button>
                {step.id !== steps.length && (
                  <span
                    className={`mx-2 transition-colors duration-200 ${
                      currentStep === step.id
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    →
                  </span>
                )}
              </div>
            ))}
            <div
              key='save'
              className={`flex items-center whitespace-nowrap ${
                currentStep === STEPS.REVIEW_DATA
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              <div className='flex items-center'>
                <span
                  className={`mr-2 h-6 w-6 rounded-full flex items-center justify-center text-sm transition-all duration-200 ${'border text-muted-foreground'}`}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' />
                    <polyline points='17 21 17 13 7 13 7 21' />
                    <polyline points='7 3 7 8 15 8' />
                  </svg>
                </span>
                {!isMobile && (
                  <span
                    className={`text-sm md:text-base transition-all duration-200 ${
                      currentStep === STEPS.REVIEW_DATA
                        ? 'transform translate-x-1'
                        : ''
                    }`}
                  >
                    Guardar Cambios
                  </span>
                )}
              </div>
            </div>
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
