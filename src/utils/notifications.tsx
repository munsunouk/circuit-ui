import { toast } from 'react-toastify';

import '../styles/toast.css';

type ToastWithMessageProps = {
	title: string;
	message: string;
};

export const ToastWithMessage = ({ title, message }: ToastWithMessageProps) => {
	return (
		<div className="flex flex-col gap-1">
			<span className="font-medium text-text-emphasis">{title}</span>
			<span style={{ fontSize: 14, color: 'var(--text-default)' }}>
				{/** not sure why tailwind classes don't work here */}
				{message}
			</span>
		</div>
	);
};

const NOTIFICATION_UTILS = {
	toast,
};

export default NOTIFICATION_UTILS;
