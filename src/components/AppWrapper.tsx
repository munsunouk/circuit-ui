'use client';

import useAppStore from '@/stores/app/useAppStore';
import useFetchVault from '@/stores/app/useFetchVault';
import {
	DriftProvider,
	MarketAndAccount,
	initializeDriftStore,
	useAllRpcLatencies,
	useCommonDriftStore,
	useEmulation,
	useSyncOraclePriceStore,
} from '@drift-labs/react';
import { UIMarket } from '@drift/common';
import { WalletContext, WalletProvider } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import useShowAcknowledgeModal from '@/hooks/useShowAcknowledgeModal';
import useSyncWalletToStore from '@/hooks/useSyncWalletToStore';
import useUsdcBalance from '@/hooks/useUsdcBalance';

import Env, {
	PERP_MARKETS_LOOKUP,
	SPOT_MARKETS_LOOKUP,
} from '@/constants/environment';

initializeDriftStore(Env);

const marketsAndAccounts: MarketAndAccount[] = [];
PERP_MARKETS_LOOKUP.forEach((market) => {
	marketsAndAccounts.push({
		market: UIMarket.createPerpMarket(market.marketIndex),
		accountToUse: market.oracle,
	});
});
SPOT_MARKETS_LOOKUP.forEach((market) => {
	marketsAndAccounts.push({
		market: UIMarket.createSpotMarket(market.marketIndex),
		accountToUse: market.oracle,
	});
});

const AppSetup = ({ children }: { children: React.ReactNode }) => {
	useSyncWalletToStore();
	useFetchVault();
	useUsdcBalance();
	useAllRpcLatencies();
	useEmulation();
	useShowAcknowledgeModal();
	useSyncOraclePriceStore(marketsAndAccounts);

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
				additionalDriftClientConfig={{
					opts: {
						skipPreflight: true,
					},
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
