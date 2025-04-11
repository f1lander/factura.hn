import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import supabase from '@/lib/supabase/client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// utils/numberToWords.ts

const units = [
  '',
  'uno',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
];
const teens = [
  'diez',
  'once',
  'doce',
  'trece',
  'catorce',
  'quince',
  'dieciséis',
  'diecisiete',
  'dieciocho',
  'diecinueve',
];
const tens = [
  '',
  '',
  'veinte',
  'treinta',
  'cuarenta',
  'cincuenta',
  'sesenta',
  'setenta',
  'ochenta',
  'noventa',
];
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
    return 'cero con 00/100';
  }

  // Handle negative numbers
  const isNegative = number < 0;
  number = Math.abs(number);

  // Split number into integer and decimal parts
  const integerPart = Math.floor(number);
  const decimalPart = Math.round((number - integerPart) * 100);

  let result = '';
  let scaleIndex = 0;
  let tempNumber = integerPart;

  while (tempNumber > 0) {
    if (tempNumber % 1000 !== 0) {
      let words = convertLessThanOneThousand(tempNumber % 1000);

      // Handle special case for "un mil"
      if (tempNumber % 1000 === 1 && scaleIndex === 1) {
        words = '';
      }

      if (scaleIndex > 0) {
        // Add scale word (mil, millón, etc.)
        words += (words ? ' ' : '') + scales[scaleIndex];

        // Add plural form for millions and above
        if (tempNumber % 1000 > 1 && scaleIndex >= 2) {
          words += 'es';
        }
      }

      // Handle special case for "un millón" and similar
      if (tempNumber % 1000 === 1 && scaleIndex >= 2) {
        words = 'un ' + scales[scaleIndex];
      }

      result = words + (result ? ' ' + result : '');
    }
    tempNumber = Math.floor(tempNumber / 1000);
    scaleIndex++;
  }

  // Format the final result
  result = result.trim();
  if (isNegative) {
    result = 'menos ' + result;
  }

  // Add decimal part
  const decimalStr = decimalPart.toString().padStart(2, '0');
  return result + ' con ' + decimalStr + '/100';
}

export function numberToCurrency(number: number): string {
  return number.toLocaleString('en');
}

export async function getSignedLogoUrl({
  logoUrl,
  bucketName = 'company-logos',
}: {
  logoUrl: string | null | undefined;
  bucketName?: string;
}): Promise<string | null> {
  if (!logoUrl) return null;

  try {
    const { data, error } = await supabase()
      .storage.from(bucketName)
      .createSignedUrl(logoUrl, 600);

    if (error || !data) {
      console.error('Error fetching signed URL:', error);
      return null;
    }
    const base64Logo = await convertSignedUrlToBase64(data.signedUrl);
    return base64Logo;
  } catch (error) {
    console.error('Error in getSignedLogoUrl:', error);
    return null;
  }
}

const convertSignedUrlToBase64 = async (signedUrl: string): Promise<string> => {
  try {
    // Fetch the image
    const response = await fetch(signedUrl);
    const blob = await response.blob();

    // Create base64 string
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

// If date is in DD/MM/YYYY format, convert it properly
export const formatDate = (dateStr: string | undefined | null): string => {
  // If no date provided, return today's date
  if (!dateStr) return new Date().toLocaleDateString('en-GB');

  // If already in correct format, return as is
  if (dateStr.includes('/')) return dateStr;

  // If in YYYY-MM-DD format, convert to DD/MM/YYYY
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export async function getSignedImageUrl(
  bucketName: string,
  imagePath: string | null | undefined
): Promise<string | null> {
  if (!imagePath) return null;

  try {
    const { data, error } = await supabase()
      .storage.from(bucketName)
      .createSignedUrl(imagePath, 600);

    if (error || !data) {
      console.error(`Error fetching signed URL from ${bucketName}:`, error);
      return null;
    }
    const base64Image = await convertSignedUrlToBase64(data.signedUrl);
    return base64Image;
  } catch (error) {
    console.error(`Error in getSignedImageUrl for ${bucketName}:`, error);
    return null;
  }
}

export async function getSignedProductImageUrl(
  imagePath: string | null | undefined
): Promise<string | null> {
  if (!imagePath) return null;

  try {
    const { data, error } = await supabase()
      .storage.from('products-bucket')  // Your existing bucket
      .createSignedUrl(imagePath, 600);

    if (error || !data) {
      console.error('Error fetching signed URL for product image:', error);
      return null;
    }
    const base64Image = await convertSignedUrlToBase64(data.signedUrl);
    return base64Image;
  } catch (error) {
    console.error('Error in getSignedProductImageUrl:', error);
    return null;
  }
}
