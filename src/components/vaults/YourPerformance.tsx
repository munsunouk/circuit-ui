import { BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import { VAULT_SHARES_PRECISION_EXP } from '@drift-labs/vaults-sdk';
import { useWallet } from '@solana/wallet-adapter-react';
import { twMerge } from 'tailwind-merge';

import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';
import useCurrentVaultDepositorAccData from '@/hooks/useCurrentVaultDepositorAccData';
import { useCurrentVaultStats } from '@/hooks/useVaultStats';

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

const BUFFER = 0.01 * 10 ** QUOTE_PRECISION_EXP;

export default function YourPerformance() {
	const { connected } = useWallet();
	const vaultDepositorAccData = useCurrentVaultDepositorAccData();
	const vaultAccountData = useCurrentVaultAccountData();
	const vaultStats = useCurrentVaultStats();

	// User's vault share proportion
	const totalVaultShares = vaultAccountData?.totalShares.toNumber();
	const userVaultShares = vaultDepositorAccData?.vaultShares.toNumber();
	const userSharesProportion = userVaultShares / totalVaultShares || 0;

	// User's net deposits
	const userNetDeposits = vaultDepositorAccData?.netDeposits.toNumber();
	const userNetDepositsString = BigNum.from(
		userNetDeposits,
		QUOTE_PRECISION_EXP
	).toNotional();

	// User's total earnings
	const userTotalDeposits = vaultDepositorAccData?.totalDeposits.toNumber();
	const userTotalWithdraws = vaultDepositorAccData?.totalWithdraws.toNumber();
	const vaultAccountBalance = vaultStats.totalAccountValue.toNumber();
	const userAccountBalanceProportion =
		vaultAccountBalance * userSharesProportion;
	let totalEarnings =
		userTotalWithdraws - userTotalDeposits + userAccountBalanceProportion;

	// prevent $-0.00
	if (totalEarnings < 0 && totalEarnings > -BUFFER) {
		totalEarnings = 0;
	}

	const totalEarningsString = BigNum.from(
		totalEarnings,
		QUOTE_PRECISION_EXP
	).toNotional();

	return (
		<div className={'relative flex flex-col gap-8 md:gap-16'}>
			<FadeInDiv>
				<SectionHeader className="mb-9">Summary</SectionHeader>
				<div className="flex items-center justify-center w-full gap-4">
					<StatsBox
						label="Your Deposit"
						value={connected ? userNetDepositsString : '--'}
					/>
					<div className="h-12 border-r border-container-border" />
					<StatsBox
						label="Total Earnings (All Time)"
						value={connected ? totalEarningsString : '--'}
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
					<BreakdownRow label="Your Deposits" value={userNetDepositsString} />
					<BreakdownRow
						label="Vault Share"
						value={`${Number(
							(userSharesProportion * 100).toFixed(
								VAULT_SHARES_PRECISION_EXP.toNumber() - 2
							)
						)}%`}
					/>
					<BreakdownRow label="Max Daily Drawdown" value="-3.41%" />
				</div>
			</FadeInDiv>
			<FadeInDiv delay={200}>
				<TransactionHistory />
			</FadeInDiv>
			{!connected && (
				<>
					<div className="absolute inset-0 flex flex-col items-center backdrop-blur-sm">
						<ConnectButton className="max-w-[400px] mt-60 h-auto " />
					</div>
				</>
			)}
		</div>
	);
}
