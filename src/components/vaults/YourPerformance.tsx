import { useWallet } from '@solana/wallet-adapter-react';
import { twMerge } from 'tailwind-merge';

import { ExternalLink } from '@/components/icons';

import { sourceCodePro } from '@/constants/fonts';

import SectionHeader from '../SectionHeader';
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
				<BreakdownRow label="Your Deposits" value="$0.00" />
				<BreakdownRow label="Vault Share" value="36.88%" />
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
			<div className="flex items-center self-start gap-3 px-4 py-2 border border-container-border-light">
				<span>View Vault Activity on Drift</span>
				<ExternalLink />
			</div>
		</div>
	);
}
