import React, { FC, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../bootstrap/Modal';
import { useAddStockOutMutation } from '../../redux/slices/stockInOutDissApiSlice';
import { useGetStockInOutsQuery } from '../../redux/slices/stockInOutDissApiSlice';
import { useGetItemDisByIdQuery } from '../../redux/slices/itemManagementDisApiSlice';
import FormGroup from '../bootstrap/forms/FormGroup';
import Input from '../bootstrap/forms/Input';
import Button from '../bootstrap/Button';
import Select from '../bootstrap/forms/Select';
import Swal from 'sweetalert2';
import Checks, { ChecksGroup } from '../bootstrap/forms/Checks';
import { useGetTechniciansQuery } from '../../redux/slices/technicianManagementApiSlice';
import { useUpdateStockInOutMutation } from '../../redux/slices/stockInOutDissApiSlice';
import { useGetItemDissQuery } from '../../redux/slices/itemManagementDisApiSlice';

interface StockAddModalProps {
	id: string;
	isOpen: boolean;
	setIsOpen(...args: unknown[]): unknown;
	quantity: any;
}

const formatTimestamp = (seconds: number, nanoseconds: number): string => {
	const date = new Date(seconds * 1000);
	const formattedDate = new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hour12: true,
		timeZoneName: 'short',
	}).format(date);
	return formattedDate;
};

interface StockOut {
	cid: string;
	model: string;
	brand: string;
	category: string;
	quantity: string;
	date: string;
	description: string;
	dealerName: string;
	dealerTelNum: string;
	dealerPrecentage: string;
	technicianNum: string;
	dateIn: string;
	cost: string;
	sellingPrice: string;
	branchNum: string;
	sellerName: string;
	stock: string;
	status: boolean;
}

const StockAddModal: FC<StockAddModalProps> = ({ id, isOpen, setIsOpen ,quantity}) => {
	const [selectedOption, setSelectedOption] = useState<'Dealer' | 'Technician' | 'Return' |'Branch'| ''>(
		'',
	);
	const [stockOut, setStockOut] = useState<StockOut>({
		cid: '',
		model: '',
		brand: '',
		category: '',
		quantity: '',
		date: '',
		description: '',
		dealerName: '',
		dealerTelNum: '',
		dealerPrecentage: '',
		technicianNum: '',
		dateIn: '',
		cost: '',
		sellingPrice: '',
		branchNum: '',
		sellerName: '',
		stock: 'stockOut',
		status: true,
	});
	const [selectedCost, setSelectedCost] = useState<string | null>(null);
	const {
		data: technicians,
		isLoading: techniciansLoading,
		isError: techniciansError,
	} = useGetTechniciansQuery(undefined);
	const {
		data: stockInData,
		isLoading: stockInLoading,
		isError: stockInError,
	} = useGetStockInOutsQuery(undefined);
	const [addstockOut] = useAddStockOutMutation();
	const { data: stockOutData, isSuccess } = useGetItemDisByIdQuery(id);
	const [updateStockInOut] = useUpdateStockInOutMutation();
	const { refetch } = useGetItemDissQuery(undefined);
	const filteredStockIn = stockInData?.filter(
		(item: { stock: string }) => item.stock === 'stockIn',
	);
	const handleDateInChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedTimestamp = e.target.value;
		formik.setFieldValue('dateIn', selectedTimestamp);
		const selectedStock = filteredStockIn?.find((item: { timestamp: { seconds: number; nanoseconds: number } }) => {
			const formattedDate = formatTimestamp(item.timestamp.seconds, item.timestamp.nanoseconds);
			return formattedDate === selectedTimestamp;
		});
		setSelectedCost(selectedStock ? selectedStock.cost : null);
	};
	const stockInQuantity = quantity;

	const formik = useFormik({
		initialValues: {
			brand: stockOut.brand,
			model: stockOut.model,
			category: stockOut.category,
			quantity: '',
			date: '',
			description: '',
			dealerName: '',
			dealerTelNum: '',
			dealerPrecentage: '',
			technicianNum: '',
			dateIn: '',
			cost: '',
			sellingPrice: '',
			branchNum: '',
			sellerName: '',
			stock: 'stockOut',
			status: true,
		},
		enableReinitialize: true,
		validate: (values) => {
			const errors: any = {};
			if (!values.quantity) errors.quantity = 'Quantity is required';
			if (!values.date) errors.date = 'Date Out is required';
			if (!values.dateIn) errors.dateIn = 'Date In is required';
			if (!values.sellingPrice) errors.sellingPrice = 'Selling Price is required';
			if (selectedOption === 'Dealer') {
				if (!values.dealerName) errors.dealerName = 'Dealer Name is required';
				if (!values.dealerTelNum) errors.dealerTelNum = 'Dealer Tel Number is required';
				if (!values.dealerPrecentage)
					errors.dealerPrecentage = 'Dealer Percentage is required';
			}
			if (selectedOption === 'Technician') {
				if (!values.technicianNum) errors.technicianNum = 'Technician Number is required';
			}
			if (selectedOption === 'Return') {
				if (!values.sellerName) errors.sellerName = 'Seller Name is required';
			}
			if (selectedOption === 'Branch') {
				if (!values.branchNum) errors.branchNum = 'Branch Number is required';
			}
			return errors;
		},
		onSubmit: async (values) => {
			try {
				Swal.fire({
					title: 'Processing...',
					html: 'Please wait while the data is being processed.<br><div class="spinner-border" role="status"></div>',
					allowOutsideClick: false,
					showCancelButton: false,
					showConfirmButton: false,
				});
				await refetch();	
				const stockOutQuantity = values.quantity ? parseInt(values.quantity) : 0;
				if (isNaN(stockInQuantity) || isNaN(stockOutQuantity)) {
					Swal.fire({
						icon: 'error',
						title: 'Invalid Quantity',
						text: 'Quantity must be a valid number.',
					});
					return; 
				}	
				const updatedQuantity = stockInQuantity - stockOutQuantity;
				if (updatedQuantity < 0) {
					Swal.fire({
						icon: 'error',
						title: 'Insufficient Stock',
						text: 'The stock out quantity exceeds available stock.',
					});
					return; 
				}		
				const stockOutResponse = await addstockOut(values).unwrap();		
				await updateStockInOut({ id, quantity: updatedQuantity }).unwrap();	
				refetch();	
				await Swal.fire({ icon: 'success', title: 'Stock Out Created Successfully' });
				formik.resetForm();
				setIsOpen(false); 
			} catch (error) {
				await Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'Failed to process the stock. Please try again.',
				});
			}
		}		
	});

	const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedOption(e.target.value as 'Dealer' | 'Technician' | 'Return'| 'Branch');
	};

	const formatMobileNumber = (value: string) => {
		let sanitized = value.replace(/\D/g, ''); 
		if (!sanitized.startsWith('0')) sanitized = '0' + sanitized; 
		return sanitized.slice(0, 10); 
	};

	useEffect(() => {
		if (isSuccess && stockOutData) {
			setStockOut(stockOutData);
		}
	}, [isSuccess, stockOutData]);
	
	return (
		<Modal isOpen={isOpen} aria-hidden={!isOpen} setIsOpen={setIsOpen} size='xl' titleId={id}>
			<ModalHeader
				setIsOpen={() => {
					setIsOpen(false);
					formik.resetForm();
				}}
				className='p-4'>
				<ModalTitle id=''>{'Stock Out'}</ModalTitle>
			</ModalHeader>
			<ModalBody className='px-4'>
				<div className='row g-4'>
					<FormGroup id='model' label='Model' className='col-md-6'>
						<Input type='text' value={formik.values.model} readOnly />
					</FormGroup>
					<FormGroup id='brand' label='Brand' className='col-md-6'>
						<Input type='text' value={formik.values.brand} readOnly />
					</FormGroup>
					<FormGroup id='category' label='Category' className='col-md-6'>
						<Input type='text' value={formik.values.category} readOnly />
					</FormGroup>
					<FormGroup id='quantity' label='Quantity' className='col-md-6'>
						<Input
							type='number'
							placeholder='Enter Quantity'
							value={formik.values.quantity}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							name='quantity'
							isValid={!!formik.errors.quantity && formik.touched.quantity}
						/>
					</FormGroup>
					<FormGroup id="dateIn" label="Date In" className="col-md-6">
						<Select
							id="dateIn"
							name="dateIn"
							ariaLabel="dateIn"
							onChange={handleDateInChange}
							value={formik.values.dateIn}
							onBlur={formik.handleBlur}
							className={`form-control ${formik.touched.dateIn && formik.errors.dateIn ? 'is-invalid' : ''}`}
						>
							<option value="">Select a Time Stamp</option>
							{stockInLoading && <option>Loading time stamps...</option>}
							{stockInError && <option>Error fetching timestamps</option>}
							{filteredStockIn?.map((item: { id: string; timestamp: { seconds: number; nanoseconds: number } }) => (
								<option
									key={item.id}
									value={formatTimestamp(item.timestamp.seconds, item.timestamp.nanoseconds)}
								>
									{formatTimestamp(item.timestamp.seconds, item.timestamp.nanoseconds)}
								</option>
							))}
							{formik.touched.dateIn && formik.errors.dateIn && (
								<div className="invalid-feedback">{formik.errors.dateIn}</div>
							)}
						</Select>
					</FormGroup>
					<FormGroup id='date' label='Date Out' className='col-md-6'>
						<Input
							type='date'
							placeholder='Enter Date'
							value={formik.values.date}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							name='date'
							isValid={!!formik.errors.date && formik.touched.date}
						/>
					</FormGroup>
					{selectedCost && (
						<FormGroup id="cost" label="Cost(lkr)" className="col-md-6">
							<Input type="text" value={selectedCost} readOnly />
						</FormGroup>
					)}
					<FormGroup id='description' label='Description' className='col-md-6'>
						<Input
							type='text'
							placeholder='Enter Description'
							value={formik.values.description}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							name='description'
							isValid={!!formik.errors.description && formik.touched.description}
						/>
					</FormGroup>
					<FormGroup id='sellingPrice' label='Selling Price(lkr)' className='col-md-6'>
						<Input
							type='text'
							placeholder='Enter Selling Price'
							value={formik.values.sellingPrice}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							name='sellingPrice'
							isValid={!!formik.errors.sellingPrice && formik.touched.sellingPrice}
						/>
					</FormGroup>
					<FormGroup id='StockOutSelect' className='col-md-12'>
						<ChecksGroup isInline>
							<Checks
								type='radio'
								id='dealer'
								label='Dealer'
								name='stockOutType'
								value='Dealer'
								onChange={handleOptionChange}
								checked={selectedOption === 'Dealer'}
							/>
							<Checks
								type='radio'
								id='technician'
								label='Technician'
								name='stockOutType'
								value='Technician'
								onChange={handleOptionChange}
								checked={selectedOption === 'Technician'}
							/>
							<Checks
								type='radio'
								id='return'
								label='Return'
								name='stockOutType'
								value='Return'
								onChange={handleOptionChange}
								checked={selectedOption === 'Return'}
							/>
							<Checks
								type='radio'
								id='branch'
								label='Branch'
								name='stockOutType'
								value='Branch'
								onChange={handleOptionChange}
								checked={selectedOption === 'Branch'}
							/>
						</ChecksGroup>
					</FormGroup>
					{selectedOption === 'Dealer' && (
						<>
							<FormGroup id='dealerName' label='Dealer Name' className='col-md-6'>
								<Input
									type='text'
									placeholder='Enter Dealer Name'
									value={formik.values.dealerName}
									onChange={formik.handleChange}
									name='dealerName'
									isValid={
										!!formik.errors.dealerName && formik.touched.dealerName
									}
								/>
							</FormGroup>
							<FormGroup
								id='dealerTelNum'
								label='Dealer Telephone Number'
								className='col-md-6'>
								<Input
							type='text'
							value={formik.values.dealerTelNum}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								const input = e.target.value.replace(/\D/g, ''); 
								formik.setFieldValue('dealerTelNum', formatMobileNumber(input));
							}}
							onBlur={formik.handleBlur}
							isValid={formik.isValid}
							isTouched={formik.touched.dealerTelNum}
							invalidFeedback={formik.errors.dealerTelNum}
							validFeedback='Looks good!'
						/>
							</FormGroup>
							<FormGroup
								id='dealerPrecentage'
								label='Dealer Percentage'
								className='col-md-6'>
								<Input
									type='number'
									placeholder='Enter Dealer Percentage'
									value={formik.values.dealerPrecentage}
									onChange={formik.handleChange}
									name='dealerPrecentage'
									isValid={
										!!formik.errors.dealerPrecentage &&
										formik.touched.dealerPrecentage
									}
								/>
							</FormGroup>
						</>
					)}
					{selectedOption === 'Technician' && (
						<FormGroup
							id='technicianNum'
							label='Technician Number'
							className='col-md-6'>
							<Select
								id='technicianNum'
								name='technicianNum'
								ariaLabel='technicianNum'
								onChange={formik.handleChange} 
								value={formik.values.technicianNum} 
								onBlur={formik.handleBlur}
								className={`form-control ${
									formik.touched.technicianNum && formik.errors.technicianNum
										? 'is-invalid'
										: ''
								}`}>
								<option value=''>Select a technician number</option>
								{techniciansLoading && <option>Loading technicians...</option>}
								{techniciansError && <option>Error fetching technicians</option>}
								{technicians?.map(
									(technicianNum: { id: string; technicianNum: string }) => (
										<option
											key={technicianNum.id}
											value={technicianNum.technicianNum}>
											{' '}
											{technicianNum.technicianNum}
										</option>
									),
								)}
							</Select>
							{formik.touched.category && formik.errors.category ? (
								<div className='invalid-feedback'>{formik.errors.category}</div>
							) : (
								<></>
							)}
						</FormGroup>
					)}
					{selectedOption === 'Return' && (
						<FormGroup id='sellerName' label='Supplier Name' className='col-md-6'>
							<Input
								type='text'
								placeholder='Enter supplier Name'
								value={formik.values.sellerName}
								onChange={formik.handleChange}
								name='sellerName'
								isValid={!!formik.errors.sellerName && formik.touched.sellerName}
							/>
						</FormGroup>
					)}
					{selectedOption === 'Branch' && (
						<FormGroup id='branchNum' label='Branch Number' className='col-md-6'>
							<Input
								type='number'
								placeholder='Enter Branch Number'
								value={formik.values.branchNum}
								onChange={formik.handleChange}
								name='branchNum'
								isValid={!!formik.errors.branchNum && formik.touched.branchNum}
							/>
						</FormGroup>
					)}
				</div>
			</ModalBody>
			<ModalFooter className='px-4 pb-4'>
				<Button color='success' onClick={formik.handleSubmit}>
					Stock Out
				</Button>
			</ModalFooter>
		</Modal>
	);
};
StockAddModal.propTypes = {
	id: PropTypes.string.isRequired,
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
};

export default StockAddModal;
