import { BigNum, QUOTE_PRECISION, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import { useWallet } from '@solana/wallet-adapter-react';
import { twMerge } from 'tailwind-merge';

import { ExternalLink } from '@/components/icons';

import useCurrentVault from '@/hooks/useCurrentVault';

import { sourceCodePro } from '@/constants/fonts';

import SectionHeader from '../SectionHeader';
import Button from '../elements/Button';
import BreakdownRow from './BreakdownRow';

const StatsBox = ({ label, value }: { label: string; value: string }) => {
	return (
		<div className="flex flex-col items-center flex-1 gap-1">
			<span
				className={twMerge(
					sourceCodePro.className,
					'text-2xl font-medium text-text-emphasis'
				)}
			>
				${value}
			</span>
			<span className="text-lg">{label}</span>
		</div>
	);
};

export default function YourPerformance() {
	const { connected } = useWallet();
	const vault = useCurrentVault();
	const vaultDepositor = vault?.vaultDepositor;

	if (!vault || !vaultDepositor) return null;

	const totalVaultShares = vault.info.totalShares.toNumber();
	const userVaultShares = vaultDepositor.vaultShares.toNumber();
	const userSharesProportion = userVaultShares / totalVaultShares;

	const userNetDeposits = vaultDepositor.netDeposits.toNumber();
	// const userTotalDeposits = vaultDepositor.totalDeposits.toNumber();

	return (
		<div className="flex flex-col gap-16">
			<div>
				<SectionHeader className="mb-9">Summary</SectionHeader>
				<div className="flex items-center justify-center w-full gap-4">
					<StatsBox
						label="Your Deposit"
						value={connected ? '3,908,758.97' : '--'}
					/>
					<div className="h-12 border-r border-container-border" />
					<StatsBox
						label="Cumulative Earnings"
						value={connected ? '4,863,718.00' : '--'}
					/>
				</div>
			</div>
			<div>
				<SectionHeader className="mb-4">Performance Breakdown</SectionHeader>
				<BreakdownRow label="Cumulative Earnings" value="$0.00" />
				<BreakdownRow
					label="Your Deposits"
					value={BigNum.from(userNetDeposits, QUOTE_PRECISION_EXP).toNotional()}
				/>
				<BreakdownRow
					label="Vault Share"
					value={`${Number(userSharesProportion.toFixed(6))}%`}
				/>
				<BreakdownRow label="Max Daily Drawdown" value="-3.41%" />
			</div>
			<div>
				<SectionHeader className="mb-4">Vault Activity</SectionHeader>
				<div>
					View this Vault’s activity from open positions, recent trades, to open
					orders any time. In the Overview page, you can download the activity
					history for your records.
				</div>
			</div>
			<div>
				<Button secondary Icon={ExternalLink}>
					View Vault Activity on Drift
				</Button>
			</div>
		</div>
	);
}
