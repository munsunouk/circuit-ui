import { SerializedPerformanceHistory, SnapshotKey } from '@/types';
import { BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import {
	HistoryResolution,
	UISerializableAccountSnapshot,
} from '@drift/common';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';
import { useCurrentVault } from '@/hooks/useVault';
import { useCurrentVaultStats } from '@/hooks/useVaultStats';

import { VAULTS } from '@/constants/vaults';

import SectionHeader from '../SectionHeader';
import Button from '../elements/Button';
import ButtonTabs from '../elements/ButtonTabs';
import Dropdown from '../elements/Dropdown';
import FadeInDiv from '../elements/FadeInDiv';
import { ExternalLink } from '../icons';
import BreakdownRow from './BreakdownRow';
import PerformanceGraph from './PerformanceGraph';

interface PerformanceGraphOption {
	label: string;
	value: HistoryResolution;
	firstDate: dayjs.Dayjs;
}

const PERFORMANCE_GRAPH_OPTIONS: PerformanceGraphOption[] = [
	{
		label: '7 Days',
		value: HistoryResolution.WEEK, // every 12 hours
		firstDate: dayjs().subtract(7, 'day').startOf('day'),
	},
	{
		label: '30 Days',
		value: HistoryResolution.MONTH, // every day
		firstDate: dayjs().subtract(30, 'day').startOf('day'),
	},
	{
		label: 'All',
		value: HistoryResolution.ALL, // < 3 months = every 2 days | < 6 months = every 3 days | < 1 year = every 2 weeks | > 1 year = every month
		firstDate: dayjs.unix(0),
	},
];

enum GraphView {
	PnL,
	VaultBalance,
}

const GRAPH_VIEW_OPTIONS: {
	label: string;
	value: GraphView;
	snapshotAttribute: SnapshotKey;
}[] = [
	{
		label: 'Vault Balance',
		value: GraphView.VaultBalance,
		snapshotAttribute: 'totalAccountValue',
	},
	{
		label: 'P&L',
		value: GraphView.PnL,
		snapshotAttribute: 'allTimeTotalPnl',
	},
];

export default function VaultPerformance() {
	const vault = useCurrentVault();
	const vaultAccountData = useCurrentVaultAccountData();
	const vaultStats = useCurrentVaultStats();

	const [selectedGraphOption, setSelectedGraphOption] = useState(
		PERFORMANCE_GRAPH_OPTIONS[0]
	);
	const [graphView, setGraphView] = useState(GraphView.VaultBalance);

	const uiVaultConfig = VAULTS.find(
		(vault) => vault.pubkeyString === vaultAccountData?.pubkey.toString()
	);
	const totalEarnings = vaultStats.allTimeTotalPnlWithHistory;
	const graphData = useMemo(
		() =>
			formatPnlHistory(
				vault?.pnlHistory[selectedGraphOption.value] ?? [],
				GRAPH_VIEW_OPTIONS.find((option) => option.value === graphView)!
					.snapshotAttribute
			),
		[
			selectedGraphOption,
			vault?.pnlHistory,
			graphView,
			vaultStats,
			uiVaultConfig,
		]
	);

	function formatPnlHistory(
		pnlHistory: SerializedPerformanceHistory[],
		snapshotAttribute: keyof Pick<
			UISerializableAccountSnapshot,
			'totalAccountValue' | 'allTimeTotalPnl'
		>
	) {
		return pnlHistory
			.map((snapshot) => ({
				x: snapshot.epochTs,
				y: snapshot[snapshotAttribute],
			}))
			.concat({
				x: dayjs().unix(),
				y: vaultStats[`${snapshotAttribute}WithHistory`].toNumber(),
			});
	}

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
				<div className="flex justify-between w-full">
					<ButtonTabs
						tabs={GRAPH_VIEW_OPTIONS.map((option) => ({
							label: option.label,
							selected: graphView === option.value,
							onSelect: () => setGraphView(option.value),
						}))}
						tabClassName="whitespace-nowrap px-4 py-2"
					/>
					<Dropdown
						options={PERFORMANCE_GRAPH_OPTIONS}
						selectedOption={selectedGraphOption}
						setSelectedOption={
							setSelectedGraphOption as (option: {
								label: string;
								value: HistoryResolution;
							}) => void
						}
						width={120}
					/>
				</div>
				<div className="w-full h-[320px]">
					{(vault?.pnlHistory[HistoryResolution.ALL].length ?? 0) > 0 && (
						<PerformanceGraph data={graphData} />
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
