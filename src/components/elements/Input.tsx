import { twMerge } from 'tailwind-merge';

type InputProps = React.DetailedHTMLProps<
	React.InputHTMLAttributes<HTMLInputElement>,
	HTMLInputElement
>;

export default function Input({ className, ...rest }: InputProps) {
	return (
		<input
			className={twMerge(
				'w-full h-12 px-4 text-lg font-semibold bg-black focus:outline-none focus:border-container-border-selected text-text-emphasis border border-container-border-light',
				className
			)}
			{...rest}
		/>
	);
}
