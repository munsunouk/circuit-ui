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

import Chevron from '../elements/Chevron';
import FadeInDiv from '../elements/FadeInDiv';

type TabProps = {
	label: string;
	route: string;
	selected: boolean;
};

const TAB_OPTIONS: Omit<TabProps, 'selected'>[] = [
	{
		label: 'All Vaults',
		route: '/',
	},
];

const Tab = (props: TabProps) => {
	return (
		<Link
			href={props.route}
			className={twMerge(
				'flex items-center justify-center w-40 h-full cursor-pointer hover:bg-main-blue hover:text-black font-normal text-xl transition duration-300',
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
	const shortPublicKey = authority
		? `${authority?.toString().slice(0, 4)}...${authority
				?.toString()
				.slice(40, 44)}`
		: '...';

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
		<div className="sticky top-0 h-[48px] md:h-[64px] w-full bg-black/20 backdrop-blur-sm flex items-center justify-between border-b border-yellow border-container-border z-[100]">
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
					'relative flex items-center justify-center h-full px-8 text-sm md:text-xl font-semibold border-x cursor-pointer border-container-border border-r-transparent text-text-emphasis transition duration-300 w-[160px] md:w-[220px] hover:bg-main-blue group',
					isManageWalletsOpen &&
						'bg-container-bg-selected border border-b-0 border-container-border-selected hover:bg-container-bg-selected hover:text-text-emphasis'
				)}
				onClick={handleManageWalletClick}
				ref={manageWalletPopup}
			>
				{connected || authority ? (
					<div className="flex flex-col">
						<div className="flex items-center gap-1">
							<span
								className={twMerge(
									'transition duration-300 group-hover:text-black',
									isManageWalletsOpen && 'group-hover:text-text-emphasis'
								)}
							>
								{shortPublicKey}
							</span>
							<Chevron
								open={isManageWalletsOpen}
								className={twMerge(
									'w-6 h-6 md:w-9 md:h-9 group-hover:[&>path]:fill-black [&>path]:transition-all [&>path]:duration-300',
									isManageWalletsOpen && 'group-hover:[&>path]:fill-white'
								)}
							/>
						</div>
						<div
							className={twMerge(
								'absolute left-[-1px] right-[-1px] flex flex-col font-normal bg-black border border-t-0 top-full transition-[border] duration-300 overflow-hidden',
								isManageWalletsOpen
									? 'h-auto border-container-border-selected'
									: 'h-0 p-0 border-container-border'
							)}
						>
							<FadeInDiv
								fadeCondition={isManageWalletsOpen}
								delay={100}
								className={
									'py-4 px-8 group/item hover:bg-container-bg-hover transition-all duration-300'
								}
								onClick={openConnectWalletModal}
							>
								<span className="transition-all duration-300 group-hover/item:text-black text-text-emphasis">
									Switch wallets
								</span>
							</FadeInDiv>
							<FadeInDiv
								fadeCondition={isManageWalletsOpen}
								delay={200}
								className={
									'py-4 px-8 group/item hover:bg-container-bg-hover transition-all duration-300'
								}
								onClick={disconnect}
							>
								<span className="transition-all duration-300 group-hover/item:text-black text-text-emphasis">
									Disconnect
								</span>
							</FadeInDiv>
						</div>
					</div>
				) : (
					<span className="text-sm text-center md:text-xl">Connect Wallet</span>
				)}
			</span>
		</div>
	);
};

export default TopBar;
