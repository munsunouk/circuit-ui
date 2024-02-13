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
		<div className="flex flex-col items-center gap-1 px-10 text-center first:pl-0 last:pr-0">
			{loading ? (
				<Skeleton className="w-[60px] h-[28px]" />
			) : (
				<span
					className={twMerge(
						sourceCodePro.className,
						'text-2xl text-text-emphasis'
					)}
				>
					{value}
				</span>
			)}
			<span className="text-base">{label}</span>
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
	const numOfVaultsInStore = useAppStore((s) => Object.keys(s.vaults).length);
	const walletContext = useWallet();
	const authority = useCommonDriftStore((s) => s.authority);

	const [userTotalStats, setUserTotalStats] = useState(
		DEFAULT_USER_TOTAL_STATS
	);

	const walletConnected = !!walletContext?.connected;

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
	]);

	function calcUserTotalStats() {
		const calculatedUserTotalStats = VAULTS.filter(
			(v) => !!v.pubkeyString
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

	if (!walletConnected) return null;

	return (
		<div className="flex p-6 mt-5 border divide-x border-container-border divide-container-border">
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
