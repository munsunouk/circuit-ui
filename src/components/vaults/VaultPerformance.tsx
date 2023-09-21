import { SnapshotKey } from '@/types';
import {
	BN,
	BigNum,
	ONE,
	PERCENTAGE_PRECISION,
	QUOTE_PRECISION_EXP,
} from '@drift-labs/sdk';
import { HistoryResolution } from '@drift/common';
import dayjs from 'dayjs';
import { useState } from 'react';

import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';
import { useCurrentVault } from '@/hooks/useVault';
import { useCurrentVaultStats } from '@/hooks/useVaultStats';

import { getMaxDailyDrawdown, getModifiedDietzApy } from '@/utils/vaults';

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
	days: number;
}

const PERFORMANCE_GRAPH_OPTIONS: PerformanceGraphOption[] = [
	{
		label: '7 Days',
		value: HistoryResolution.WEEK, // every 12 hours
		days: 7,
	},
	{
		label: '30 Days',
		value: HistoryResolution.MONTH, // every day
		days: 30,
	},
	{
		label: 'All',
		value: HistoryResolution.ALL,
		days: 0,
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
		label: 'P&L',
		value: GraphView.PnL,
		snapshotAttribute: 'allTimeTotalPnl',
	},
	{
		label: 'Vault Balance',
		value: GraphView.VaultBalance,
		snapshotAttribute: 'totalAccountValue',
	},
];

export default function VaultPerformance() {
	const vault = useCurrentVault();
	const vaultAccountData = useCurrentVaultAccountData();
	const vaultStats = useCurrentVaultStats();

	const [selectedGraphOption, setSelectedGraphOption] = useState(
		PERFORMANCE_GRAPH_OPTIONS[0]
	);
	const [graphView, setGraphView] = useState(GRAPH_VIEW_OPTIONS[0]);

	const totalEarnings = vaultStats.allTimeTotalPnlWithHistory;
	const allTimePnlHistory =
		vault?.pnlHistory.dailyAllTimePnls
			.map((pnl) => ({
				totalAccountValue: pnl.totalAccountValue,
				allTimeTotalPnl: pnl.allTimeTotalPnl,
				epochTs: pnl.epochTs,
			}))
			.concat({
				totalAccountValue:
					vaultStats.totalAccountValueWithHistory.toNumber() +
					vaultStats.totalAccountValue.toNumber(),
				allTimeTotalPnl: vaultStats.allTimeTotalPnlWithHistory.toNumber(),
				epochTs: dayjs().unix(),
			}) ?? [];

	const formattedPnlHistory = allTimePnlHistory.map((snapshot) => ({
		x: snapshot.epochTs,
		y: snapshot[graphView.snapshotAttribute],
	}));

	const displayedPnlHistory = formattedPnlHistory.slice(
		-1 * selectedGraphOption.days
	);

	const totalAccountValueBigNum = BigNum.from(
		vaultStats.totalAccountValueWithHistory,
		QUOTE_PRECISION_EXP
	);
	const netDepositsBigNum = BigNum.from(
		vaultStats.netDepositsWithHistory,
		QUOTE_PRECISION_EXP
	);

	const cumulativeReturnsPct = totalAccountValueBigNum
		.sub(netDepositsBigNum)
		.mul(PERCENTAGE_PRECISION)
		.div(BN.max(netDepositsBigNum.val, ONE))
		.toNum();

	const historicalApy = getModifiedDietzApy(
		BigNum.from(vaultStats.totalAccountValue, QUOTE_PRECISION_EXP).toNum(),
		vault?.vaultDeposits ?? []
	);
	const maxDailyDrawdown = getMaxDailyDrawdown(allTimePnlHistory);

	return (
		<div className="flex flex-col w-full gap-8">
			<FadeInDiv className="flex flex-col w-full gap-4">
				<SectionHeader>Performance Breakdown</SectionHeader>
				<div className="flex flex-col w-full gap-1 md:gap-2">
					<BreakdownRow
						label="Total Earnings (All Time)"
						value={BigNum.from(totalEarnings, QUOTE_PRECISION_EXP).toNotional()}
					/>
					<BreakdownRow
						label="Cumulative Return"
						value={`${(cumulativeReturnsPct * 100).toFixed(2)}%`}
					/>
					<BreakdownRow
						label="APY"
						value={`${(
							(isNaN(historicalApy) ? 0 : historicalApy) * 100
						).toFixed(2)}%`}
					/>
					<BreakdownRow
						label="Max Daily Drawdown"
						value={`${(maxDailyDrawdown * 100).toFixed(2)}%`}
					/>
				</div>
			</FadeInDiv>

			<FadeInDiv className="flex flex-col gap-4" delay={100}>
				<SectionHeader>Cumulative Performance</SectionHeader>
				<div className="flex justify-between w-full">
					<ButtonTabs
						tabs={GRAPH_VIEW_OPTIONS.map((option) => ({
							label: option.label,
							selected: graphView.value === option.value,
							onSelect: () => setGraphView(option),
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
					{(displayedPnlHistory.length ?? 0) > 0 && (
						<PerformanceGraph data={displayedPnlHistory} />
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
