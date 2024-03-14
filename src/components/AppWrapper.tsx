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
	usePriorityFeeUserSettings,
	useSyncOraclePriceStore,
	useSyncPriorityFeeStore,
} from '@drift-labs/react';
import { UIMarket } from '@drift/common';
import { WalletContext, WalletProvider } from '@solana/wallet-adapter-react';
import axios from 'axios';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import utc from 'dayjs/plugin/utc';
import { useEffect } from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { SWRConfig } from 'swr';

import useDepositAssetBalances from '@/hooks/useDepositAssetBalances';
import useShowAcknowledgeModal from '@/hooks/useShowAcknowledgeModal';
import useSyncWalletToStore from '@/hooks/useSyncWalletToStore';
import { useSyncVaultStats } from '@/hooks/useVaultStats';

import Env, {
	PERP_MARKETS_LOOKUP,
	RPC_LIST,
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
	// variables for useSyncPriorityFeeStore
	const heliusRpcUrl =
		RPC_LIST.find((rpc) => rpc.value.includes('helius'))?.value ?? '';
	const targetFeePercentile = Env.priorityFee.targetPercentile;
	const { priorityFeeSettings } = usePriorityFeeUserSettings();

	useSyncWalletToStore();
	useFetchVault();
	useDepositAssetBalances();
	useAllRpcLatencies();
	useEmulation();
	useShowAcknowledgeModal();
	useSyncOraclePriceStore(marketsAndAccounts);
	useSyncVaultStats();
	useSyncPriorityFeeStore({
		heliusRpcUrl,
		targetFeePercentile,
		userPriorityFeeType: priorityFeeSettings.userPriorityFeeType,
		userCustomMaxPriorityFeeCap:
			priorityFeeSettings.userCustomMaxPriorityFeeCap,
		userCustomPriorityFee: priorityFeeSettings.userCustomPriorityFee,
	});

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
				<SWRConfig
					value={{
						fetcher: (url: string) => axios.get(url).then((res) => res.data),
					}}
				>
					<SkeletonTheme baseColor="#88c9ff" highlightColor="#fff">
						<AppSetup>{children}</AppSetup>
					</SkeletonTheme>
				</SWRConfig>
			</DriftProvider>
		</WalletProvider>
	);
};

export default AppWrapper;
