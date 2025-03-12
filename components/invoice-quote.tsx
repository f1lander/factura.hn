"use client";
import { TextGenerateEffect } from "./ui/text-generate-effect";

const quote = `La solución definitiva para la gestión de facturas e inventario, diseñada especialmente para las pequeñas empresas hondureñas que buscan eficiencia, cumplimiento fiscal y crecimiento sostenible.`;

export function InvoiceQuote() {
  return (
    <div className="max-w-lg mx-auto">
      <TextGenerateEffect 
        words={quote} 
        className="text-lg italic text-white font-medium" 
      />
    </div>
  );
} 