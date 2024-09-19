"use client";
import React, { useState } from "react";
import { CheckCircle, ChevronLeft, ChevronRight, File, ListFilter, Search, XCircle, FilterXIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { Invoice } from "@/lib/supabase/services/invoice";

import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";

import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Toggle } from "@/components/ui/toggle";

const statusMap: { [key: string]: string } = {
	'Pagadas': 'paid',
	'Pendientes': 'pending',
	'Anuladas': 'cancelled'
};

export const getStatusBadge = (status: string) => {
	switch (status.toLowerCase()) {
		case 'pagadas':
		case 'paid':
			return <Badge className="bg-green-500 text-white">Pagada</Badge>;
		case 'pendientes':
		case 'pending':
			return <Badge className="bg-yellow-500 text-white">Pendiente</Badge>;
		case 'anuladas':
		case 'cancelled':
			return <Badge className="bg-red-500 text-white">Anulada</Badge>;
		default:
			return null;
	}
};

export interface InvoicesTableProps {
	invoices: Invoice[];
	onSelectInvoice: (invoiceId: string) => void;
	onSearch: (searchTerm: string) => void;
	onDateRangeChange: (startDate: Date | undefined, endDate: Date | undefined) => void;
	onStatusFilterChange: (statuses: string[]) => void;
	onExport: () => void;
	onDateSearch: () => void;
	onUpdateStatus: (invoiceIds: string[], newStatus: string) => void;
}

const InvoiceStatusButtons = ({ selectedInvoices, onUpdateStatus }: { selectedInvoices: string[], onUpdateStatus: (newStatus: string) => void; }) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [currentAction, setCurrentAction] = useState<string | null>(null);

	const handleOpenDialog = (action: string) => {
		setCurrentAction(action);
		setIsDialogOpen(true);
	};

	const handleConfirmAction = () => {
		if (currentAction) {
			onUpdateStatus(currentAction);
		}
		setIsDialogOpen(false);
	};

	return (
		<div className="mb-4 flex gap-2">
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogTrigger asChild>
					<Button
						onClick={() => handleOpenDialog('paid')}
						disabled={selectedInvoices.length === 0}
						className="bg-green-500 hover:bg-green-300 text-foreground"
					>
						<CheckCircle className="mr-2 h-4 w-4" />
						Pagada
					</Button>
				</DialogTrigger>
				<DialogTrigger asChild>
					<Button
						onClick={() => handleOpenDialog('cancelled')}
						disabled={selectedInvoices.length === 0}
						className="bg-white text-foreground border-2 border-red-300 hover:bg-red-50"
					>
						<XCircle className="mr-2 h-4 w-4" />
						Anular
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Confirmar acción</DialogTitle>
						<DialogDescription>
							{currentAction === 'paid'
								? `¿Está seguro de que desea marcar ${selectedInvoices.length} factura(s) como pagadas?`
								: `¿Está seguro de que desea anular ${selectedInvoices.length} factura(s)?`}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button onClick={() => setIsDialogOpen(false)} variant="outline">Cancelar</Button>
						<Button onClick={handleConfirmAction} type="submit">
							{currentAction === 'paid' ? 'Marcar como pagada' : 'Anular factura'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
	invoices,
	onSelectInvoice,
	onSearch,
	onDateRangeChange,
	onStatusFilterChange,
	onExport,
	onDateSearch,
	onUpdateStatus,
}) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [startDate, setStartDate] = useState<Date | undefined>();
	const [endDate, setEndDate] = useState<Date | undefined>();
	const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['pending']);
	const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newSearchTerm = e.target.value;
		setSearchTerm(newSearchTerm);
		onSearch(newSearchTerm);
	};

	const handleStartDateChange = (date: Date | undefined) => {
		setStartDate(date);
		onDateRangeChange(date, endDate);
	};

	const handleEndDateChange = (date: Date | undefined) => {
		setEndDate(date);
		onDateRangeChange(startDate, date);
	};

	const handleStatusChange = (status: string) => {
		const dbStatus = statusMap[status] || status.toLowerCase();
		const updatedStatuses = selectedStatuses.includes(dbStatus)
			? selectedStatuses.filter(s => s !== dbStatus)
			: [...selectedStatuses, dbStatus];
		setSelectedStatuses(updatedStatuses);
		onStatusFilterChange(updatedStatuses);
	};

	const handleOnClearDates = () => {
		setStartDate(undefined);
		setEndDate(undefined);
		onDateRangeChange(undefined, undefined);
	}

	const handleSelectAllChange = (checked: boolean) => {
		if (checked) {
			setSelectedInvoices(invoices.map(invoice => invoice.id));
		} else {
			setSelectedInvoices([]);
		}
	};

	const handleInvoiceSelect = (invoiceId: string, checked: boolean) => {
		if (checked) {
			setSelectedInvoices([...selectedInvoices, invoiceId]);
		} else {
			setSelectedInvoices(selectedInvoices.filter(id => id !== invoiceId));
		}
	};

	const handleUpdateStatus = (newStatus: string) => {
		onUpdateStatus(selectedInvoices, newStatus);
		setSelectedInvoices([]);
	};

	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10; // You can adjust this as needed

	// Calculate total pages
	const totalPages = Math.ceil(invoices.length / itemsPerPage);

	// Get current page items
	const getCurrentPageItems = () => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return invoices.slice(startIndex, endIndex);
	};
	return (
		<div className="flex w-full flex-col gap-4">
			<div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 w-full">
				<div className="w-full lg:w-1/3">
					<Input
						placeholder="Buscar facturas..."
						value={searchTerm}
						onChange={handleSearchChange}
						className="w-full bg-white"
					/>
				</div>
				<div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full lg:w-2/3">
					<div className="flex flex-row space-x-2 w-full md:w-3/5">
						<DatePicker onChange={handleStartDateChange} className="w-1/2" />
						<DatePicker onChange={handleEndDateChange} className="w-1/2" />
					</div>
					<div className="flex flex-row space-x-2 w-full md:w-2/5 items-center">
						<Button
							size="sm"
							className="w-1/2 gap-2 bg-white text-foreground border-2 border-blue-300 hover:bg-blue-50"
							onClick={handleOnClearDates}
						>
							Limpiar Filtros<FilterXIcon className="h-4 w-4" />
						</Button>
						<Button
							size="sm"
							className="w-1/2 gap-2 bg-white text-foreground border-2 border-violet-300 hover:bg-violet-50"
							onClick={onDateSearch}
						>
							Buscar<Search className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>

			<Card>
				<CardHeader className="px-7 flex flex-col items-start justify-between md:flex-row md:items-center">
					<CardTitle className="w-full">Facturas recientes</CardTitle>
					<div className="flex flex-row items-start gap-2  md:items-center md:justify-between">
						<Toggle
							pressed={selectedStatuses.includes("paid")}
							onPressedChange={() => handleStatusChange('paid')}
							className="h-8 px-3 py-1 transition-colors duration-200 bg-green-500 text-white hover:bg-green-500/90"
						>
							Pagadas
						</Toggle>
						<Toggle
							pressed={selectedStatuses.includes("pending")}
							onPressedChange={() => handleStatusChange('pending')}
							className="h-8 px-3 py-1 transition-colors duration-200 bg-yellow-500 text-white hover:bg-yellow-500/90"
						>
							Pendientes
						</Toggle>
						<Toggle
							pressed={selectedStatuses.includes("cancelled")}
							onPressedChange={() => handleStatusChange('cancelled')}
							className="h-8 px-3 py-1 transition-colors duration-200 bg-red-500 text-white hover:bg-red-500/90"
						>
							Anuladas
						</Toggle>



						{/* <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="h-8 gap-1 text-sm" onClick={onExport}>
                                <File className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Exportar</span>
                            </Button>
                        </div> */}
					</div>
				</CardHeader>
				{/* <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
                        <div className="flex items-end gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 gap-1 text-sm border-blue-300">
                                        <ListFilter className="h-3.5 w-3.5" />
                                        <span className="sr-only sm:not-sr-only ">Estado Factura</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem
                                        checked={selectedStatuses.includes('pending')}
                                        onCheckedChange={() => handleStatusChange('pending')}
                                    >
                                        Pendientes
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={selectedStatuses.includes('paid')}
                                        onCheckedChange={() => handleStatusChange('paid')}
                                    >
                                        Pagadas
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={selectedStatuses.includes('cancelled')}
                                        onCheckedChange={() => handleStatusChange('cancelled')}
                                    >
                                        Anuladas
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button size="sm" variant="outline" className="h-8 gap-1 text-sm" onClick={onExport}>
                                <File className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only">Exportar</span>
                            </Button>
                        </div>
                        <span className="text-sm font-medium">Mostrando estados de facturas:</span>
                        <div className="flex gap-2">
                            {selectedStatuses.map(status => getStatusBadge(status))}
                        </div>
                    </div> */}

				<CardContent>
					<InvoiceStatusButtons selectedInvoices={selectedInvoices} onUpdateStatus={handleUpdateStatus} />
					<EnhancedInvoiceTable
						invoices={invoices}
						selectedInvoices={selectedInvoices}
						onSelectInvoice={onSelectInvoice}
						handleSelectAllChange={handleSelectAllChange}
						handleInvoiceSelect={handleInvoiceSelect}
						getCurrentPageItems={getCurrentPageItems}
						getStatusBadge={getStatusBadge} />
					{/* <Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[50px]">
									<Checkbox
										checked={selectedInvoices.length === invoices.length}
										onCheckedChange={handleSelectAllChange}
									/>
								</TableHead>
								<TableHead>Número de Factura</TableHead>
								<TableHead>Fecha</TableHead>
								<TableHead>Cliente</TableHead>
								<TableHead className="text-right">Subtotal</TableHead>
								<TableHead className="text-right">Impuesto</TableHead>
								<TableHead className="text-right">Total</TableHead>
								<TableHead>Estado</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{getCurrentPageItems().map((invoice) => (
								<TableRow
									key={invoice.id}
									className="cursor-pointer hover:bg-muted/50"
								>
									<TableCell>
										<Checkbox
											checked={selectedInvoices.includes(invoice.id)}
											onCheckedChange={(checked) => handleInvoiceSelect(invoice.id, checked as boolean)}
										/>
									</TableCell>
									<TableCell onClick={() => onSelectInvoice(invoice.id)}>{invoice.invoice_number}</TableCell>
									<TableCell onClick={() => onSelectInvoice(invoice.id)}>
										{new Date(invoice.date).toLocaleDateString()}
									</TableCell>
									<TableCell onClick={() => onSelectInvoice(invoice.id)}>
										{invoice.customers.name || invoice.customer_id}
									</TableCell>
									<TableCell className="text-right" onClick={() => onSelectInvoice(invoice.id)}>
										${invoice.subtotal.toFixed(2)}
									</TableCell>
									<TableCell className="text-right" onClick={() => onSelectInvoice(invoice.id)}>
										${invoice.tax.toFixed(2)}
									</TableCell>
									<TableCell className="text-right" onClick={() => onSelectInvoice(invoice.id)}>
										${invoice.total.toFixed(2)}
									</TableCell>
									<TableCell onClick={() => onSelectInvoice(invoice.id)}>
										{getStatusBadge(invoice.status)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table> */}
				</CardContent>
				<CardFooter className="flex items-center justify-between">
					<div>
						Página {currentPage} de {totalPages}
					</div>
					<div className="flex gap-2">
						<Button
							onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
							disabled={currentPage === 1}
							variant="outline"
							size="sm"
						>
							<ChevronLeft className="h-4 w-4" />
							Anterior
						</Button>
						<Button
							onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
							disabled={currentPage === totalPages}
							variant="outline"
							size="sm"
						>
							Siguiente
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
};


const EnhancedInvoiceTable = ({ invoices, selectedInvoices, onSelectInvoice, handleSelectAllChange, handleInvoiceSelect, getCurrentPageItems, getStatusBadge }: any) => {
	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<Table>
			<TableHeader>
				<TableRow className="bg-muted/50">
					<TableHead className="w-[50px]">
						<Checkbox
							checked={selectedInvoices.length === invoices.length}
							onCheckedChange={handleSelectAllChange}
						/>
					</TableHead>
					<TableHead className="font-semibold">Número de Factura</TableHead>
					<TableHead className="font-semibold">Fecha</TableHead>
					<TableHead className="font-semibold">Cliente</TableHead>
					<TableHead className="text-right font-semibold">Subtotal</TableHead>
					<TableHead className="text-right font-semibold">Impuesto</TableHead>
					<TableHead className="text-right font-semibold">Total</TableHead>
					<TableHead className="font-semibold">Estado</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{getCurrentPageItems().map((invoice: Invoice) => (
					<TableRow
						key={invoice.id}
						className="cursor-pointer hover:bg-muted/50 transition-colors"
					>
						<TableCell className="py-4">
							<Checkbox
								checked={selectedInvoices.includes(invoice.id)}
								onCheckedChange={(checked) => handleInvoiceSelect(invoice.id, checked)}
							/>
						</TableCell>
						<TableCell className="py-4" onClick={() => onSelectInvoice(invoice.id)}>{invoice.invoice_number}</TableCell>
						<TableCell className="py-4" onClick={() => onSelectInvoice(invoice.id)}>
							{new Date(invoice.date).toLocaleDateString()}
						</TableCell>
						<TableCell className="py-4" onClick={() => onSelectInvoice(invoice.id)}>
							<div className="flex items-center space-x-2">
								<Avatar>
									<AvatarFallback>{getInitials(invoice.customers.name || 'Unknown')}</AvatarFallback>
								</Avatar>

								<span>{invoice.customers.name || invoice.customer_id}</span>
							</div>
						</TableCell>
						<TableCell className="text-right py-4" onClick={() => onSelectInvoice(invoice.id)}>
							{`Lps. ${invoice.subtotal.toFixed(2)}`}
						</TableCell>
						<TableCell className="text-right py-4" onClick={() => onSelectInvoice(invoice.id)}>
							{`Lps. ${invoice.tax.toFixed(2)}`}
						</TableCell>
						<TableCell className="text-right py-4" onClick={() => onSelectInvoice(invoice.id)}>
							{`Lps. ${invoice.total.toFixed(2)}`}
						</TableCell>
						<TableCell className="py-4" onClick={() => onSelectInvoice(invoice.id)}>
							{getStatusBadge(invoice.status)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};
