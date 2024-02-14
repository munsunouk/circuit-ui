import useAppStore from '@/stores/app/useAppStore';
import { useCommonDriftStore, useOraclePriceStore } from '@drift-labs/react';
import {
	BigNum,
	PRICE_PRECISION_EXP,
	PublicKey,
	QUOTE_PRECISION_EXP,
} from '@drift-labs/sdk';
import { MarketId } from '@drift/common';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { twMerge } from 'tailwind-merge';

import { sourceCodePro } from '@/constants/fonts';
import { VAULTS } from '@/constants/vaults';

const DEFAULT_USER_TOTAL_STATS = {
	totalNetBalanceQuote: BigNum.zero(QUOTE_PRECISION_EXP),
	totalEarningsQuote: BigNum.zero(QUOTE_PRECISION_EXP),
	isLoaded: false,
};

const ValueBox = ({
	label,
	value,
	loading,
}: {
	label: string;
	value: string;
	loading?: boolean;
}) => {
	return (
		<div className="flex flex-col items-center flex-1 gap-1 text-center sm:px-6 first:pl-0 last:pr-0">
			{loading ? (
				<Skeleton className="w-[60px] h-[28px]" />
			) : (
				<span
					className={twMerge(
						sourceCodePro.className,
						'text-lg md:text-2xl text-text-emphasis'
					)}
				>
					{value}
				</span>
			)}
			<span className="text-sm md:text-base">{label}</span>
		</div>
	);
};

export default function VaultDepositorSummary() {
	const getVaultDepositorStats = useAppStore((s) => s.getVaultDepositorStats);
	const getMarketPriceData = useOraclePriceStore((s) => s.getMarketPriceData);
	const areVaultsStatsLoaded = useAppStore((s) => s.getAreVaultsStatsLoaded());
	const areVaultsAccountDataLoaded = useAppStore((s) =>
		s.getAreVaultsAccountDataLoaded()
	);
	const areVaultDepositorsAccountDataLoaded = useAppStore((s) =>
		s.getAreVaultDepositorsAccountDataLoaded()
	);
	const allVaultsStats = useAppStore((s) =>
		Object.values(s.vaults).map((v) => v?.vaultStats)
	);
	const numOfVaultsInStore = useAppStore((s) => Object.keys(s.vaults).length);
	const walletContext = useWallet();
	const authority = useCommonDriftStore((s) => s.authority);

	const [userTotalStats, setUserTotalStats] = useState(
		DEFAULT_USER_TOTAL_STATS
	);

	const walletConnected = !!walletContext?.connected;
	const hasNoDeposits =
		areVaultDepositorsAccountDataLoaded &&
		userTotalStats.totalNetBalanceQuote.eqZero();

	useEffect(() => {
		if (!walletConnected || numOfVaultsInStore === 0 || !authority) {
			setUserTotalStats(DEFAULT_USER_TOTAL_STATS);
		}

		if (
			numOfVaultsInStore === 0 || // areVaultsStatsLoaded, areVaultsAccountDataLoaded and areVaultDepositorsAccountData return true of the number of vaults in store is 0
			!walletConnected ||
			!areVaultsStatsLoaded ||
			!areVaultsAccountDataLoaded ||
			!areVaultDepositorsAccountDataLoaded
		)
			return;

		setUserTotalStats(calcUserTotalStats());
	}, [
		numOfVaultsInStore,
		areVaultsStatsLoaded,
		areVaultsAccountDataLoaded,
		areVaultDepositorsAccountDataLoaded,
		walletConnected,
		authority,
		// allVaultsStats,
	]);

	function calcUserTotalStats() {
		const calculatedUserTotalStats = VAULTS.filter(
			(v) => !!v.pubkeyString && !v.comingSoon
		).reduce(
			(acc, vault) => {
				if (!acc.isLoaded) return acc;

				const { balanceBase, totalEarningsBase, isLoaded } =
					getVaultDepositorStats(new PublicKey(vault.pubkeyString!));

				if (!isLoaded) return DEFAULT_USER_TOTAL_STATS;

				const marketOraclePriceBigNum = BigNum.fromPrint(
					(
						getMarketPriceData(
							MarketId.createSpotMarket(vault.market.marketIndex)
						)?.priceData.price ?? 0
					).toString(),
					PRICE_PRECISION_EXP
				);

				const userBalanceQuoteBigNum = balanceBase
					.mul(marketOraclePriceBigNum)
					.shiftTo(QUOTE_PRECISION_EXP);
				const totalEarningsQuote = totalEarningsBase
					.mul(marketOraclePriceBigNum)
					.shiftTo(QUOTE_PRECISION_EXP);

				return {
					totalNetBalanceQuote: acc.totalNetBalanceQuote.add(
						userBalanceQuoteBigNum
					),
					totalEarningsQuote: acc.totalEarningsQuote.add(totalEarningsQuote),
					isLoaded: true,
				};
			},
			{ ...DEFAULT_USER_TOTAL_STATS, isLoaded: true }
		);

		return calculatedUserTotalStats;
	}

	if (!walletConnected || !userTotalStats.isLoaded || hasNoDeposits)
		return null;

	return (
		<div className="flex px-2 sm:px-6 p-6 mt-5 border w-full divide-x border-container-border divide-container-border sm:w-[460px]">
			<ValueBox
				label="My Total Net Balance"
				value={userTotalStats.totalNetBalanceQuote.toNotional()}
				loading={!userTotalStats.isLoaded}
			/>
			<ValueBox
				label="My Total Earnings"
				value={userTotalStats.totalEarningsQuote.toNotional()}
				loading={!userTotalStats.isLoaded}
			/>
		</div>
	);
}
