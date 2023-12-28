import { useCommonDriftStore, useOraclePriceStore } from '@drift-labs/react';
import {
	BigNum,
	ONE,
	PERCENTAGE_PRECISION,
	PRICE_PRECISION_EXP,
	QUOTE_PRECISION_EXP,
} from '@drift-labs/sdk';
import { VAULT_SHARES_PRECISION_EXP } from '@drift-labs/vaults-sdk';
import { MarketId } from '@drift/common';
import { useWallet } from '@solana/wallet-adapter-react';
import Skeleton from 'react-loading-skeleton';
import { twMerge } from 'tailwind-merge';

import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';
import useCurrentVaultDepositorAccData from '@/hooks/useCurrentVaultDepositorAccData';
import { useCurrentVault } from '@/hooks/useVault';
import { useCurrentVaultStats } from '@/hooks/useVaultStats';

import { displayAssetValue as displayAssetValueBase } from '@/utils/utils';
import { getUiVaultConfig, getUserMaxDailyDrawdown } from '@/utils/vaults';

import { USDC_MARKET } from '@/constants/environment';
import { sourceCodePro } from '@/constants/fonts';

import ConnectButton from '../ConnectButton';
import SectionHeader from '../SectionHeader';
import FadeInDiv from '../elements/FadeInDiv';
import { Tooltip } from '../elements/Tooltip';
import BreakdownRow from './BreakdownRow';
import TransactionHistory from './TransactionHistory';

const StatsBox = ({
	label,
	value,
	tooltip,
	loading,
}: {
	label: string;
	value: string;
	tooltip?: {
		id: string;
		content: React.ReactNode;
		hide?: boolean;
	};
	loading?: boolean;
}) => {
	return (
		<div className="flex flex-col items-center flex-1 gap-1 text-center">
			{loading ? (
				<Skeleton className="w-10 h-6 md:h-7" />
			) : (
				<span
					className={twMerge(
						sourceCodePro.className,
						'text-lg md:text-2xl font-medium text-text-emphasis'
					)}
					data-tooltip-id={tooltip?.id}
				>
					{value}
				</span>
			)}
			{tooltip && !tooltip?.hide && (
				<Tooltip id={tooltip.id}>
					<span className={twMerge(sourceCodePro.className, 'text-xl')}>
						{tooltip.content}
					</span>
				</Tooltip>
			)}
			<span className="text-sm md:text-lg">{label}</span>
		</div>
	);
};

const BUFFER = 0.01 * 10 ** QUOTE_PRECISION_EXP.toNumber();

export default function YourPerformance() {
	const { connected } = useWallet();
	const authority = useCommonDriftStore((s) => s.authority);
	const vaultDepositorAccData = useCurrentVaultDepositorAccData();
	const vaultAccountData = useCurrentVaultAccountData();
	const vaultStats = useCurrentVaultStats();
	const vault = useCurrentVault();
	const uiVault = getUiVaultConfig(vault?.vaultAccountData.pubkey);
	const getMarketPriceData = useOraclePriceStore((s) => s.getMarketPriceData);
	const spotMarketConfig = uiVault?.market ?? USDC_MARKET;
	const basePrecisionExp = spotMarketConfig.precisionExp;
	const isUsdcMarket = spotMarketConfig.marketIndex === USDC_MARKET.marketIndex;

	const showUserInfo = connected || !!authority;
	const marketOraclePriceBigNum = BigNum.fromPrint(
		(
			getMarketPriceData(
				MarketId.createSpotMarket(spotMarketConfig.marketIndex)
			)?.priceData.price ?? 0
		).toString(),
		PRICE_PRECISION_EXP
	);

	const loading = !vaultStats.isLoaded;

	// User's vault share proportion
	const totalVaultShares = vaultAccountData?.totalShares.toNumber() ?? 0;
	const userVaultShares = vaultDepositorAccData?.vaultShares.toNumber() ?? 0;
	const userSharesProportion = userVaultShares / totalVaultShares || 0;

	// User's net deposits
	const netBaseDeposits = vaultDepositorAccData?.netDeposits;
	const netBaseDepositsBigNum = BigNum.from(netBaseDeposits, basePrecisionExp);
	const netQuoteDepositsBigNum = netBaseDepositsBigNum.mul(
		marketOraclePriceBigNum
	);
	const vaultAccountBaseBalance = BigNum.from(
		vaultStats.totalAccountBaseValue,
		basePrecisionExp
	);
	const userAccountBaseBalance =
		vaultAccountBaseBalance.toNum() * userSharesProportion;
	const userAccountBaseBalanceBigNum = BigNum.fromPrint(
		`${userAccountBaseBalance}`,
		basePrecisionExp
	);
	const userAccountQuoteBalanceBigNum = userAccountBaseBalanceBigNum.mul(
		marketOraclePriceBigNum
	);

	// User's total earnings
	const userTotalDepositsBigNum = BigNum.from(
		vaultDepositorAccData?.totalDeposits,
		basePrecisionExp
	);
	const userTotalWithdrawsBigNum = BigNum.from(
		vaultDepositorAccData?.totalWithdraws,
		basePrecisionExp
	);
	let totalEarnings = userTotalWithdrawsBigNum
		.sub(userTotalDepositsBigNum)
		.add(userAccountBaseBalanceBigNum);
	// prevent $-0.00
	if (
		totalEarnings.ltZero() &&
		totalEarnings.gt(BigNum.from(-BUFFER, basePrecisionExp))
	) {
		totalEarnings = BigNum.zero(basePrecisionExp);
	}
	const totalEarningsQuote = totalEarnings.mul(marketOraclePriceBigNum);

	const roi =
		(totalEarnings
			.mul(PERCENTAGE_PRECISION)
			.div(
				BigNum.max(userTotalDepositsBigNum, BigNum.from(ONE, basePrecisionExp))
			)
			.toNum() /
			PERCENTAGE_PRECISION.toNumber()) *
		100;

	// Max daily drawdown
	const maxDailyDrawdown = getUserMaxDailyDrawdown(
		vault?.pnlHistory.dailyAllTimePnls ?? [],
		vault?.eventRecords?.records ?? []
	);

	// User fees
	const profitShareFeePaid = BigNum.from(
		vaultDepositorAccData?.profitShareFeePaid,
		basePrecisionExp
	);
	const highWaterMark = BigNum.from(
		vaultDepositorAccData?.cumulativeProfitShareAmount,
		basePrecisionExp
	);
	const highWaterMarkWithCurrentDeposit = highWaterMark
		.add(userTotalDepositsBigNum)
		.sub(userTotalWithdrawsBigNum);

	const displayAssetValue = (value: BigNum) =>
		displayAssetValueBase(value, spotMarketConfig.marketIndex, true);

	return (
		<div className={'relative flex flex-col gap-8 w-full'}>
			<FadeInDiv>
				<SectionHeader className="mb-9">Summary</SectionHeader>
				<div className="flex items-center justify-center w-full gap-4">
					<StatsBox
						label="Your Balance"
						value={
							showUserInfo
								? displayAssetValue(userAccountBaseBalanceBigNum)
								: '--'
						}
						tooltip={{
							id: 'total-user-balance-summary-tooltip',
							content: userAccountQuoteBalanceBigNum.toNotional(),
							hide: isUsdcMarket,
						}}
						loading={loading}
					/>
					<div className="h-12 border-r border-container-border" />
					<StatsBox
						label="Total Earnings (All Time)"
						value={showUserInfo ? displayAssetValue(totalEarnings) : '--'}
						tooltip={{
							id: 'total-earnings-summary-tooltip',
							content: totalEarningsQuote.toNotional(),
							hide: isUsdcMarket,
						}}
						loading={loading}
					/>
				</div>
			</FadeInDiv>
			<FadeInDiv delay={100}>
				<SectionHeader className="mb-4">Performance Breakdown</SectionHeader>
				<div className="flex flex-col gap-2">
					<BreakdownRow
						label="Total Earnings (All Time)"
						value={displayAssetValue(totalEarnings)}
						tooltip={{
							id: 'total-earnings-tooltip',
							content: (
								<span className={twMerge(sourceCodePro.className)}>
									{totalEarningsQuote.toNotional()}
								</span>
							),
							hide: isUsdcMarket,
						}}
						loading={loading}
					/>
					<BreakdownRow
						label="Your Cumulative Net Deposits"
						value={displayAssetValue(netBaseDepositsBigNum)}
						tooltip={{
							id: 'total-user-cumulative-net-deposits-tooltip',
							content: (
								<span className={twMerge(sourceCodePro.className)}>
									{netQuoteDepositsBigNum.toNotional()}
								</span>
							),
							hide: isUsdcMarket,
						}}
						loading={loading}
					/>
					<BreakdownRow
						label="Your Balance"
						value={
							showUserInfo
								? displayAssetValue(userAccountBaseBalanceBigNum)
								: '--'
						}
						tooltip={{
							id: 'total-user-balance-tooltip',
							content: (
								<span className={twMerge(sourceCodePro.className)}>
									{userAccountQuoteBalanceBigNum.toNotional()}
								</span>
							),
							hide: isUsdcMarket,
						}}
						loading={loading}
					/>
					<BreakdownRow
						label="ROI"
						value={`${roi.toFixed(4)}%`}
						loading={loading}
					/>
					<BreakdownRow
						label="Vault Share"
						value={`${Number(
							(userSharesProportion * 100).toFixed(
								VAULT_SHARES_PRECISION_EXP.toNumber() - 2
							)
						)}%`}
						loading={loading}
					/>
					<BreakdownRow
						label="Max Daily Drawdown"
						value={`${(maxDailyDrawdown * 100).toFixed(2)}%`}
						loading={loading}
					/>
				</div>
			</FadeInDiv>
			<FadeInDiv delay={200}>
				<SectionHeader className="mb-4">Fees Breakdown</SectionHeader>
				<div className="flex flex-col gap-2">
					<BreakdownRow
						label="Profit Share Fees Paid"
						value={displayAssetValue(profitShareFeePaid)}
						loading={loading}
					/>
					<BreakdownRow
						label="High-Water Mark"
						value={displayAssetValue(highWaterMarkWithCurrentDeposit)}
						loading={loading}
					/>
				</div>
			</FadeInDiv>
			<FadeInDiv delay={300}>
				<TransactionHistory />
			</FadeInDiv>
			{!showUserInfo && (
				<>
					<div className="absolute inset-0 flex flex-col items-center backdrop-blur-sm">
						<ConnectButton className="max-w-[400px] mt-60 h-auto " />
					</div>
				</>
			)}
		</div>
	);
}
