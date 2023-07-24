import { twMerge } from 'tailwind-merge';

export default function TailwindClassBufferer() {
	return (
		<div
			className={twMerge(
				'bg-container-border-light',
				'bg-success-green-border',
				'bg-error-red-border'
			)}
		/>
	);
}
