// import React, { FC, useEffect, useState } from 'react';
// import PropTypes from 'prop-types';
// import { useFormik } from 'formik';
// import Modal, {ModalBody,ModalFooter,ModalHeader,ModalTitle,} from '../bootstrap/Modal';
// import showNotification from '../extras/showNotification';
// import Icon from '../icon/Icon';
// import FormGroup from '../bootstrap/forms/FormGroup';
// import Input from '../bootstrap/forms/Input';
// import Button from '../bootstrap/Button';
// import { collection,query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
// import { firestore, storage } from '../../firebaseConfig';
// import Swal from 'sweetalert2';
// import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
// import Select from '../bootstrap/forms/Select';
// import Option from '../bootstrap/Option';
// import { useGetUserByIdQuery } from '../../redux/slices/userManagementApiSlice';
// import { useUpdateUserMutation } from '../../redux/slices/userManagementApiSlice';
// // Define the props for the UserEditModal component
// interface UserEditModalProps {
// 	id: string;
// 	isOpen: boolean;
// 	setIsOpen(...args: unknown[]): unknown;
// 	refetch(...args: unknown[]): unknown;
// }
// interface User {
//     cid: string;

//     name: string;
//     role: string;
//     mobile: string;
// 	email?: string;
// 	nic?: string;
// 	status?: boolean;

// }
// // UserEditModal component definition
// const UserEditModal: FC<UserEditModalProps> = ({ id, isOpen, setIsOpen, refetch }) => {
//     const [user, setUser] = useState<User>({
//         cid: '',
//         name: '',
//         mobile: '',
//         email: '',
//         nic: '',
//         status: true,
//         role: ''
//     });

//     // Fetch data from the database
//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 if (id) {
//                     const dataCollection = collection(firestore, 'UserManagement');
//                     const q = query(dataCollection, where('__name__', '==', id));
//                     const querySnapshot = await getDocs(q);
//                     const firebaseData: any = querySnapshot.docs.map((doc) => {
//                         const data = doc.data() as User;
//                         return {
//                             ...data,
//                             cid: doc.id,
//                         };
//                     });
//                     setUser(firebaseData[0]);
//                 } else {
//                     console.error('No ID provided');
//                 }
//             } catch (error) {
//                 console.error('Error fetching data: ', error);
//             }
//         };
//         fetchData();
//     }, [id]);

//     const formik = useFormik({
//         initialValues: {
//             name: user.name,
//             role: user.role,
//             mobile: user.mobile,
//             email: user.email,
//             nic: user.nic,
//         },
//         enableReinitialize: true,  // Reinitialize formik when the user data is updated
//         validate: (values) => {
//             const errors: Partial<User> = {};
//             if (!values.name) {
//                 errors.name = 'Required';
//             }
//             if (!values.mobile) {
//                 errors.mobile = 'Required';
//             }
//             if (!values.email) {
//                 errors.email = 'Required';
//             }
//             if (!values.nic) {
//                 errors.nic = 'Required';
//             }
//             return errors;
//         },
//         onSubmit: async (values) => {
//             try {
//                 const updatedData = {
//                     ...user,    // Keep existing user data
//                     ...values,  // Update with form values
//                 };
//                 const docRef = doc(firestore, 'UserManagement', id);
//                 await updateDoc(docRef, updatedData);
//                 setIsOpen(false);
//                 showNotification(
//                     <span className='d-flex align-items-center'>
//                         <Icon icon='Info' size='lg' className='me-1' />
//                         <span>Successfully Updated</span>
//                     </span>,
//                     'User has been updated successfully',
//                 );
//                 Swal.fire('Updated!', 'User has been updated successfully.', 'success');

//                 refetch(); // Trigger refetch of users list after update
//             } catch (error) {
//                 console.error('Error updating document: ', error);
//                 alert('An error occurred while updating the document. Please try again later.');
//             }
//         },
//     });

//     return (
//         <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='xl' titleId={id}>
//             <ModalHeader setIsOpen={setIsOpen} className='p-4'>
//                 <ModalTitle id="">{'Edit User'}</ModalTitle>
//             </ModalHeader>
//             <ModalBody className='px-4'>
//                 <div className='row g-4'>
//                     <FormGroup id='name' label='Name' className='col-md-6'>
//                         <Input
//                             name="name"
//                             value={formik.values.name}
//                             onChange={formik.handleChange}
//                             onBlur={formik.handleBlur}
//                             isValid={formik.isValid}
//                             isTouched={formik.touched.name}
//                             invalidFeedback={formik.errors.name}
//                             validFeedback='Looks good!'
//                         />
//                     </FormGroup>
//                     <FormGroup id='role' label='Role' className='col-md-6'>
//                         <Select
// 							name="role"
// 							value={formik.values.role}
// 							onChange={formik.handleChange}
// 							onBlur={formik.handleBlur}
// 							isValid={formik.isValid}
// 							isTouched={formik.touched.role}
// 							invalidFeedback={formik.errors.role} ariaLabel={''}                        >
//                             <Option>Select the role</Option>
//                             <Option value={'bill keeper'}>bill keeper</Option>
//                             <Option value={'accessosry stock keeper'}>accessory stock keeper</Option>
//                             <Option value={'display stock keeper'}>display stock keeper</Option>
//                             <Option value={'cashier'}>cashier</Option>
//                         </Select>
//                     </FormGroup>
//                     <FormGroup id='mobile' label='Mobile number' className='col-md-6'>
//                         <Input
//                             name="mobile"
//                             value={formik.values.mobile}
//                             onChange={formik.handleChange}
//                             onBlur={formik.handleBlur}
//                             isValid={formik.isValid}
//                             isTouched={formik.touched.mobile}
//                             invalidFeedback={formik.errors.mobile}
//                             validFeedback='Looks good!'
//                         />
//                     </FormGroup>
//                     <FormGroup id='email' label='Email' className='col-md-6'>
//                         <Input
//                             name="email"
//                             value={formik.values.email}
//                             onChange={formik.handleChange}
//                             onBlur={formik.handleBlur}
//                             isValid={formik.isValid}
//                             isTouched={formik.touched.email}
//                             invalidFeedback={formik.errors.email}
//                             validFeedback='Looks good!'
//                         />
//                     </FormGroup>
//                     <FormGroup id='nic' label='NIC' className='col-md-6'>
//                         <Input
//                             name="nic"
//                             value={formik.values.nic}
//                             onChange={formik.handleChange}
//                             onBlur={formik.handleBlur}
//                             isValid={formik.isValid}
//                             isTouched={formik.touched.nic}
//                             invalidFeedback={formik.errors.nic}
//                             validFeedback='Looks good!'
//                         />
//                     </FormGroup>
//                 </div>
//             </ModalBody>
//             <ModalFooter className='px-4 pb-4'>
//                 <Button color='info' onClick={formik.handleSubmit}>
//                     Save
//                 </Button>
//             </ModalFooter>
//         </Modal>
//     );
// }

// // Prop types definition for CustomerEditModal component
// UserEditModal.propTypes = {
// 	id: PropTypes.string.isRequired,
// 	isOpen: PropTypes.bool.isRequired,
// 	setIsOpen: PropTypes.func.isRequired,
// };
// export default UserEditModal;

import React, { FC, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../bootstrap/Modal';
import showNotification from '../extras/showNotification';
import Icon from '../icon/Icon';
import FormGroup from '../bootstrap/forms/FormGroup';
import Input from '../bootstrap/forms/Input';
import Button from '../bootstrap/Button';
import Swal from 'sweetalert2';
import Select from '../bootstrap/forms/Select';
import Option from '../bootstrap/Option';
import {
	useGetUserByIdQuery,
	useUpdateUserMutation,
} from '../../redux/slices/userManagementApiSlice';

interface UserEditModalProps {
	id: string;
	isOpen: boolean;
	setIsOpen(...args: unknown[]): unknown;
	refetch(...args: unknown[]): unknown;
}

interface User {
	cid: string;
	name: string;
	role: string;
	mobile: string;
	email?: string;
	nic?: string;
	status?: boolean;
}

const UserEditModal: FC<UserEditModalProps> = ({ id, isOpen, setIsOpen, refetch }) => {
	const [user, setUser] = useState<User>({
		cid: '',
		name: '',
		mobile: '',
		email: '',
		nic: '',
		status: true,
		role: '',
	});

	// Fetch user data from Redux store
	const { data: userData, isSuccess } = useGetUserByIdQuery(id);
	const [updateUser] = useUpdateUserMutation();

	useEffect(() => {
		if (isSuccess && userData) {
			setUser(userData);
		}
	}, [isSuccess, userData]);

	const formik = useFormik({
		initialValues: {
			name: user.name,
			role: user.role,
			mobile: user.mobile,
			email: user.email,
			nic: user.nic,
		},
		enableReinitialize: true,
		validate: (values) => {
			const errors: Partial<User> = {};
			if (!values.role) {
				errors.role = 'Required';
			}
			if (!values.name) {
				errors.name = 'Required';
			}
			if (!values.mobile) {
				errors.mobile = 'Required';
			}
			if (!values.nic) {
				errors.nic = 'Required';
			} else if (!/^\d{9}[Vv]$/.test(values.nic) && !/^\d{12}$/.test(values.nic)) {
				errors.nic = 'NIC must be 9 digits followed by "V" or 12 digits';
			}
			if (!values.email) {
				errors.email = 'Required';
			} else if (!values.email.includes('@')) {
				errors.email = 'Invalid email format.';
			}
			return errors;
		},
		onSubmit: async (values) => {
			try {
				const updatedData = {
					...user,
					...values,
				};
				await updateUser({ id, ...updatedData }).unwrap();
				refetch(); // Trigger refetch of stock keeper list after update
				showNotification(
					<span className='d-flex align-items-center'>
						<Icon icon='Info' size='lg' className='me-1' />
						<span>Successfully Updated</span>
					</span>,
					'User has been updated successfully',
				);
				Swal.fire('Updated!', 'User has been updated successfully.', 'success');
				formik.resetForm();
				setIsOpen(false);
			} catch (error) {
				console.error('Error updating document: ', error);
				alert('An error occurred while updating the document. Please try again later.');
			}
		},
	});

	const formatMobileNumber = (value: string) => {
		let sanitized = value.replace(/\D/g, ''); // Remove non-digit characters
		if (!sanitized.startsWith('0')) sanitized = '0' + sanitized; // Ensure it starts with '0'
		return sanitized.slice(0, 10); // Limit to 10 digits (with leading 0)
	};
	

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='xl' titleId={id}>
			<ModalHeader setIsOpen={setIsOpen} className='p-4'>
				<ModalTitle id=''>{'Edit User'}</ModalTitle>
			</ModalHeader>
			<ModalBody className='px-4'>
				<div className='row g-4'>
					<FormGroup id='name' label='Name' className='col-md-6'>
						<Input
							name='name'
							value={formik.values.name}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							isValid={formik.isValid}
							isTouched={formik.touched.name}
							invalidFeedback={formik.errors.name}
							validFeedback='Looks good!'
						/>
					</FormGroup>
					<FormGroup id='role' label='Role' className='col-md-6'>
						<Select
							name='role'
							value={formik.values.role}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							isValid={formik.isValid}
							isTouched={formik.touched.role}
							invalidFeedback={formik.errors.role}
							ariaLabel={''}>
							<Option>Select the role</Option>
							<Option value={'bill keeper'}>bill keeper</Option>
							<Option value={'accessory stock keeper'}>accessory stock keeper</Option>
							<Option value={'display stock keeper'}>display stock keeper</Option>
							<Option value={'cashier'}>cashier</Option>
						</Select>
					</FormGroup>
					<FormGroup id='mobile' label='Mobile number' className='col-md-6'>
					<Input
							type='text'
							value={formik.values.mobile}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								const input = e.target.value.replace(/\D/g, ''); // Allow only numbers
								formik.setFieldValue('mobile', formatMobileNumber(input));
							}}
							onBlur={formik.handleBlur}
							isValid={formik.isValid}
							isTouched={formik.touched.mobile}
							invalidFeedback={formik.errors.mobile}
							validFeedback='Looks good!'
						/>
					</FormGroup>

					<FormGroup id='email' label='Email' className='col-md-6'>
						<Input
							name='email'
							value={formik.values.email}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							isValid={formik.isValid}
							isTouched={formik.touched.email}
							invalidFeedback={formik.errors.email}
							validFeedback='Looks good!'
						/>
					</FormGroup>
					<FormGroup id='nic' label='NIC' className='col-md-6'>
						<Input
							name='nic'
							value={formik.values.nic}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							isValid={formik.isValid}
							isTouched={formik.touched.nic}
							invalidFeedback={formik.errors.nic}
							validFeedback='Looks good!'
						/>
					</FormGroup>
				</div>
			</ModalBody>
			<ModalFooter className='px-4 pb-4'>
				<Button color='success' onClick={formik.handleSubmit}>
					Edit User
				</Button>
			</ModalFooter>
		</Modal>
	);
};

UserEditModal.propTypes = {
	id: PropTypes.string.isRequired,
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
};

export default UserEditModal;
