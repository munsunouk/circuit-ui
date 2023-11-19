import { useCommonDriftStore } from '@drift-labs/react';
import {
	BigNum,
	ONE,
	PERCENTAGE_PRECISION,
	QUOTE_PRECISION_EXP,
} from '@drift-labs/sdk';
import { VAULT_SHARES_PRECISION_EXP } from '@drift-labs/vaults-sdk';
import { useWallet } from '@solana/wallet-adapter-react';
import { twMerge } from 'tailwind-merge';

import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';
import useCurrentVaultDepositorAccData from '@/hooks/useCurrentVaultDepositorAccData';
import { useCurrentVault } from '@/hooks/useVault';
import { useCurrentVaultStats } from '@/hooks/useVaultStats';

import { getUserMaxDailyDrawdown } from '@/utils/vaults';

import { sourceCodePro } from '@/constants/fonts';

import ConnectButton from '../ConnectButton';
import SectionHeader from '../SectionHeader';
import FadeInDiv from '../elements/FadeInDiv';
import BreakdownRow from './BreakdownRow';
import TransactionHistory from './TransactionHistory';

const StatsBox = ({ label, value }: { label: string; value: string }) => {
	return (
		<div className="flex flex-col items-center flex-1 gap-1 text-center">
			<span
				className={twMerge(
					sourceCodePro.className,
					'text-lg md:text-2xl font-medium text-text-emphasis'
				)}
			>
				{value}
			</span>
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

	const showUserInfo = connected || !!authority;

	// User's vault share proportion
	const totalVaultShares = vaultAccountData?.totalShares.toNumber() ?? 0;
	const userVaultShares = vaultDepositorAccData?.vaultShares.toNumber() ?? 0;
	const userSharesProportion = userVaultShares / totalVaultShares || 0;

	// User's net deposits
	const netDeposits = vaultDepositorAccData?.netDeposits;
	const netDepositsBigNum = BigNum.from(netDeposits, QUOTE_PRECISION_EXP);
	const netDepositsString = netDepositsBigNum.toNotional();
	const vaultAccountBalance = vaultStats.totalAccountValue.toNumber();
	const userAccountBalanceProportion =
		vaultAccountBalance * userSharesProportion;
	const userAccountBalanceProportionBigNum = BigNum.from(
		userAccountBalanceProportion,
		QUOTE_PRECISION_EXP
	);
	const userAccountValueString =
		userAccountBalanceProportionBigNum.toNotional();

	// User's total earnings
	const userTotalDepositsBigNum = BigNum.from(
		vaultDepositorAccData?.totalDeposits,
		QUOTE_PRECISION_EXP
	);
	const userTotalWithdrawsBigNum = BigNum.from(
		vaultDepositorAccData?.totalWithdraws,
		QUOTE_PRECISION_EXP
	);
	let totalEarnings = userTotalWithdrawsBigNum
		.sub(userTotalDepositsBigNum)
		.add(userAccountBalanceProportionBigNum);
	// prevent $-0.00
	if (
		totalEarnings.ltZero() &&
		totalEarnings.gt(BigNum.from(-BUFFER, QUOTE_PRECISION_EXP))
	) {
		totalEarnings = BigNum.zero(QUOTE_PRECISION_EXP);
	}
	const totalEarningsString = totalEarnings.toNotional();

	const roi =
		(totalEarnings
			.mul(PERCENTAGE_PRECISION)
			.div(
				BigNum.max(
					userTotalDepositsBigNum,
					BigNum.from(ONE, QUOTE_PRECISION_EXP)
				)
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
		QUOTE_PRECISION_EXP
	);
	const highWaterMark = BigNum.from(
		vaultDepositorAccData?.cumulativeProfitShareAmount,
		QUOTE_PRECISION_EXP
	);
	const highWaterMarkWithCurrentDeposit = highWaterMark
		.add(userTotalDepositsBigNum)
		.sub(userTotalWithdrawsBigNum);

	return (
		<div className={'relative flex flex-col gap-8'}>
			<FadeInDiv>
				<SectionHeader className="mb-9">Summary</SectionHeader>
				<div className="flex items-center justify-center w-full gap-4">
					<StatsBox
						label="Your Balance"
						value={showUserInfo ? userAccountValueString : '--'}
					/>
					<div className="h-12 border-r border-container-border" />
					<StatsBox
						label="Total Earnings (All Time)"
						value={showUserInfo ? totalEarningsString : '--'}
					/>
				</div>
			</FadeInDiv>
			<FadeInDiv delay={100}>
				<SectionHeader className="mb-4">Performance Breakdown</SectionHeader>
				<div className="flex flex-col gap-2">
					<BreakdownRow
						label="Total Earnings (All Time)"
						value={totalEarningsString}
					/>
					<BreakdownRow
						label="Your Cumulative Net Deposits"
						value={netDepositsString}
					/>
					<BreakdownRow
						label="Your Balance"
						value={showUserInfo ? userAccountValueString : '--'}
					/>
					<BreakdownRow label="ROI" value={`${roi.toFixed(4)}%`} />
					<BreakdownRow
						label="Vault Share"
						value={`${Number(
							(userSharesProportion * 100).toFixed(
								VAULT_SHARES_PRECISION_EXP.toNumber() - 2
							)
						)}%`}
					/>
					<BreakdownRow
						label="Max Daily Drawdown"
						value={`${(maxDailyDrawdown * 100).toFixed(2)}%`}
					/>
				</div>
			</FadeInDiv>
			<FadeInDiv delay={200}>
				<SectionHeader className="mb-4">Fees Breakdown</SectionHeader>
				<div className="flex flex-col gap-2">
					<BreakdownRow
						label="Profit Share Fees Paid"
						value={profitShareFeePaid.toNotional()}
					/>
					<BreakdownRow
						label="High-Water Mark"
						value={highWaterMarkWithCurrentDeposit.toNotional()}
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
