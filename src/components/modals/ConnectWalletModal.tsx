import { Wallet, useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';
import { twMerge } from 'tailwind-merge';

import useAppStore from '@/hooks/useAppStore';

import { Modal } from './Modal';

const WalletOption = ({
	onClick,
	wallet,
}: {
	onClick: () => void;
	wallet: Wallet;
}) => {
	return (
		<div
			onClick={onClick}
			className={twMerge(
				'border border-container-border flex justify-between py-4 px-4 min-w-[300px] cursor-pointer hover:opacity-80 transition duration-300',
				wallet.adapter.connected &&
					'bg-container-bg-selected border-container-border-selected'
			)}
		>
			<div className="flex gap-1">
				<Image
					src={wallet.adapter.icon}
					alt={wallet.adapter.name}
					width={24}
					height={24}
				/>
				<span>{wallet.adapter.name}</span>
			</div>
			<div>
				{wallet.adapter.connected
					? 'Connected'
					: wallet.adapter.readyState === 'Installed'
					? 'Detected'
					: ''}
			</div>
		</div>
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
			<div className="flex flex-col gap-2">
				{walletContext?.wallets?.map((wallet) => (
					<WalletOption
						key={wallet.adapter.name.toString()}
						wallet={wallet}
						onClick={() => handleConnectWallet(wallet)}
					/>
				))}
			</div>
		</Modal>
	);
}
