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
import ItemAddModal from '../../../components/custom/ItemAddModal';
import ItemEditModal from '../../../components/custom/ItemEditModal';
import { doc, deleteDoc, collection, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { firestore } from '../../../firebaseConfig';
import StockAddModal from '../../../components/custom/stockAddModalAcces';
import StockOutModal from '../../../components/custom/StockOutModal';
import Dropdown, { DropdownToggle, DropdownMenu } from '../../../components/bootstrap/Dropdown';
import Swal from 'sweetalert2';
import ItemDeleteModal from '../../../components/custom/itemDeleteAcce';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Checks, { ChecksGroup } from '../../../components/bootstrap/forms/Checks';
import { toPng, toSvg } from 'html-to-image';
import { DropdownItem }from '../../../components/bootstrap/Dropdown';
import jsPDF from 'jspdf'; 
import autoTable from 'jspdf-autotable';
import { useUpdateItemAcceMutation} from '../../../redux/slices/itemManagementAcceApiSlice';
import { useGetItemAccesQuery} from '../../../redux/slices/itemManagementAcceApiSlice';

const Index: NextPage = () => {
	const { darkModeStatus } = useDarkMode(); // Dark mode
	const [searchTerm, setSearchTerm] = useState(''); // State for search term
	const [addModalStatus, setAddModalStatus] = useState<boolean>(false); // State for add modal status
	const [editModalStatus, setEditModalStatus] = useState<boolean>(false); 
    const [addstockModalStatus, setAddstockModalStatus] = useState<boolean>(false); // State for add modal status
	const [editstockModalStatus, setEditstockModalStatus] = useState<boolean>(false); // State for edit modal status
	const [deleteModalStatus, setDeleteModalStatus] = useState<boolean>(false);
	const [id, setId] = useState<string>('');
	const {data: itemAcces,error, isLoading,refetch} = useGetItemAccesQuery(undefined);
	const [updateItemAcce] = useUpdateItemAcceMutation();
	const inputRef = useRef<HTMLInputElement>(null);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const type = [
		{ type: 'Accessory' },
		{ type: 'Mobile' },

	];

	const [quantity, setQuantity] = useState<any>();


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
	  }, [itemAcces]);

	// Function to handle deletion of an item
	const handleClickDelete = async (itemAcce:any) => {
		try {
			const result = await Swal.fire({
				title: 'Are you sure?',

				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes, delete it!',
			});
			if (result.isConfirmed) {
				const values = await {
					id: itemAcce.id,
					type: itemAcce.type,
					mobileType: itemAcce.mobileType,
					category: itemAcce.category,
					model: itemAcce.model,
					quantity: itemAcce.quantity,
					brand: itemAcce.brand,
					reorderLevel: itemAcce.reorderLevel,
					description: itemAcce.description,
					status: false,
				};

				await updateItemAcce(values);

				Swal.fire('Deleted!', 'The Item Dis has been deleted.', 'success');
			}
		} catch (error) {
			console.error('Error deleting document: ', error);
			Swal.fire('Error', 'Failed to delete employee.', 'error');
		}
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
    const rows = table.querySelectorAll('tr');
    rows.forEach((row) => {
        const cells = row.querySelectorAll('td, th');
        const totalCells = cells.length;
        // Loop through the last 4 cells
        for (let i = totalCells - 4; i < totalCells; i++) {
            const cell = cells[i];
            if (cell instanceof HTMLElement) {
                if (hide) {
                    cell.style.display = 'none';  
                } else {
                    cell.style.display = '';  
                }
            }
        }
    });
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
	
	// Return the JSX for rendering the page
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
						ref={inputRef}
						id='searchInput'
						type='search'
						className='border-0 shadow-none bg-transparent'
						placeholder='Search...'
						onChange={(event: any) => {
							setSearchTerm(event.target.value);
						}}
						value={searchTerm}
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
									<FormGroup label='Type' className='col-12'>
									<ChecksGroup>
											{type.map((itemAcces, index) => (
												<Checks
													key={itemAcces.type}
													id={itemAcces.type}
													label={itemAcces.type}
													name={itemAcces.type}
													value={itemAcces.type}
													checked={selectedUsers.includes(itemAcces.type)}
													onChange={(event: any) => {
														const { checked, value } = event.target;
														setSelectedUsers(
															(prevUsers) =>
																checked
																	? [...prevUsers, value] // Add category if checked
																	: prevUsers.filter(
																			(itemAcces) =>
																				itemAcces !== value,
																	  ), // Remove category if unchecked
														);
													}}
												/>
											))}
										</ChecksGroup>
									</FormGroup>
								</div>
							</div>
						</DropdownMenu>
					</Dropdown>
					{/* Button to open  New Item modal */}
					<Button
						icon='AddCircleOutline'
						color='success'
						isLight
						onClick={() => setAddModalStatus(true)}>
						New Item
					</Button>
				</SubHeaderRight>
			</SubHeader>
			<Page>
				<div className='row h-100'>
					<div className='col-12'>
						{/* Table for displaying customer data */}
						<Card stretch>
							<CardTitle className='d-flex justify-content-between align-items-center m-4'>
								<div className='flex-grow-1 text-center text-primary'>
									Manage Stock
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
								<table className='table  table-bordered border-primary table-hover text-center'>
								<thead className={"table-dark border-primary"}>
										<tr>
											<th>Type</th>
											<th>Category</th>
											<th>Model</th>
											<th>Brand</th>
											<th>Quantity</th>
											<th>Reorder Level</th>
											<th>Description</th>
											<th></th>
											<th></th>
											<th></th>
											<th></th>											
										</tr>
									</thead>
									<tbody>
									{isLoading && (
											<tr>
												<td>Loading...</td>
											</tr>
										)}
										{error && (
											<tr>
												<td>Error fetching items.</td>
											</tr>
										)}
										{itemAcces &&
											itemAcces
										
											.filter((itemAcces: any) =>
												selectedUsers.length > 0
													? selectedUsers.includes(itemAcces.type)
													: true,
											)
											.filter((brand: any) =>{
												if(brand.code.includes(searchTerm)){
													return brand
												}
											}
											
											)
											.map((itemAcces: any) => (
												<tr 
													key={itemAcces.cid}
												>
													<td>{itemAcces.type}</td>
													<td>{itemAcces.category}</td>
													<td>{itemAcces.model}</td>
													<td>{itemAcces.brand}</td>
													<td>{itemAcces.quantity}</td>
													<td>{itemAcces.reorderLevel}</td>
													<td>{itemAcces.description}</td>

														

														
														<td>
															<Button
																icon='CallReceived'
																tag='a'
																color='success'
																onClick={() =>(
																	setAddstockModalStatus(true),
																	setId(itemAcces.id))
																	
																}></Button>
														</td>
														<td>
															<Button
																icon='CallMissedOutgoing'
																tag='a'
																color='warning'
																onClick={() =>(
																	refetch(),
																	setEditstockModalStatus(true),
																	setId(itemAcces.id),
																	setQuantity(itemAcces.quantity)
																)
																	
																	
																}></Button>
														</td>
														<td>
															<Button
																icon='Edit'
																tag='a'
																color='info'
																onClick={() =>(
																	setEditModalStatus(true),
																	setId(itemAcces.id))
																}></Button>
														</td>
														<td>
															<Button
																className='m-2'
																icon='Delete'
																color='danger'
																onClick={() => handleClickDelete(itemAcces)}></Button>
														</td>
														
													</tr>
												))}
									</tbody>
								</table>
								<Button icon='Delete' className='mb-5'
								onClick={() => (
									setDeleteModalStatus(true)
									
								)}>
								Recycle Bin</Button> 
							</CardBody>
						</Card>
					</div>
				</div>
			</Page>
			<ItemAddModal setIsOpen={setAddModalStatus} isOpen={addModalStatus} id= ''/>
			<ItemEditModal setIsOpen={setEditModalStatus} isOpen={editModalStatus} id={id} />
            <StockAddModal setIsOpen={setAddstockModalStatus} isOpen={addstockModalStatus} id={id} />
			<StockOutModal setIsOpen={setEditstockModalStatus} isOpen={editstockModalStatus} id={id} quantity={quantity} />
			<ItemDeleteModal setIsOpen={setDeleteModalStatus} isOpen={deleteModalStatus} id='' />

		</PageWrapper>
	);
};
export default Index;
