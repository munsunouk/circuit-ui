import { SnapshotKey } from '@/types';
import { BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import {
	HistoryResolution,
	UISerializableAccountSnapshot,
} from '@drift/common';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import useCurrentVault from '@/hooks/useCurrentVault';
import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';
import { useCurrentVaultStats } from '@/hooks/useVaultStats';

import { normalizeDate } from '@/utils/utils';

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
	const totalEarnings = vaultStats.allTimeTotalPnl;
	const graphData = useMemo(
		() =>
			formatPnlHistory(
				vault?.pnlHistory[selectedGraphOption.value] ?? [],
				selectedGraphOption,
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
		pnlHistory: Pick<
			UISerializableAccountSnapshot,
			'epochTs' | 'allTimeTotalPnl' | 'totalAccountValue'
		>[],
		graphOption: PerformanceGraphOption,
		snapshotAttribute: keyof Pick<
			UISerializableAccountSnapshot,
			'totalAccountValue' | 'allTimeTotalPnl'
		>
	) {
		const pastVaultHistory = uiVaultConfig?.pastPerformanceHistory ?? [];
		const formattedPastHistory = pastVaultHistory.map((snapshot) => ({
			x: snapshot.epochTs,
			y: snapshot[snapshotAttribute].toNum(),
		}));
		const lastPointInPastHistory = formattedPastHistory[
			formattedPastHistory.length - 1
		] ?? { x: 0, y: 0 };

		const formattedHistory = pnlHistory
			.map((snapshot) => ({
				x: snapshot.epochTs,
				// @ts-ignore - snapshot response was not deserialized, hence its in string format
				y: Number(snapshot[snapshotAttribute]) + lastPointInPastHistory.y,
			}))
			// add current stats to end of graph
			.concat({
				x: Date.now() / 1000,
				y: vaultStats[snapshotAttribute].toNumber() + lastPointInPastHistory.y,
			})
			// normalize to start of day/12h so that the graph looks consistent
			.map((point) => ({
				...point,
				x: normalizeDate(point.x, graphOption.value),
			}))
			// prioritize past history over fetched history if the data overlaps
			.filter((point) =>
				dayjs.unix(point.x).isAfter(dayjs.unix(lastPointInPastHistory.x))
			);

		const combinedHistory = formattedPastHistory.concat(formattedHistory);
		const withinResolutionHistory = combinedHistory.filter((point) =>
			dayjs.unix(point.x).isAfter(graphOption.firstDate)
		);

		return withinResolutionHistory;
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
