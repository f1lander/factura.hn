import { ChangeEvent, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

type DataRow = Record<string, any>;

export default function useUploadXls() {
  const [areProductsLoading, setAreProductsLoading] = useState<boolean>(false);
  const [xlsFile, setXlsFile] = useState<DataRow[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [tableFieldnames, setTableFieldnames] = useState<string[]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sheets, setSheets] = useState<Record<string, XLSX.Sheet>>();
  const [currentSheet, setCurrentSheet] = useState('');
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
    reader.readAsArrayBuffer(file);

    reader.onload = (event: ProgressEvent<FileReader>) => {
      const binaryStr = event.target?.result;
      if (!binaryStr) {
        return;
      }
      const workbook = XLSX.read(binaryStr, { type: 'buffer' });
      const _sheetNames = workbook.SheetNames;
      const sheetName = workbook.SheetNames[0];
      const _sheets = workbook.Sheets;
      const sheet = workbook.Sheets[sheetName];
      const sheetData: DataRow[] = XLSX.utils.sheet_to_json(sheet);

      setXlsFile(sheetData);
      const allFields = new Set<string>();
      sheetData.forEach((row) => {
        Object.keys(row).forEach((key) => allFields.add(key));
      });
      setTableFieldnames(Array.from(allFields));
      setSheetNames(_sheetNames);
      setSheets(_sheets);
      setCurrentSheet(sheetName);
    };
    setIsAddProductsWithSpreadsheetDialogOpen(true); // when you upload a file, always open the dialog for uploading xls
  };

  useEffect(() => {
    xlsFile && setIsAddProductsWithSpreadsheetDialogOpen(true);
  }, [xlsFile]);

  return {
    getCurrentSheeData: () => {
      const sheet = sheets?.[currentSheet];
      if (!sheet) {
        return [];
      }
      const sheetData: DataRow[] = XLSX.utils.sheet_to_json(sheet);
      return sheetData;
    },
    getCurrentSheetFieldNames: () => {
      const sheet = sheets?.[currentSheet];
      if (!sheet) {
        return [];
      }
      const sheetData: DataRow[] = XLSX.utils.sheet_to_json(sheet);
      const allFields = new Set<string>();
      sheetData.forEach((row) => {
        Object.keys(row).forEach((key) => allFields.add(key));
      });
      return Array.from(allFields);
    },
    setCurrentSheet,
    handleXlsFileUpload,
    setXlsFile,
    currentSheet,
    xlsFile,
    fileName,
    tableFieldnames,
    sheetNames,
    sheets,
    isAddProductsWithSpreadsheetDialogOpen,
    setIsAddProductsWithSpreadsheetDialogOpen,
    isTablePreviewDialogOpen,
    setIsTablePreviewDialogOpen,
    areProductsLoading,
    setAreProductsLoading,
  };
}
