import { twMerge } from 'tailwind-merge';

import useOpenConnectWalletModal from '@/hooks/useOpenConnectWalletModal';

import Button from './elements/Button';

export default function ConnectButton({ className }: { className?: string }) {
	const openConnectWalletModal = useOpenConnectWalletModal();

	return (
		<Button
			className={twMerge('text-xl', className)}
			onClick={openConnectWalletModal}
		>
			Connect Wallet
		</Button>
	);
}
