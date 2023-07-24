import { Wallet, useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';
import { twMerge } from 'tailwind-merge';

import useAppStore from '@/hooks/useAppStore';

import Button from '../elements/Button';
import { Modal } from './Modal';

const WalletOption = ({
	onClick,
	wallet,
}: {
	onClick: () => void;
	wallet: Wallet;
}) => {
	return (
		<Button
			onClick={onClick}
			className={twMerge(
				'flex justify-between p-4 min-w-[360px] font-normal',
				wallet.adapter.connected &&
					'bg-container-bg-selected border-container-border-selected text-text-selected'
			)}
			secondary
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
			<div className={twMerge(wallet.adapter.connected && 'font-semibold')}>
				{wallet.adapter.connected
					? 'Connected'
					: wallet.adapter.readyState === 'Installed'
					? 'Detected'
					: ''}
			</div>
		</Button>
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
