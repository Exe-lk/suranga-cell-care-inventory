import React, { useEffect, useRef, useState } from 'react';
import type { NextPage } from 'next';
import useDarkMode from '../../../../hooks/useDarkMode';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft } from '../../../../layout/SubHeader/SubHeader';
import Icon from '../../../../components/icon/Icon';
import Input from '../../../../components/bootstrap/forms/Input';
import Page from '../../../../layout/Page/Page';
import Card, { CardBody, CardTitle } from '../../../../components/bootstrap/Card';
import { useGetStockInOutsQuery } from '../../../../redux/slices/stockInOutAcceApiSlice';
import { toPng, toSvg } from 'html-to-image';
import Dropdown from '../../../../components/bootstrap/Dropdown';
import { DropdownToggle } from '../../../../components/bootstrap/Dropdown';
import { DropdownMenu } from '../../../../components/bootstrap/Dropdown';
import { DropdownItem }from '../../../../components/bootstrap/Dropdown';
import jsPDF from 'jspdf'; 
import autoTable from 'jspdf-autotable';
import Button from '../../../../components/bootstrap/Button';
import bill from '../../../../assets/img/bill/WhatsApp_Image_2024-09-12_at_12.26.10_50606195-removebg-preview (1).png';


const Index: NextPage = () => {
	// Dark mode
	const { darkModeStatus } = useDarkMode();
	const [searchTerm, setSearchTerm] = useState('');
	const { data: stockInOuts, error, isLoading } = useGetStockInOutsQuery(undefined);
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
	// Filter stockInOuts where stock is 'stockOut'
	const filteredStockInOuts = stockInOuts?.filter((item: any) => item.stock === 'stockOut');

	// Function to handle the download in different formats
	const handleExport = async (format: string) => {
		const table = document.querySelector('table');
		if (!table) return;

		

		const clonedTable = table.cloneNode(true) as HTMLElement;

		
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
		}
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
	// PDF export function with table adjustments
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
        const title = 'Rapaired-phones Report';
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

        // Adjust the table width and center it on the page
        const tableWidth = pageWidth * 0.9; 
        const tableX = (pageWidth - tableWidth) / 2; 

        // Generate the table below the date
        autoTable(pdf, {
            head: headers,
            body: rows,
            startY: 100, 
            margin: { left: 20, right: 20 }, 
            styles: {
                fontSize: 10, 
                overflow: 'linebreak',
                cellPadding: 4, 
            },
            headStyles: {
                fillColor: [80, 101, 166], 
                textColor: [255, 255, 255],
                fontSize: 12, 
            },
            columnStyles: {
                0: { cellWidth: 'auto' }, 
                1: { cellWidth: 'auto' }, 
                2: { cellWidth: 'auto' }, 
                3: { cellWidth: 'auto' }, 
            },
            tableWidth: 'wrap',
            theme: 'grid',
        });

        pdf.save('Rapaired-phones Report.pdf');
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
                const dataUrl = canvas.toDataURL('image/png'); 
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
					{/* Search input  */}
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
						onChange={(event: any) => setSearchTerm(event.target.value)}
						value={searchTerm}
						ref={inputRef}
					/>
				</SubHeaderLeft>
			</SubHeader>

			<Page>
				<div className='row h-100'>
					<div className='col-12'>
						{/* Table for displaying user data */}
						<Card stretch>
							<CardTitle className='d-flex justify-content-between align-items-center m-4'>
								<div className='flex-grow-1 text-center text-primary'>Accessory</div>
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
							<table className='table table-bordered border-primary  table-hover'>
							<thead className={"table-dark border-primary"}>
										<tr>
											<th>Customer Name</th>
											<th>Mobile Number</th>
											<th>NIC</th>
											<th>Email</th>
										</tr>
									</thead>
									<tbody>
									{filteredStockInOuts &&
											filteredStockInOuts
											.filter((StockItem: any) =>
												searchTerm
													? StockItem.nic
															.toLowerCase()
															.includes(searchTerm.toLowerCase())
													: true,
											)
										.map((stock: any) => (
											<tr key={stock.id}>
												<td>{stock.customerName}</td>
												<td>{stock.mobile}</td>
												<td>{stock.nic}</td>
												<td>{stock.email}</td>
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
