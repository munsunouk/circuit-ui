import { Wallet, useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';
import { twMerge } from 'tailwind-merge';

import useAppStore from '@/hooks/useAppStore';

import FadeInDiv from '../elements/FadeInDiv';
import { Modal } from './Modal';

const WalletOption = ({
	onClick,
	wallet,
	index,
}: {
	onClick: () => void;
	wallet: Wallet;
	index: number;
}) => {
	return (
		<FadeInDiv
			onClick={onClick}
			className="flex justify-between transition-opacity duration-300 cursor-pointer hover:opacity-80"
			delay={(index + 1) * 100}
		>
			<div className="flex gap-2">
				<Image
					src={wallet.adapter.icon}
					alt={wallet.adapter.name}
					width={24}
					height={24}
				/>
				<span>{wallet.adapter.name}</span>
			</div>
			<div
				className={twMerge(
					wallet.adapter.connected && 'font-semibold text-text-selected'
				)}
			>
				{wallet.adapter.connected
					? 'Connected'
					: wallet.adapter.readyState === 'Installed'
					? 'Detected'
					: ''}
			</div>
		</FadeInDiv>
	);
};

export default function ConnectWalletModal() {
	const setAppStore = useAppStore((s) => s.set);
	const walletContext = useWallet();

	const handleOnClose = () => {
		setAppStore((s) => {
			s.modals.showConnectWalletModal = false;
		});
	};

	const handleConnectWallet = (wallet: Wallet) => {
		walletContext?.select(wallet.adapter.name);
	};

	return (
		<Modal onClose={handleOnClose} header="Connect Wallet">
			<div className="flex flex-col gap-6 min-w-[300px]">
				{walletContext?.wallets?.map((wallet, index) => (
					<WalletOption
						key={wallet.adapter.name.toString()}
						wallet={wallet}
						onClick={() => handleConnectWallet(wallet)}
						index={index}
					/>
				))}
			</div>
		</Modal>
	);
}
