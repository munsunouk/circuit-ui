import { twMerge } from 'tailwind-merge';

export default function Badge({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={twMerge(
				'bg-main-blue rounded-[1px] text-black text-sm px-2 py-1',
				className
			)}
		>
			{children}
		</div>
	);
}
