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
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import utc from 'dayjs/plugin/utc';
import { useEffect } from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import useDepositAssetBalances from '@/hooks/useDepositAssetBalances';
import useShowAcknowledgeModal from '@/hooks/useShowAcknowledgeModal';
import useSyncWalletToStore from '@/hooks/useSyncWalletToStore';
import { useSyncVaultStats } from '@/hooks/useVaultStats';

import Env, {
	PERP_MARKETS_LOOKUP,
	SPOT_MARKETS_LOOKUP,
} from '@/constants/environment';

dayjs.extend(isSameOrAfter);
dayjs.extend(utc);

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
	useDepositAssetBalances();
	useAllRpcLatencies();
	useEmulation();
	useShowAcknowledgeModal();
	useSyncOraclePriceStore(marketsAndAccounts);
	useSyncVaultStats();

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
