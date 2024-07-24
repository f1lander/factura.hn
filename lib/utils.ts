import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// utils/numberToWords.ts

const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const scales = ['', 'mil', 'millón', 'mil millones', 'billón'];

function convertLessThanOneThousand(number: number): string {
  if (number === 0) {
    return '';
  }

  let result = '';

  if (number >= 100) {
    if (number >= 200) {
      result += units[Math.floor(number / 100)] + 'cientos ';
    } else {
      result += 'cien ';
    }
    number %= 100;
  }

  if (number >= 20) {
    result += tens[Math.floor(number / 10)];
    if (number % 10 !== 0) {
      result += ' y ' + units[number % 10];
    }
  } else if (number >= 10) {
    result += teens[number - 10];
  } else {
    result += units[number];
  }

  return result.trim();
}

export function numberToWords(number: number): string {
  if (number === 0) {
    return 'cero';
  }

  let result = '';
  let scaleIndex = 0;

  while (number > 0) {
    if (number % 1000 !== 0) {
      let words = convertLessThanOneThousand(number % 1000);
      if (scaleIndex > 0) {
        words += ' ' + scales[scaleIndex];
        if (number % 1000 > 1 && scaleIndex >= 2) {
          words += 'es';
        }
      }
      result = words + ' ' + result;
    }
    number = Math.floor(number / 1000);
    scaleIndex++;
  }

  return result.trim() + ' con 00/100';
}