'use client';

import {
	DriftProvider,
	initializeDriftStore,
	useCommonDriftStore,
} from '@drift-labs/react';
import { WalletContext, WalletProvider } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';

import useAppStore from '@/hooks/useAppStore';
import useFetchVault from '@/hooks/useFetchVault';
import useSyncWalletToStore from '@/hooks/useSyncWalletToStore';
import useUsdcBalance from '@/hooks/useUsdcBalance';

import Env from '@/constants/environment';

initializeDriftStore(Env);

const AppSetup = ({ children }: { children: React.ReactNode }) => {
	useSyncWalletToStore();
	useFetchVault();
	useUsdcBalance();

	return <>{children}</>;
};

const AppWrapper = ({ children }: { children: React.ReactNode }) => {
	const get = useAppStore((s) => s.get);
	const getCommon = useCommonDriftStore((s) => s.get);

	useEffect(() => {
		// @ts-ignore
		window.drift_dev = { getStore: get, getCommonStore: getCommon };
	}, []);

	return (
		<WalletProvider wallets={[]} autoConnect>
			<DriftProvider
				// @ts-ignore
				walletContext={WalletContext}
				disable={{
					idlePollingRateSwitcher: true,
				}}
			>
				<AppSetup>{children}</AppSetup>
			</DriftProvider>
		</WalletProvider>
	);
};

export default AppWrapper;
