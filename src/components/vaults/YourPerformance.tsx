import { BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import { useWallet } from '@solana/wallet-adapter-react';
import { twMerge } from 'tailwind-merge';

import useCurrentVault from '@/hooks/useCurrentVault';
import useCurrentVaultAccount from '@/hooks/useCurrentVaultAccount';
import useCurrentVaultDepositor from '@/hooks/useCurrentVaultDepositor';
import useCurrentVaultStats from '@/hooks/useCurrentVaultStats';

import { sourceCodePro } from '@/constants/fonts';

import ConnectButton from '../ConnectButton';
import SectionHeader from '../SectionHeader';
import FadeInDiv from '../elements/FadeInDiv';
import BreakdownRow from './BreakdownRow';

const StatsBox = ({ label, value }: { label: string; value: string }) => {
	return (
		<div className="flex flex-col items-center flex-1 gap-1">
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
	const vaultDepositor = useCurrentVaultDepositor();
	const vaultAccount = useCurrentVaultAccount();
	const vaultStats = useCurrentVaultStats();

	// User's vault share proportion
	const totalVaultShares = vaultAccount?.totalShares.toNumber();
	const userVaultShares = vaultDepositor?.vaultShares.toNumber();
	const userSharesProportion = userVaultShares / totalVaultShares || 0;

	// User's net deposits
	const userNetDeposits = vaultDepositor?.netDeposits.toNumber();
	const userNetDepositsString = BigNum.from(
		userNetDeposits,
		QUOTE_PRECISION_EXP
	).toNotional();

	// User's cumulative earnings
	const userTotalDeposits = vaultDepositor?.totalDeposits.toNumber();
	const userTotalWithdraws = vaultDepositor?.totalWithdraws.toNumber();
	const vaultAccountBalance = vaultStats.netUsdValue.toNumber();
	const userAccountBalanceProportion =
		vaultAccountBalance * userSharesProportion;
	let cumulativeEarnings =
		userTotalWithdraws - userTotalDeposits + userAccountBalanceProportion;

	// prevent $-0.00
	if (cumulativeEarnings < 0 && cumulativeEarnings > -BUFFER) {
		cumulativeEarnings = 0;
	}

	const cumulativeEarningsString = BigNum.from(
		cumulativeEarnings,
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
						label="Cumulative Earnings"
						value={connected ? cumulativeEarningsString : '--'}
					/>
				</div>
			</FadeInDiv>
			<FadeInDiv delay={100}>
				<SectionHeader className="mb-4">Performance Breakdown</SectionHeader>
				<div className="flex flex-col gap-2">
					<BreakdownRow
						label="Cumulative Earnings"
						value={cumulativeEarningsString}
					/>
					<BreakdownRow label="Your Deposits" value={userNetDepositsString} />
					<BreakdownRow
						label="Vault Share"
						value={`${Number(userSharesProportion.toFixed(6))}%`}
					/>
					<BreakdownRow label="Max Daily Drawdown" value="-3.41%" />
				</div>
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
