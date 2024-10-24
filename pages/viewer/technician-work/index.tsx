import React, { useEffect, useRef, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import useDarkMode from '../../../hooks/useDarkMode';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import SubHeader, {
	SubHeaderLeft,
	SubHeaderRight,
	SubheaderSeparator,
} from '../../../layout/SubHeader/SubHeader';
import Icon from '../../../components/icon/Icon';
import Input from '../../../components/bootstrap/forms/Input';
import Button from '../../../components/bootstrap/Button';
import Page from '../../../layout/Page/Page';
import Card, { CardBody, CardTitle } from '../../../components/bootstrap/Card';
import Dropdown, { DropdownToggle, DropdownMenu } from '../../../components/bootstrap/Dropdown';
import Swal from 'sweetalert2';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Checks, { ChecksGroup } from '../../../components/bootstrap/forms/Checks';
import Select from '../../../components/bootstrap/forms/Select';
import Option from '../../../components/bootstrap/Option';
import { useGetBillsQuery } from '../../../redux/slices/billApiSlice';
import { useGetTechniciansQuery } from '../../../redux/slices/technicianManagementApiSlice';
import { toPng, toSvg } from 'html-to-image';
import { DropdownItem }from '../../../components/bootstrap/Dropdown';
import jsPDF from 'jspdf'; 
import autoTable from 'jspdf-autotable';

const Index: NextPage = () => {
	const { darkModeStatus } = useDarkMode(); // Dark mode
	const [searchTerm, setSearchTerm] = useState(''); // State for search term
	const [deleteModalStatus, setDeleteModalStatus] = useState<boolean>(false);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const Status = [
		{ Status: 'waiting to in progress' },
		{ Status: 'in progress' },
		{ Status: 'completed' },
		{ Status: 'reject' },
		{ Status: 'in progress to complete' }

	];
	const inputRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		const handleKeyDown = (event:any) => {
		  if (event.key) {  // Check if the Enter key is pressed
			if (inputRef.current) {
			  inputRef.current.focus();
			}
		  }
		};
	
		// Attach event listener for keydown
		window.addEventListener('keydown', handleKeyDown);
	
		// Cleanup event listener on component unmount
		return () => {
		  window.removeEventListener('keydown', handleKeyDown);
		};
	  }, []);
	
	

	const [addModalStatus, setAddModalStatus] = useState<boolean>(false); // State for add modal status
	const [editModalStatus, setEditModalStatus] = useState<boolean>(false); // State for edit modal status
	const [id, setId] = useState<string>(''); // State for current stock item ID

	const { data: bills, error: billsError, isLoading: billsLoading } = useGetBillsQuery(undefined);
	const { data: technicians, error: techniciansError, isLoading: techniciansLoading } = useGetTechniciansQuery(undefined);
	console.log('tech', technicians);
	
	const [startDate, setStartDate] = useState<string>(''); // State for start date
	const [endDate, setEndDate] = useState<string>(''); // State for end date
	const filteredTransactions = bills?.filter((trans: any) => {
		const transactionDate = new Date(trans.date); // Parse the transaction date
		const start = startDate ? new Date(startDate) : null; // Parse start date if provided
		const end = endDate ? new Date(endDate) : null; // Parse end date if provided
	
		// Apply date range filter if both start and end dates are selected
		if (start && end) {
			return transactionDate >= start && transactionDate <= end;
		} 
		// If only start date is selected
		else if (start) {
			return transactionDate >= start;
		} 
		// If only end date is selected
		else if (end) {
			return transactionDate <= end;
		}
	
		return true; // Return all if no date range is selected
	});
	// Function to get technician name by TechnicianNo
	const getTechnicianName = (technicianNum: string) => {
		const technician = technicians?.find((tech: any) => tech.technicianNum === technicianNum);
		return technician ? technician.name : 'Unknown';
	};

	// Function to handle the download in different formats
	const handleExport = async (format: string) => {
		const table = document.querySelector('table');
		if (!table) return;
	
		// Remove borders and hide last cells before exporting
		modifyTableForExport(table as HTMLElement, true);
	
		try {
			// Handle export based on the format
			switch (format) {
				case 'svg':
					await downloadTableAsSVG();
					break;
				case 'png':
					await downloadTableAsPNG();
					break;
				case 'csv':
					downloadTableAsCSV(table as HTMLElement);
					break;
				case 'pdf':
					downloadTableAsPDF(table as HTMLElement);
					break;
				default:
					console.warn('Unsupported export format: ', format);
			}
		} catch (error) {
			console.error('Error exporting table: ', error);
		} finally {
			// Restore table after export
			modifyTableForExport(table as HTMLElement, false);
		}
	};
	
	// Helper function to modify table by hiding last column and removing borders
	const modifyTableForExport = (table: HTMLElement, hide: boolean) => {
		// This function will no longer hide or show any cells
	};
	
	
	// Function to export the table data in PNG format
	const downloadTableAsPNG = async () => {
		try {
			const table = document.querySelector('table');
			if (!table) {
				console.error('Table element not found');
				return;
			}
			const originalBorderStyle = table.style.border;
			table.style.border = '1px solid black'; 
	
			// Convert table to PNG
			const dataUrl = await toPng(table, {
				cacheBust: true,
				style: {
					width: table.offsetWidth + 'px',
				},
			});
			// Restore original border style after capture
			table.style.border = originalBorderStyle;
	
			// Create link element and trigger download
			const link = document.createElement('a');
			link.href = dataUrl;
			link.download = 'table_data.png';
			link.click();
		} catch (error) {
			console.error('Error generating PNG: ', error);
		}
	};
	
	// Function to export the table data in SVG format
	const downloadTableAsSVG = async () => {
		try {
			const table = document.querySelector('table');
			if (!table) {
				console.error('Table element not found');
				return;
			}
	
			// Temporarily store the original color of each cell
			const cells = table.querySelectorAll('th, td');
			const originalColors: string[] = [];
			
			cells.forEach((cell: any, index: number) => {
				originalColors[index] = cell.style.color;  // Save original color
				cell.style.color = 'black';  // Set text color to black
			});
	
			// Convert table to SVG
			const dataUrl = await toSvg(table, {
				backgroundColor: 'white',
				cacheBust: true,
			});
	
			// Restore the original color of each cell
			cells.forEach((cell: any, index: number) => {
				cell.style.color = originalColors[index];  // Restore original color
			});
	
			// Create link element and trigger download
			const link = document.createElement('a');
			link.href = dataUrl;
			link.download = 'table_data.svg';
			link.click();
		} catch (error) {
			console.error('Error generating SVG: ', error);
		}
	};
	
	
	// Function to export the table data in CSV format
	const downloadTableAsCSV = (table: HTMLElement) => {
		let csvContent = 'Category\n';
		const rows = table.querySelectorAll('tr');
		rows.forEach((row: any) => {
			const cols = row.querySelectorAll('td, th');
			const rowData = Array.from(cols)
				.slice(0, -1) 
				.map((col: any) => `"${col.innerText}"`)
				.join(',');
			csvContent += rowData + '\n';
		});
	
		// Create a blob and initiate download
		const blob = new Blob([csvContent], { type: 'text/csv' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = 'table_data.csv';
		link.click();
	};
	
	// Function to export the table data in PDF format
	const downloadTableAsPDF = (table: HTMLElement) => {
		try {
			const pdf = new jsPDF('p', 'pt', 'a4');
			const pageWidth = pdf.internal.pageSize.getWidth(); 
			const title = 'LOT Management';
			const titleFontSize = 18;
	
			// Add heading to PDF (centered)
			pdf.setFontSize(titleFontSize);
			const textWidth = pdf.getTextWidth(title);
			const xPosition = (pageWidth - textWidth) / 2; 
			pdf.text(title, xPosition, 40); 
	
			const rows: any[] = [];
			const headers: any[] = [];
	
			// Extract table headers (exclude last cell)
			const thead = table.querySelector('thead');
			if (thead) {
				const headerCells = thead.querySelectorAll('th');
				headers.push(
					Array.from(headerCells)
						.slice(0, -1) 
						.map((cell: any) => cell.innerText)
				);
			}
	
			// Extract table rows (exclude last cell)
			const tbody = table.querySelector('tbody');
			if (tbody) {
				const bodyRows = tbody.querySelectorAll('tr');
				bodyRows.forEach((row: any) => {
					const cols = row.querySelectorAll('td');
					const rowData = Array.from(cols)
						.slice(0, -1) 
						.map((col: any) => col.innerText);
					rows.push(rowData);
				});
			}
	
			// Generate PDF using autoTable
			autoTable(pdf, {
				head: headers,
				body: rows,
				margin: { top: 50 },
				styles: {
					overflow: 'linebreak',
					cellWidth: 'wrap',
				},
				theme: 'grid',
			});
	
			pdf.save('table_data.pdf');
		} catch (error) {
			console.error('Error generating PDF: ', error);
			alert('Error generating PDF. Please try again.');
		}
	};

	return (
		<PageWrapper>
			<SubHeader>
				<SubHeaderLeft>
					{/* Search input */}
					<label
						className='border-0 bg-transparent cursor-pointer me-0'
						htmlFor='searchInput'>
						<Icon icon='Search' size='2x' color='primary' />
					</label>
					<Input
						id='searchInput'
						type='search'
						className='border-0 shadow-none bg-transparent'
						placeholder='Search...'
						onChange={(event: any) => {
							setSearchTerm(event.target.value);
						}}
						value={searchTerm}
						ref={inputRef}
					/>
				</SubHeaderLeft>
				<SubHeaderRight>
					<Dropdown>
						<DropdownToggle hasIcon={false}>
							<Button
								icon='FilterAlt'
								color='dark'
								isLight
								className='btn-only-icon position-relative'></Button>
						</DropdownToggle>
						<DropdownMenu isAlignmentEnd size='lg'>
							<div className='container py-2'>
								<div className='row g-3'>
									<FormGroup label='Status type' className='col-12'>
									<ChecksGroup>
											{Status.map((bill, index) => (
												<Checks
													key={bill.Status}
													id={bill.Status}
													label={bill.Status}
													name={bill.Status}
													value={bill.Status}
													checked={selectedUsers.includes(bill.Status)}
													onChange={(event: any) => {
														const { checked, value } = event.target;
														setSelectedUsers(
															(prevUsers) =>
																checked
																	? [...prevUsers, value] // Add category if checked
																	: prevUsers.filter(
																			(bill) =>
																				bill !== value,
																	  ), // Remove category if unchecked
														);
													}}
												/>
											))}
										</ChecksGroup>
									</FormGroup>
									<FormGroup label='Date' className='col-6'>
										<Input type='date' onChange={(e: any) => setStartDate(e.target.value)} value={startDate} />
									</FormGroup>
								</div>
							</div>
						</DropdownMenu>
					</Dropdown>

					{/* Button to open  New Item modal */}
				</SubHeaderRight>
			</SubHeader>
			<Page>
				<div className='row h-100'>
					<div className='col-12'>
						{/* Table for displaying customer data */}
						<Card stretch>
							<CardTitle className='d-flex justify-content-between align-items-center m-4'>
								<div className='flex-grow-1 text-center text-primary'>
									Repaired Phones
								</div>
								<Dropdown>
								<DropdownToggle hasIcon={false}>
									<Button
										icon='UploadFile'
										color='warning'>
										Export
									</Button>
								</DropdownToggle>
								<DropdownMenu isAlignmentEnd>
									<DropdownItem onClick={() => handleExport('svg')}>Download SVG</DropdownItem>
									<DropdownItem onClick={() => handleExport('png')}>Download PNG</DropdownItem>
									<DropdownItem onClick={() => handleExport('csv')}>Download CSV</DropdownItem>
									<DropdownItem onClick={() => handleExport('pdf')}>Download PDF</DropdownItem>
								</DropdownMenu>
							</Dropdown>
							</CardTitle>
							<CardBody isScrollable className='table-responsive'>
								<table className='table  table-bordered border-primary table-hover '>
								<thead className={"table-dark border-primary"}>
										<tr>
											<th>Date</th>
											<th>Technician</th>
											<th>Phone Model</th>
											<th>Repair Type</th>
											<th>Status</th>
										</tr>
									</thead>
									<tbody>
										{billsLoading && (
											<tr>
												<td>Loading...</td>
											</tr>
										)}
										{billsError && (
											<tr>
												<td>Error fetching repaired phones.</td>
											</tr>
										)}
										{filteredTransactions &&
											filteredTransactions
												.filter((bill: any) =>
													searchTerm
														? bill.repairType
																.toLowerCase()
																.includes(searchTerm.toLowerCase())
														: true,
												)
												.filter((bill: any) =>
													selectedUsers.length > 0
														? selectedUsers.includes(bill.Status)
														: true,
												)
												.map((bill: any) => (
													<tr key={bill.cid}>
														<td>{bill.dateIn}</td>
														<td>{getTechnicianName(bill.technicianNum)}</td>
														<td>{bill.phoneModel}</td>
														<td>{bill.repairType}</td>
														<td>{bill.Status}</td>
														
													</tr>
												))}
									</tbody>
								</table>
							</CardBody>
						</Card>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default Index;
