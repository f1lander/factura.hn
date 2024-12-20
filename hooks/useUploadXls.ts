import { ChangeEvent, useEffect, useState } from "react";
import * as XLSX from "xlsx";

type DataRow = Record<string, any>;

export default function useUploadXls() {
  const [areProductsLoading, setAreProductsLoading] = useState<boolean>(false);
  const [xlsFile, setXlsFile] = useState<DataRow[] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [tableFieldnames, setTableFieldnames] = useState<string[]>([]);
  const [
    isAddProductsWithSpreadsheetDialogOpen,
    setIsAddProductsWithSpreadsheetDialogOpen,
  ] = useState<boolean>(false);
  const [isTablePreviewDialogOpen, setIsTablePreviewDialogOpen] =
    useState<boolean>(false);

  const handleXlsFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.readAsBinaryString(file);

    reader.onload = (event: ProgressEvent<FileReader>) => {
      const binaryStr = event.target?.result;
      if (typeof binaryStr !== "string") {
        return;
      }
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const sheetData: DataRow[] = XLSX.utils.sheet_to_json(sheet);

      setXlsFile(sheetData);
      setTableFieldnames(Object.keys(sheetData[0]));
    };
    setIsAddProductsWithSpreadsheetDialogOpen(true); // when you upload a file, always open the dialog for uploading xls
  };

  useEffect(() => {
    xlsFile && setIsAddProductsWithSpreadsheetDialogOpen(true);
  }, [xlsFile]);

  return {
    handleXlsFileUpload,
    setXlsFile,
    xlsFile,
    fileName,
    tableFieldnames,
    isAddProductsWithSpreadsheetDialogOpen,
    setIsAddProductsWithSpreadsheetDialogOpen,
    isTablePreviewDialogOpen,
    setIsTablePreviewDialogOpen,
    areProductsLoading,
    setAreProductsLoading,
  };
}
