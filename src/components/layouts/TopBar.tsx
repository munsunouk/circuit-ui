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

			<span
				className={twMerge(
					'relative flex items-center justify-center h-full px-8 text-xl font-semibold border-x cursor-pointer border-container-border border-r-transparent text-text-emphasis transition-[border] duration-300',
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
							<Chevron open={isManageWalletsOpen} width={36} height={36} />
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
								<div
									className={twMerge(
										'py-3 hover:opacity-80 transition-[opacity] duration-300 delay-100',
										isManageWalletsOpen ? 'opacity-100' : 'opacity-0'
									)}
									onClick={openConnectWalletModal}
								>
									<span className="transition-opacity duration-300 hover:opacity-80">
										Switch wallets
									</span>
								</div>
								<div
									className={twMerge(
										'py-3 transition-opacity duration-300 delay-200',
										isManageWalletsOpen ? 'opacity-100' : 'opacity-0'
									)}
									onClick={disconnect}
								>
									<span className="transition-opacity duration-300 hover:opacity-80">
										Disconnect
									</span>
								</div>
							</div>
						}
					</div>
				) : (
					<span>Connect Wallet</span>
				)}
			</span>
		</div>
	);
};

export default TopBar;
