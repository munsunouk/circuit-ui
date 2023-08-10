import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import Button from './Button';
import Chevron from './Chevron';
import FadeInDiv from './FadeInDiv';

interface Option {
	label: string;
	value: any;
}

const DropdownOption = ({
	option,
	onSelect,
	delay,
}: {
	option: Option;
	onSelect: (option: Option) => void;
	delay?: number;
}) => {
	return (
		<FadeInDiv className="cursor-pointer whitespace-nowrap" delay={delay}>
			<Button
				onClick={() => onSelect(option)}
				secondary
				className="justify-start w-full font-medium border-none border-container-border text-text-default hover:text-black"
			>
				{option.label}
			</Button>
		</FadeInDiv>
	);
};

interface DropdownProps {
	options: Option[];
	selectedOption: Option;
	setSelectedOption: (option: Option) => void;
	width?: number;
}

export default function Dropdown({
	options,
	selectedOption,
	setSelectedOption,
	width,
}: DropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// if mouse click is outside of dropdown, close dropdown
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const handleSelect = (option: Option) => {
		setIsOpen(false);
		setSelectedOption(option);
	};

	const renderOptions = () => {
		return options.map((option, index) => (
			<DropdownOption
				option={option}
				key={option.value}
				onSelect={handleSelect}
				delay={(index + 1) * 100}
			/>
		));
	};

	return (
		<div className="relative z-40" ref={containerRef}>
			<Button
				secondary
				innerClassName="flex gap-1 font-medium justify-between w-full"
				className={twMerge(
					'group border-container-border text-text-default hover:text-black',
					isOpen && 'border-container-border-selected'
				)}
				onClick={() => setIsOpen(!isOpen)}
				style={{ width: width }}
			>
				<span>{selectedOption.label}</span>
				<Chevron
					className="w-6 h-6 group-hover:[&>path]:fill-black group-active:[&>path]:fill-white [&>path]:transition-all [&>path]:duration-300"
					open={isOpen}
				/>
			</Button>
			{isOpen && (
				<div
					className={twMerge(
						'absolute top-[calc(100%+8px)] border border-container-border-selected min-w-full bg-black flex flex-col',
						'right-0'
					)}
				>
					{renderOptions()}
				</div>
			)}
		</div>
	);
}
