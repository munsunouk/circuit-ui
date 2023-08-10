'use client';

import {
	DriftProvider,
	initializeDriftStore,
	useAllRpcLatencies,
	useCommonDriftStore,
} from '@drift-labs/react';
import { WalletContext, WalletProvider } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

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
	useAllRpcLatencies();

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
					geoblocking: true,
				}}
			>
				<SkeletonTheme baseColor="#88c9ff" highlightColor="#fff">
					<AppSetup>{children}</AppSetup>
				</SkeletonTheme>
			</DriftProvider>
		</WalletProvider>
	);
};

export default AppWrapper;
