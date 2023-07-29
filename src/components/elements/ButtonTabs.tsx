import React from 'react';
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
				'bg-black py-3 text-center cursor-pointer transition duration-300 border border-x-0 first:border-l last:border-r border-container-border w-full',
				'[&+div]:hover:border-container-border-hover [&+div]:hover:bg-container-border-hover', // pseudo divider hover
				'hover:border-container-border-hover hover:bg-container-bg-hover hover:text-black active:border-container-border-selected', // element states
				selected &&
					'border-container-border-selected bg-container-bg-selected text-text-selected [&+div]:border-container-border-selected [&+div]:bg-container-border-selected',
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
		return tabs.map((tab, index) => (
			<React.Fragment key={tab.label}>
				{/* pseudo divider used to simulate border colors on element states (e.g. hover, selected) */}
				{index !== 0 && (
					<div
						className={twMerge(
							'w-[1px] border-y flex-1 min-w-[1px] max-w-[1px] bg-container-border border-container-border transition duration-300',
							tab.selected &&
								'bg-container-border-selected border-container-border-selected'
						)}
					/>
				)}
				<ButtonTab key={tab.label} {...tab} className={tabClassName} />
			</React.Fragment>
		));
	};

	return <div className={twMerge('flex', className)}>{renderTabs()}</div>;
}

export default ButtonTabs;
