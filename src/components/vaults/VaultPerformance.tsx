import { BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import {
	HistoryResolution,
	UISerializableAccountSnapshot,
} from '@drift/common';
import { useState } from 'react';

import useCurrentVault from '@/hooks/useCurrentVault';
import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';
import { useCurrentVaultStats } from '@/hooks/useVaultStats';

import { normalizeDate } from '@/utils/utils';

import SectionHeader from '../SectionHeader';
import Button from '../elements/Button';
import Dropdown from '../elements/Dropdown';
import FadeInDiv from '../elements/FadeInDiv';
import { ExternalLink } from '../icons';
import BreakdownRow from './BreakdownRow';
import PerformanceGraph from './PerformanceGraph';

const PERFORMANCE_GRAPH_OPTIONS = [
	{
		label: '7 Days',
		value: HistoryResolution.WEEK, // every 12 hours
	},
	{
		label: '30 Days',
		value: HistoryResolution.MONTH, // every day
	},
	{
		label: 'All',
		value: HistoryResolution.ALL, // < 3 months = every 2 days | < 6 months = every 3 days | < 1 year = every 2 weeks | > 1 year = every month
	},
];

export default function VaultPerformance() {
	const vault = useCurrentVault();
	const vaultAccountData = useCurrentVaultAccountData();
	const vaultStats = useCurrentVaultStats();

	const [selectedGraphOption, setSelectedGraphOption] = useState(
		PERFORMANCE_GRAPH_OPTIONS[0]
	);

	const totalEarnings = vaultStats.totalAllTimePnl;

	const formatPnlHistory = (
		pnlHistory: UISerializableAccountSnapshot[],
		resolution: HistoryResolution
	) => {
		const formattedHistory = pnlHistory
			.map((snapshot) => ({
				x: snapshot.epochTs,
				// @ts-ignore - snapshot response was not deserialized, hence its default form is already a number
				y: Number(snapshot.allTimeTotalPnl),
			}))
			.concat({
				x: Date.now() / 1000,
				y: vaultStats.totalAllTimePnl.toNumber(),
			})
			.map((point) => ({
				...point,
				x: normalizeDate(point.x, resolution), // normalize to start of day so that the graph looks consistent
			}));

		return formattedHistory;
	};

	return (
		<div className="flex flex-col w-full gap-8">
			<FadeInDiv className="flex flex-col w-full gap-4">
				<SectionHeader>Performance Breakdown</SectionHeader>
				<div className="flex flex-col w-full gap-1 md:gap-2">
					<BreakdownRow
						label="Total Earnings (All Time)"
						value={BigNum.from(totalEarnings, QUOTE_PRECISION_EXP).toNotional()}
					/>
					<BreakdownRow label="Cumulative Return" value="$0.00" />
					<BreakdownRow label="Max Daily Drawdown" value="$0.00" />
				</div>
			</FadeInDiv>

			<FadeInDiv className="flex flex-col gap-4" delay={100}>
				<SectionHeader>Cumulative Performance</SectionHeader>
				<div className="flex justify-end w-full">
					<Dropdown
						options={PERFORMANCE_GRAPH_OPTIONS}
						selectedOption={selectedGraphOption}
						setSelectedOption={setSelectedGraphOption}
						width={120}
					/>
				</div>
				<div className="w-full h-[320px]">
					{(vault?.pnlHistory[HistoryResolution.ALL].length ?? 0) > 0 && (
						<PerformanceGraph
							data={formatPnlHistory(
								vault?.pnlHistory[selectedGraphOption.value] ?? [],
								selectedGraphOption.value
							)}
						/>
					)}
				</div>
			</FadeInDiv>

			<FadeInDiv delay={200}>
				<SectionHeader className="mb-4">Vault Activity</SectionHeader>
				<div>
					View this Vault’s activity from open positions, recent trades, to open
					orders any time. In the Overview page, you can download the activity
					history for your records.
				</div>
			</FadeInDiv>
			<FadeInDiv delay={200}>
				<a
					href={`https://app.drift.trade/?authority=${vaultAccountData?.pubkey.toString()}`}
					target="_blank"
					rel="noopener noreferrer"
				>
					<Button secondary Icon={ExternalLink}>
						View Vault Activity on Drift
					</Button>
				</a>
			</FadeInDiv>
		</div>
	);
}
