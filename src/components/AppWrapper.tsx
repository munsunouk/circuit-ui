'use client';

import Env from '@/constants/environment';
import { initializeDriftStore, DriftProvider } from '@drift-labs/react';
import { WalletContext, WalletProvider } from '@solana/wallet-adapter-react';

initializeDriftStore(Env);

const AppWrapper = ({ children }: { children: React.ReactNode }) => {
	return (
		<WalletProvider wallets={[]} autoConnect>
			<DriftProvider
				// @ts-ignore
				walletContext={WalletContext}
				disable={{
					idlePollingRateSwitcher: true,
				}}
			>
				{children}
			</DriftProvider>
		</WalletProvider>
	);
};

export default AppWrapper;
