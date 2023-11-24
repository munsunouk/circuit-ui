import { CSSProperties } from 'react';
import { twMerge } from 'tailwind-merge';

export default function Badge({
	children,
	className,
	outlined,
	borderColor = 'var(--main-blue)',
}: {
	children: React.ReactNode;
	className?: string;
	outlined?: boolean;
	borderColor?: CSSProperties['borderColor'];
}) {
	return (
		<div
			className={twMerge(
				'bg-main-blue rounded-[1px] text-black text-sm px-2 py-1 border',
				outlined && 'bg-transparent text-text-emphasis',
				className
			)}
			style={{
				borderColor: borderColor,
			}}
		>
			{children}
		</div>
	);
}
