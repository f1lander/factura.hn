import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import supabase from "@/lib/supabase/client";

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

export function numberToCurrency(number: number): string {
  return number.toFixed(2);
}

export async function getSignedLogoUrl(logoUrl: string | null | undefined): Promise<string | null> {
  if (!logoUrl) return null;

  try {
    const { data, error } = await supabase()
      .storage.from("company-logos")
      .createSignedUrl(logoUrl, 600);

    if (error || !data) {
      console.error("Error fetching signed URL:", error);
      return null;
    }
    const base64Logo = await convertSignedUrlToBase64(data.signedUrl);
    return base64Logo;
  } catch (error) {
    console.error("Error in getSignedLogoUrl:", error);
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