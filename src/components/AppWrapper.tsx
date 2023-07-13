'use client';

import { DriftProvider, initializeDriftStore } from '@drift-labs/react';
import { WalletContext, WalletProvider } from '@solana/wallet-adapter-react';

import Env from '@/constants/environment';

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
