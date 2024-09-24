import { ChangeEvent, useState } from "react";

export function usePhoto() {
  const [photo, setPhoto] = useState<string | null>(null);

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPhoto(e.target?.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const file = event.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    // avoid browser from opening the file on a new tab
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    // avoid browser from opening the file on a new tab
    event.preventDefault();
  };

  return {
    handleFileChange,
    handleDrop,
    handleDragOver,
    photo,
    setPhoto,
  };
}
