import { DetailedHTMLProps, HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

type GradientBorderBoxProps = {
	borderClassName?: string;
	children: React.ReactNode;
	borderWidth?: number;
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

export default function GradientBorderBox({
	color = 'blue',
	children,
	className,
	borderWidth = 1,
	borderClassName,
	...rest
}: GradientBorderBoxProps) {
	return (
		<div
			className={twMerge(`gradient-container-${color}`, borderClassName)}
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
