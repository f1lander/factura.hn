'use client';
import * as React from 'react';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { es } from 'date-fns/locale';
import { X } from 'lucide-react';

interface DatePickerProps {
  onChange?: (date: Date | undefined) => void;
  className?: string;
  value?: Date;
  placeholder?: string;
}

export function DatePicker({
  onChange,
  className,
  value,
  placeholder,
}: DatePickerProps) {
  const handleDateChange = (newDate: Date | undefined) => {
    // setDate(newDate || new Date());
    if (onChange) {
      onChange(newDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full md:w-[240px] justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {value ? (
            format(value, 'PP', { locale: es })
          ) : (
            <span>{placeholder || 'Seleccione fecha'}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          locale={es}
          mode='single'
          selected={value}
          onSelect={handleDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
