import { DetailedHTMLProps, HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

type GradientBorderBoxProps = {
	// color: string;
	children: React.ReactNode;
	borderWidth?: number;
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

export default function GradientBorderBox({
	color = 'blue',
	children,
	className,
	borderWidth = 0.5,
	...rest
}: GradientBorderBoxProps) {
	return (
		<div
			className={`gradient-container-${color}`}
			style={{
				padding: borderWidth,
			}}
		>
			<div className={twMerge('h-full bg-black', className)} {...rest}>
				{children}
			</div>
		</div>
	);
}
