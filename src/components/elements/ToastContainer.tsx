'use client';

import { ToastContainer as ToastContainerBase } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { twMerge } from 'tailwind-merge';

import '../../styles/toast.css';

export default function ToastContainer() {
	return (
		<ToastContainerBase
			position="bottom-left"
			toastClassName={(context) =>
				twMerge(
					'relative flex bg-white p-2 border border-black text-black mt-2 overflow-hidden text-text-emphasis',
					context?.type === 'success' &&
						'border-success-green-border bg-success-green-bg',
					context?.type === 'error' && 'border-error-red-border bg-error-red-bg'
				)
			}
			hideProgressBar
		/>
	);
}
