'use client';

import { useCommonDriftStore } from '@drift-labs/react';
import { useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import useAppStore from '@/hooks/useAppStore';

import { syne } from '@/constants/fonts';

import Chevron from '../Chevron';
import FadeInDiv from '../elements/FadeInDiv';

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
				'flex items-center justify-center w-40 h-full cursor-pointer hover:opacity-80 font-normal',
				props.selected && 'bg-container-bg-selected text-text-selected'
			)}
		>
			{props.label}
		</Link>
	);
};

const TopBar = () => {
	const setAppStore = useAppStore((s) => s.set);
	const authority = useCommonDriftStore((s) => s.authority);
	const pathname = usePathname();
	const { connected, disconnect, connecting, disconnecting } = useWallet();

	const [isManageWalletsOpen, setIsManageWalletsOpen] = useState(false);

	const manageWalletPopup = useRef<HTMLDivElement>(null);

	const currentMainPath = pathname.split('/')[1];
	const shortPublicKey = `${authority?.toString().slice(0, 4)}...${authority
		?.toString()
		.slice(40, 44)}`;

	useEffect(() => {
		// Close the manage wallets popup when clicking outside of it
		const handleClickOutside = (event: MouseEvent) => {
			if (
				manageWalletPopup.current &&
				!manageWalletPopup.current.contains(event.target as Node)
			) {
				setIsManageWalletsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const openConnectWalletModal = () => {
		setAppStore((s) => {
			s.modals.showConnectWalletModal = true;
		});
	};

	const handleManageWalletClick = () => {
		if (connecting || disconnecting) return;

		connected
			? setIsManageWalletsOpen(!isManageWalletsOpen)
			: openConnectWalletModal();
	};

	return (
		<div className="sticky top-0 h-[48px] md:h-[64px] w-full bg-black/20 backdrop-blur-sm flex items-center justify-between border-b border-yellow border-container-border z-50">
			<span className="flex items-center w-[160px] md:w-[220px] gap-2 md:gap-3 md:justify-center md:border-r h-full border-container-border pl-4">
				<Image
					src="/circuits-icon.svg"
					alt="Circuits Icon"
					width="30"
					height="33"
					className="w-[20px] h-[22px] md:w-[30px] md:h-[33px]"
				/>
				<span
					className={twMerge(
						'md:text-2xl text-white font-medium leading-normal',
						syne.className
					)}
				>
					Circuit
				</span>
			</span>

			<div className="items-center hidden h-full md:flex">
				{TAB_OPTIONS.map((tab) => (
					<Tab
						key={tab.label}
						{...tab}
						selected={tab.route.split('/')[1] === currentMainPath}
					/>
				))}
			</div>

			<span
				className={twMerge(
					'relative flex items-center justify-center h-full px-8 text-sm md:text-xl font-semibold border-x cursor-pointer border-container-border border-r-transparent text-text-emphasis transition-[border] duration-300 w-[160px] md:w-[220px] ',
					isManageWalletsOpen &&
						'bg-container-bg-selected border border-b-0 border-container-border-selected'
				)}
				onClick={handleManageWalletClick}
				ref={manageWalletPopup}
			>
				{connected && authority ? (
					<div className="flex flex-col">
						<div className="flex items-center gap-1">
							<span>{shortPublicKey}</span>
							<Chevron
								open={isManageWalletsOpen}
								className="w-6 h-6 md:w-9 md:h-9"
							/>
						</div>
						{
							<div
								className={twMerge(
									'absolute left-[-1px] right-[-1px] flex flex-col px-8 py-3 font-normal bg-black border border-t-0 top-full transition-[border] duration-300 overflow-hidden',
									isManageWalletsOpen
										? 'h-auto border-container-border-selected'
										: 'h-0 p-0 border-container-border'
								)}
							>
								<FadeInDiv
									fadeCondition={isManageWalletsOpen}
									delay={100}
									className={'py-3'}
									onClick={openConnectWalletModal}
								>
									<span className="transition-opacity duration-300 hover:opacity-80">
										Switch wallets
									</span>
								</FadeInDiv>
								<FadeInDiv
									fadeCondition={isManageWalletsOpen}
									delay={200}
									className="py-3"
									onClick={disconnect}
								>
									<span className="transition-opacity duration-300 hover:opacity-80">
										Disconnect
									</span>
								</FadeInDiv>
								<FadeInDiv
									fadeCondition={isManageWalletsOpen}
									delay={300}
									className="py-3 md:hidden"
								>
									<Link
										className="transition-opacity duration-300 hover:opacity-80"
										href={'/faq'}
									>
										FAQ
									</Link>
								</FadeInDiv>
							</div>
						}
					</div>
				) : (
					<span className="text-sm text-center md:text-xl">Connect Wallet</span>
				)}
			</span>
		</div>
	);
};

export default TopBar;
