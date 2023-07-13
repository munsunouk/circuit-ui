'use client';

import { Syne } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { twMerge } from 'tailwind-merge';

const syne = Syne({ subsets: ['latin'] });

type TabProps = {
	label: string;
	route: string;
	selected: boolean;
};

const TAB_OPTIONS: Omit<TabProps, 'selected'>[] = [
	{
		label: 'Supercharger',
		route: '/',
	},
	{
		label: 'FAQ',
		route: '/faq',
	},
];

const Tab = (props: TabProps) => {
	return (
		<Link
			href={props.route}
			className={twMerge(
				'flex items-center justify-center w-40 h-full cursor-pointer hover:opacity-80',
				props.selected && 'bg-container-bg-selected text-text-selected'
			)}
		>
			{props.label}
		</Link>
	);
};

const TopBar = () => {
	const pathname = usePathname();
	const currentMainPath = pathname.split('/')[1];

	return (
		<div className="sticky top-0 h-[64px] w-full bg-black/20 backdrop-blur-sm flex items-center justify-between border-b border-yellow border-container-border">
			<span className="flex items-center w-[220px] gap-3 justify-center border-r h-full border-container-border">
				<Image
					src="/circuits-icon.svg"
					alt="Circuits Icon"
					width="30"
					height="33"
				/>
				<span
					className={twMerge(
						'text-2xl text-white font-medium leading-normal',
						syne.className
					)}
				>
					Circuit
				</span>
			</span>

			<div className="flex items-center h-full">
				{TAB_OPTIONS.map((tab) => (
					<Tab
						key={tab.label}
						{...tab}
						selected={tab.route.split('/')[1] === currentMainPath}
					/>
				))}
			</div>

			<span className="w-[220px] flex items-center justify-center border-l h-full text-xl cursor-pointer border-container-border font-semibold text-text-emphasis">
				Connect Wallet
			</span>
		</div>
	);
};

export default TopBar;
