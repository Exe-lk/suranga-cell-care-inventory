import React, { FC, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../bootstrap/Modal';
import Swal from 'sweetalert2';
import FormGroup from '../bootstrap/forms/FormGroup';
import Input from '../bootstrap/forms/Input';
import Button from '../bootstrap/Button';
import { useAddStockInMutation } from '../../redux/slices/stockInOutAcceApiSlice';
import { useGetItemAcceByIdQuery } from '../../redux/slices/itemManagementAcceApiSlice';
import { useGetItemAccesQuery } from '../../redux/slices/itemManagementAcceApiSlice';
import { useUpdateStockInOutMutation } from '../../redux/slices/stockInOutAcceApiSlice';
import { useGetStockInOutsQuery } from '../../redux/slices/stockInOutAcceApiSlice';

interface StockAddModalProps {
	id: string;
	isOpen: boolean;
	setIsOpen(...args: unknown[]): unknown;
}

interface StockIn {
	barcode: number;
	cid: string;
	brand: string;
	model: string;
	category: string;
	type: string;
	quantity: string;
	date: string;
	imi: string;
	storage: string;
	name: string;
	nic: string;
	mobile: string;
	mobileType: string;
	cost: string;
	code: string;
	stock: string;
	status: boolean;
	sellingPrice: Number;
}

const StockAddModal: FC<StockAddModalProps> = ({ id, isOpen, setIsOpen }) => {
	const [stockIn, setStockIn] = useState<StockIn>({
		cid: '',
		brand: '',
		model: '',
		category: '',
		type: '',
		quantity: '',
		date: '',
		imi: '',
		storage: '',
		name: '',
		nic: '',
		mobile: '',
		mobileType: '',
		cost: '',
		code: '',
		stock: 'stockIn',
		status: true,
		sellingPrice: 0,
		barcode: 0,
	});

	const { data: stockInData, isSuccess } = useGetItemAcceByIdQuery(id);
	const [addstockIn, { isLoading }] = useAddStockInMutation();
	const [updateStockInOut] = useUpdateStockInOutMutation();
	const { refetch } = useGetItemAccesQuery(undefined);
	const { data: stockInOuts } = useGetStockInOutsQuery(undefined);
	console.log(stockInOuts);

	const [generatedCode, setGeneratedCode] = useState('');
	const [generatedbarcode, setGeneratedBarcode] = useState<any>();

	useEffect(() => {
		if (isSuccess && stockInData) {
			setStockIn(stockInData);
		}

		if (stockInOuts?.length) {
			// Find the code with the highest numeric value
			const lastCode = stockInOuts
				.map((item: { code: string }) => item.code) // Extract all codes
				.filter((code: string) => code) // Ensure the code is not undefined or empty
				.reduce((maxCode: string, currentCode: string) => {
					const currentNumericPart = parseInt(currentCode.replace(/\D/g, ''), 10); // Extract numeric part
					const maxNumericPart = parseInt(maxCode.replace(/\D/g, ''), 10); // Numeric part of max code so far
					return currentNumericPart > maxNumericPart ? currentCode : maxCode; // Find the code with the highest numeric part
				}, '100000'); // Default starting code

			const newCode = incrementCode(lastCode); // Increment the last code
			setGeneratedCode(newCode); // Set the new generated code in state
		} else {
			// No previous codes, so start from STK100000
			setGeneratedCode('100000');
			setGeneratedBarcode('1000100000');
		}
	}, [isSuccess, stockInData, stockInOuts]);

	// Function to increment the code
	const incrementCode = (code: string) => {
		const numericPart = parseInt(code.replace(/\D/g, ''), 10); // Extract the numeric part of the code
		const incrementedNumericPart = (numericPart + 1).toString().padStart(5, '0'); // Increment and pad with zeros to 6 digits
		const barcode = (numericPart + 1).toString().padStart(10, '0');
		const value = `${stockIn.code}${incrementedNumericPart}`;
		setGeneratedBarcode(value);
		return incrementedNumericPart; // Return the new code in the format STKxxxxxx
	};

	const formik = useFormik({
		initialValues: {
			brand: stockIn.brand || '',
			model: stockIn.model || '',
			category: stockIn.category || '',
			type: stockIn.type || '',
			quantity: '',
			date: '',
			imi: '',
			storage: '',
			name: '',
			nic: '',
			mobile: '',
			mobileType: stockIn.mobileType || '',
			cost: '',
			code: generatedCode,
			stock: 'stockIn',
			status: true,
			sellingPrice: 0,
			barcode: generatedbarcode,
		},
		enableReinitialize: true,
		validate: (values) => {
			const errors: Record<string, string> = {};
			if (!values.quantity) {
				errors.quantity = 'Quantity is required';
			}
			if (!values.sellingPrice) {
				errors.sellingPrice = 'Selling Price is required';
			}
			if (!values.cost) {
				errors.cost = 'Cost is required';
			}
			if (!values.date) {
				errors.date = 'Date In is required';
			}
			if (values.type === 'Mobile') {
				if (!values.imi) {
					errors.imi = 'IMI is required';
				}
				if (!values.storage) {
					errors.storage = 'Storage is required';
				}
				if (values.mobileType === 'Used') {
					if (!values.name) {
						errors.name = 'Name is required';
					}
					if (!values.nic) {
						errors.nic = 'NIC is required';
					}
					if (!values.mobile) {
						errors.mobile = 'Mobile Number is required';
					}
				}
			}
			if (!values.cost) {
				errors.cost = 'Cost is required';
			}

			return errors;
		},
		onSubmit: async (values) => {
			try {
				const process = Swal.fire({
					title: 'Processing...',
					html: 'Please wait while the data is being processed.<br><div class="spinner-border" role="status"></div>',
					allowOutsideClick: false,
					showCancelButton: false,
					showConfirmButton: false,
				});

				try {
					const updatedQuantity =
						parseInt(stockInData.quantity) + parseInt(values.quantity);
					const response: any = await addstockIn({
						...values,
						code: generatedCode,
						barcode: generatedbarcode,
					}).unwrap();
					console.log(generatedbarcode);

					await updateStockInOut({ id, quantity: updatedQuantity }).unwrap();

					refetch();

					await Swal.fire({
						icon: 'success',
						title: 'Stock In Created Successfully',
					});
					formik.resetForm();
					setIsOpen(false);
				} catch (error) {
					await Swal.fire({
						icon: 'error',
						title: 'Error',
						text: 'Failed to add the item. Please try again.',
					});
				}
			} catch (error) {
				console.error('Error during handleUpload: ', error);
				alert('An error occurred during the process. Please try again later.');
			}
		},
	});

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='xl' titleId={id}>
			<ModalHeader
				setIsOpen={() => {
					setIsOpen(false);
					formik.resetForm();
				}}
				className='p-4'>
				<ModalTitle id=''>{'New Stock'}</ModalTitle>
			</ModalHeader>
			<ModalBody className='px-4'>
				<div className='row g-4'>
					<FormGroup id='brand' label='Brand' className='col-md-6'>
						<Input
							type='text'
							value={formik.values.brand}
							readOnly
							isValid={formik.isValid}
							isTouched={formik.touched.brand}
						/>
					</FormGroup>

					<FormGroup id='model' label='Model' className='col-md-6'>
						<Input
							type='text'
							value={formik.values.model}
							readOnly
							isValid={formik.isValid}
							isTouched={formik.touched.model}
						/>
					</FormGroup>

					<FormGroup id='category' label='Category' className='col-md-6'>
						<Input
							type='text'
							value={formik.values.category}
							readOnly
							isValid={formik.isValid}
							isTouched={formik.touched.category}
						/>
					</FormGroup>

					<FormGroup id='type' label='Type' className='col-md-6'>
						<Input
							type='text'
							value={formik.values.type}
							readOnly
							isValid={formik.isValid}
							isTouched={formik.touched.type}
						/>
					</FormGroup>

					{/* Render IMI and Storage fields only if type is Mobile */}
					{formik.values.type === 'Mobile' && (
						<>
							<FormGroup id='imi' label='IMI' className='col-md-6'>
								<Input
									type='text'
									value={formik.values.imi}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									isValid={formik.isValid}
									isTouched={formik.touched.imi}
								/>
							</FormGroup>

							<FormGroup id='storage' label='Storage' className='col-md-6'>
								<Input
									type='text'
									value={formik.values.storage}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									isValid={formik.isValid}
									isTouched={formik.touched.storage}
								/>
							</FormGroup>
							<FormGroup id='mobileType' label='Mobile Type' className='col-md-6'>
								<Input
									type='text'
									value={formik.values.mobileType}
									readOnly
									isValid={formik.isValid}
									isTouched={formik.touched.mobileType}
								/>
							</FormGroup>
							{/* Render additional fields only if mobileType is Brand New */}
							{formik.values.mobileType === 'Used' && (
								<>
									<FormGroup id='name' label='Name' className='col-md-6'>
										<Input
											type='text'
											value={formik.values.name}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											isValid={formik.isValid}
											isTouched={formik.touched.name}
										/>
									</FormGroup>

									<FormGroup
										id='mobile'
										label='Mobile Number'
										className='col-md-6'>
										<Input
											type='text'
											value={formik.values.mobile}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											isValid={formik.isValid}
											isTouched={formik.touched.mobile}
										/>
									</FormGroup>

									<FormGroup id='nic' label='NIC' className='col-md-6'>
										<Input
											type='text'
											value={formik.values.nic}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											isValid={formik.isValid}
											isTouched={formik.touched.nic}
										/>
									</FormGroup>
								</>
							)}
						</>
					)}

					<FormGroup id='quantity' label='Quantity' className='col-md-6'>
						<Input
							type='number'
							placeholder='Enter Quantity'
							value={formik.values.quantity}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							isValid={formik.isValid}
							isTouched={formik.touched.quantity}
							invalidFeedback={formik.errors.quantity}
							validFeedback='Looks good!'
						/>
					</FormGroup>

					<FormGroup id='date' label='Date In' className='col-md-6'>
						<Input
							type='date'
							placeholder='Enter Date'
							value={formik.values.date}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							isValid={formik.isValid}
							isTouched={formik.touched.date}
							invalidFeedback={formik.errors.date}
							validFeedback='Looks good!'
						/>
					</FormGroup>

					<FormGroup id='cost' label='Cost' className='col-md-6'>
						<Input
							type='number'
							placeholder='Enter Cost'
							value={formik.values.cost}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							isValid={formik.isValid}
							isTouched={formik.touched.cost}
						/>
					</FormGroup>
					<FormGroup id='sellingPrice' label='Selling Price' className='col-md-6'>
						<Input
							type='number'
							placeholder='Enter Cost'
							value={formik.values.sellingPrice}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							isValid={formik.isValid}
							isTouched={formik.touched.sellingPrice}
							invalidFeedback={formik.errors.sellingPrice}
							validFeedback='Looks good!'
						/>
					</FormGroup>
					<FormGroup id='code' label='Generated Code' className='col-md-6'>
						<Input
							type='text'
							value={generatedCode}
							readOnly
							isValid={formik.isValid}
							isTouched={formik.touched.code}
						/>
					</FormGroup>
				</div>
			</ModalBody>
			<ModalFooter className='p-4'>
				<Button color='success' onClick={() => formik.handleSubmit()}>
					Stock In
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
