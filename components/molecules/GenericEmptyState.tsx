import React from 'react';
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

type GenericEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonText: string;
  onAction: () => void;
} |
{
  icon: LucideIcon;
  title: string;
  description: string;
  buttonText?: string;
  onAction?: () => void;
};

const GenericEmptyState: React.FC<GenericEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  buttonText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-[600px] text-center">
      <Icon className="w-20 h-20 text-gray-400 mb-4" />
      <h2 className="text-2xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-500 mb-6 max-w-md">
        {description}
      </p>
      {onAction && <Button onClick={onAction}>
        {buttonText}
      </Button>}
    </div>
  );
};

export default GenericEmptyState;