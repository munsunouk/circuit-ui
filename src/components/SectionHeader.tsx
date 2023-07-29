import { twMerge } from 'tailwind-merge';

export default function SectionHeader({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={twMerge('flex flex-col gap-1', className)}>
			<span className="text-lg font-semibold md:text-2xl text-text-emphasis">
				{children}
			</span>
			<span className="w-8 h-[2px] bg-main-blue" />
		</div>
	);
}
