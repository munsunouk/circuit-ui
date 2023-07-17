import { twMerge } from 'tailwind-merge';

type ButtonTabProps = {
	label: string;
	selected: boolean;
	onSelect: () => void;
};

const ButtonTab = ({
	label,
	selected,
	onSelect,
	className,
}: ButtonTabProps & { className?: string }) => {
	return (
		<div
			className={twMerge(
				'bg-black py-3 text-center cursor-pointer transition duration-300 border border-container-border w-full -mx-[1px] first:mx-0',
				'hover:border-container-border-hover hover:bg-container-bg-hover hover:text-black active:border-container-border-selected', // element states
				selected &&
					'border-container-border-selected bg-container-bg-selected text-text-selected z-10',
				className
			)}
			onClick={onSelect}
		>
			{label}
		</div>
	);
};

function ButtonTabs({
	tabs,
	className,
	tabClassName,
}: {
	tabs: ButtonTabProps[];
	className?: string;
	tabClassName?: string;
}) {
	const renderTabs = () => {
		return tabs.map((tab) => (
			<ButtonTab key={tab.label} {...tab} className={tabClassName} />
		));
	};

	return <div className={twMerge('flex', className)}>{renderTabs()}</div>;
}

export default ButtonTabs;
