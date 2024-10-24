import React, { useContext, useEffect, useRef, useState } from 'react';
import type { NextPage } from 'next';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import useDarkMode from '../../../../hooks/useDarkMode';
import Page from '../../../../layout/Page/Page';
import { firestore } from '../../../../firebaseConfig';
import SubHeader, {
	SubHeaderLeft,
	SubHeaderRight,
	SubheaderSeparator,
} from '../../../../layout/SubHeader/SubHeader';
import Icon from '../../../../components/icon/Icon';
import Input from '../../../../components/bootstrap/forms/Input';
import Dropdown, { DropdownMenu, DropdownToggle } from '../../../../components/bootstrap/Dropdown';
import Button from '../../../../components/bootstrap/Button';
import Card, { CardBody, CardTitle } from '../../../../components/bootstrap/Card';
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import ModelAddModal from '../../../../components/custom/ModelAddModal';
import ModelDeleteModal from '../../../../components/custom/ModelDeleteModal';
import ModelEditModal from '../../../../components/custom/ModelEditModel';
import Swal from 'sweetalert2';
import { useGetModelsQuery ,useUpdateModelMutation} from '../../../../redux/slices/modelApiSlice';
import { toPng, toSvg } from 'html-to-image';
import { DropdownItem }from '../../../../components/bootstrap/Dropdown';
import bill from '../../../../assets/img/bill/WhatsApp_Image_2024-09-12_at_12.26.10_50606195-removebg-preview (1).png';
import jsPDF from 'jspdf'; 
import autoTable from 'jspdf-autotable';

// Define the interface for category data

interface Model {
	cid: string;
	modelname: string;
	description: string;
	brand: string;
	status: boolean;
}

// Define the functional component for the index page
const Index: NextPage = () => {
	const { darkModeStatus } = useDarkMode(); // Dark mode
	const [searchTerm, setSearchTerm] = useState(''); // State for search term
	const [addModalStatus, setAddModalStatus] = useState<boolean>(false); // State for add modal status
	const [deleteModalStatus, setDeleteModalStatus] = useState<boolean>(false);
	const [editModalStatus, setEditModalStatus] = useState<boolean>(false); // State for edit modal status
	const [id, setId] = useState<string>(''); // State for current category ID
	const [status, setStatus] = useState(true); // State for managing data fetching status
	const { data: models, error, isLoading, refetch } = useGetModelsQuery(undefined);
	const [updateModel] = useUpdateModelMutation();
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
	
	// Function to handle deletion of a category
	const handleClickDelete = async (model: any) => {
		try {
			const result = await Swal.fire({
				title: 'Are you sure?',
				text: 'You will not be able to recover this model!',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes, delete it!',
			});
			if (result.isConfirmed) {
				try {
					// Set the user's status to false (soft delete)
					await updateModel({
						id:model.id,
						name:model.name,
						category:model.category,
						brand:model.brand,
						description:model.description,
						status:false,
				});

					// Refresh the list after deletion
					Swal.fire('Deleted!', 'Model has been deleted.', 'success');
					refetch(); // This will refresh the list of users to reflect the changes
				} catch (error) {
					console.error('Error during handleDelete: ', error);
					Swal.fire(
						'Error',
						'An error occurred during deletion. Please try again later.',
						'error',
					);
				}
			}
		} catch (error) {
			console.error('Error deleting document: ', error);
			Swal.fire('Error', 'Failed to delete model.', 'error');
		}
	};
	// Function to handle the download in different formats
	const handleExport = async (format: string) => {
		const table = document.querySelector('table');
		if (!table) return;

		 // Remove borders and hide last cells before exporting
		 modifyTableForExport(table as HTMLElement, true);

		const clonedTable = table.cloneNode(true) as HTMLElement;

		// Remove Edit/Delete buttons column from cloned table
		const rows = clonedTable.querySelectorAll('tr');
		rows.forEach((row) => {
			const lastCell = row.querySelector('td:last-child, th:last-child');
			if (lastCell) {
				lastCell.remove();
			}
		});
	
		
		const clonedTableStyles = getComputedStyle(table);
		clonedTable.setAttribute('style', clonedTableStyles.cssText);
	
		
		try {
			switch (format) {
				case 'svg':
					await downloadTableAsSVG();
					break;
				case 'png':
					await downloadTableAsPNG();
					break;
				case 'csv':
					downloadTableAsCSV(clonedTable);
					break;
				case 'pdf': 
					await downloadTableAsPDF(clonedTable);
					break;
				default:
					console.warn('Unsupported export format: ', format);
			}
		} catch (error) {
			console.error('Error exporting table: ', error);
		}finally {
			// Restore table after export
			modifyTableForExport(table as HTMLElement, false);
		}
	};
	// Helper function to modify table by hiding last column and removing borders
const modifyTableForExport = (table: HTMLElement, hide: boolean) => {
    const rows = table.querySelectorAll('tr');
    rows.forEach((row) => {
        const lastCell = row.querySelector('td:last-child, th:last-child');
        if (lastCell instanceof HTMLElement) {
            if (hide) {
                lastCell.style.display = 'none';  
            } else {
                lastCell.style.display = '';  
            }
        }
    });
};

	// function to export the table data in CSV format
	const downloadTableAsCSV = (table: any) => {
				let csvContent = '';
				const rows = table.querySelectorAll('tr');
				rows.forEach((row: any) => {
					const cols = row.querySelectorAll('td, th');
					const rowData = Array.from(cols)
						.map((col: any) => `"${col.innerText}"`)
						.join(',');
					csvContent += rowData + '\n';
				});

				const blob = new Blob([csvContent], { type: 'text/csv' });
				const link = document.createElement('a');
				link.href = URL.createObjectURL(blob);
				link.download = 'table_data.csv';
				link.click();
	};
	// PDF export function with the logo added
const downloadTableAsPDF = async (table: HTMLElement) => {
    try {
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const rows: any[] = [];
        const headers: any[] = [];

        // Draw a thin page border
        pdf.setLineWidth(1);
        pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

        // Add the logo in the top-left corner
        const logoData = await loadImage(bill); 
        const logoWidth = 100; 
        const logoHeight = 40; 
        const logoX = 20; 
        const logoY = 20; 
        pdf.addImage(logoData, 'PNG', logoX, logoY, logoWidth, logoHeight); 

        // Add small heading in the top left corner (below the logo)
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Suranga Cell-Care(pvt).Ltd.', 20, logoY + logoHeight + 10);

        // Add the table heading (title) in the top-right corner
        const title = 'Model-Display Report';
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        const titleWidth = pdf.getTextWidth(title);
        const titleX = pageWidth - titleWidth - 20;
        pdf.text(title, titleX, 30); 

        // Add the current date below the table heading
        const currentDate = new Date().toLocaleDateString();
        const dateX = pageWidth - pdf.getTextWidth(currentDate) - 20;
        pdf.setFontSize(12);
        pdf.text(currentDate, dateX, 50); 

        // Extract table headers
        const thead = table.querySelector('thead');
        if (thead) {
            const headerCells = thead.querySelectorAll('th');
            headers.push(Array.from(headerCells).map((cell: any) => cell.innerText));
        }

        // Extract table rows
        const tbody = table.querySelector('tbody');
        if (tbody) {
            const bodyRows = tbody.querySelectorAll('tr');
            bodyRows.forEach((row: any) => {
                const cols = row.querySelectorAll('td');
                const rowData = Array.from(cols).map((col: any) => col.innerText);
                rows.push(rowData);
            });
        }

        // Generate the table below the date
        autoTable(pdf, {
            head: headers,
            body: rows,
            margin: { top: 100 }, 
            styles: {
                overflow: 'linebreak',
                cellWidth: 'wrap',
            },
            headStyles: {
                fillColor: [80, 101, 166], 
                textColor: [255, 255, 255], 
            },
            theme: 'grid',
        });

        pdf.save('Model-Display Report.pdf');
    } catch (error) {
        console.error('Error generating PDF: ', error);
        alert('Error generating PDF. Please try again.');
    }
};

// Helper function to load the image (logo) for the PDF
const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png'); // Base64 URL
                resolve(dataUrl);
            } else {
                reject('Failed to load the logo image.');
            }
        };
        img.onerror = () => {
            reject('Error loading logo image.');
        };
    });
};

	  // Helper function to hide the last cell of every row (including borders)
const hideLastCells = (table: HTMLElement) => {
	const rows = table.querySelectorAll('tr');
	rows.forEach((row) => {
		const lastCell = row.querySelector('td:last-child, th:last-child');
		if (lastCell instanceof HTMLElement) {
			lastCell.style.visibility = 'hidden';  
			lastCell.style.border = 'none'; 
			lastCell.style.padding = '0';  
			lastCell.style.margin = '0';  
		}
	});
};

// Helper function to restore the visibility and styles of the last cell
const restoreLastCells = (table: HTMLElement) => {
	const rows = table.querySelectorAll('tr');
	rows.forEach((row) => {
		const lastCell = row.querySelector('td:last-child, th:last-child');
		if (lastCell instanceof HTMLElement) {
			lastCell.style.visibility = 'visible'; 
			lastCell.style.border = '';  
			lastCell.style.padding = '';  
			lastCell.style.margin = '';  
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

// Function to export the table data in SVG format using html-to-image without cloning the table
const downloadTableAsSVG = async () => {
	try {
		const table = document.querySelector('table');
		if (!table) {
			console.error('Table element not found');
			return;
		}

		// Hide last cells before export
		hideLastCells(table);

		const dataUrl = await toSvg(table, {
			backgroundColor: 'white',
			cacheBust: true,
			style: {
				width: table.offsetWidth + 'px',
				color: 'black',
			},
		});

		// Restore the last cells after export
		restoreLastCells(table);

		const link = document.createElement('a');
		link.href = dataUrl;
		link.download = 'table_data.svg';
		link.click();
	} catch (error) {
		console.error('Error generating SVG: ', error);
		// Restore the last cells in case of error
		const table = document.querySelector('table');
		if (table) restoreLastCells(table);
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
					
					{/* Button to open New category */}
					<Button
						icon='AddCircleOutline'
						color='success'
						isLight
						onClick={() => setAddModalStatus(true)}>
						New Model
					</Button>
				</SubHeaderRight>
			</SubHeader>
			<Page>
				<div className='row h-100'>
					<div className='col-12'>
						{/* Table for displaying customer data */}
						<Card stretch>
							<CardTitle className='d-flex justify-content-between align-items-center m-4'>
								<div className='flex-grow-1 text-center text-primary'>Manage Display Model</div>
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
								{/* <table className='table table-modern table-hover'> */}
								<table className='table  table-bordered border-primary table-hover text-center'>
								<thead className={"table-dark border-primary"}>
										<tr>
											<th>Model name</th>
											<th>Category Name</th>
											<th>Brand Name</th>
											<th>Description</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{isLoading &&(
											<tr>
												<td>Loadning...</td>
											</tr>
										)}
										{
											error && (
												<tr>
													<td>Error fetching brands.</td>
												</tr>
											)
										}
										{
											models &&
											models
												.filter((model : any) =>
													model.status === true 
												)
												.filter((model : any) => 
													searchTerm 
													? model.name.toLowerCase().includes(searchTerm.toLowerCase())
													: true,
												)
												.map((model:any) => (
													<tr key={model.id}>
														<td>{model.name}</td>
														<td>{model.category}</td>
														<td>{model.brand}</td>
														<td>{model.description}</td>
														<td>
															<Button
																icon='Edit'
																color='primary'
																onClick={() => {
																	setEditModalStatus(true);
																	setId(model.id);
																}}>
																Edit
															</Button>
															<Button
																icon='Delete'
																className='m-2'
																color='danger'
																onClick={() => handleClickDelete(model)}>
																Delete
															</Button>
														</td>
													</tr>
												))
										}
									</tbody>
								</table>
								<Button icon='Delete' className='mb-5'
								onClick={() => {
									refetch();
									setDeleteModalStatus(true)
									
								}}>
								Recycle Bin</Button> 
								
							</CardBody>
						</Card>
						
			
					</div>
				</div>
			</Page>
			<ModelAddModal setIsOpen={setAddModalStatus} isOpen={addModalStatus} id='' />
			<ModelDeleteModal setIsOpen={setDeleteModalStatus} isOpen={deleteModalStatus} id='' refetchMainPage={refetch} />
			<ModelEditModal setIsOpen={setEditModalStatus} isOpen={editModalStatus} id={id} refetch={refetch} />
		</PageWrapper>
	);
};
export default Index;
