import React from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, LucideIcon } from "lucide-react";

type GenericEmptyStateProps =
  | {
      icon: LucideIcon;
      title: string;
      description: string;
      buttonText: string;
      onAction: () => void;
      onAddExcelSpreadSheet: () => void;
    }
  | {
      icon: LucideIcon;
      title: string;
      description: string;
      buttonText?: string;
      onAction?: () => void;
      onAddExcelSpreadSheet: () => void;
    };

const GenericEmptyState: React.FC<GenericEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  buttonText,
  onAction,
  onAddExcelSpreadSheet,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-[600px] text-center">
      <Icon className="w-20 h-20 text-gray-400 mb-4" />
      <h2 className="text-2xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-500 mb-6 max-w-md">{description}</p>
      {onAction && <Button onClick={onAction}>{buttonText}</Button>}
      {onAddExcelSpreadSheet && (
        <div className="flex flex-col">
          <span className="my-2">o</span>
          <Button
            onClick={onAddExcelSpreadSheet}
            variant="outline"
            className="flex gap-2 items-center border-green-600 text-gray-900 hover:bg-green-50 hover:text-green-700"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Añadir desde archivo de Excel</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default GenericEmptyState;
