import { twMerge } from 'tailwind-merge';

import useAppStore from '@/hooks/useAppStore';

import Button from './elements/Button';

export default function ConnectButton({ className }: { className?: string }) {
	const setStore = useAppStore((s) => s.set);

	const openConnectWalletModal = () => {
		setStore((s) => {
			s.modals.showConnectWalletModal = true;
		});
	};

	return (
		<Button
			className={twMerge('text-xl', className)}
			onClick={openConnectWalletModal}
		>
			Connect Wallet
		</Button>
	);
}
