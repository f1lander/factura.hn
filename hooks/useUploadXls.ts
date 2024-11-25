import { ChangeEvent, useEffect, useState } from "react";
import * as XLSX from "xlsx";

interface DataRow {
  [key: string]: any;
}

export default function useUploadXls() {
  const [xlsFile, setXlsFile] = useState<DataRow[] | null>(null);
  const [
    isAddProductsWithSpreadsheetDialogOpen,
    setIsAddProductsWithSpreadsheetDialogOpen,
  ] = useState<boolean>(false);

  const handleXlsFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.readAsBinaryString(file);

    reader.onload = (event: ProgressEvent<FileReader>) => {
      const binaryStr = event.target?.result;
      if (typeof binaryStr !== "string") {
        return;
      }
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      console.log("the workbook is: ", workbook);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      console.log("The sheet is: ", sheet);
      const sheetData: DataRow[] = XLSX.utils.sheet_to_json(sheet);

      setXlsFile(sheetData);
    };
  };

  useEffect(() => {
    xlsFile && setIsAddProductsWithSpreadsheetDialogOpen(true);
  }, [xlsFile]);

  return {
    handleXlsFileUpload,
    xlsFile,
    isAddProductsWithSpreadsheetDialogOpen,
    setIsAddProductsWithSpreadsheetDialogOpen,
  };
}
