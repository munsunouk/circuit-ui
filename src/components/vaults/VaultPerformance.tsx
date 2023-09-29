import { SnapshotKey } from '@/types';
import {
	BN,
	BigNum,
	ONE,
	PERCENTAGE_PRECISION,
	PERCENTAGE_PRECISION_EXP,
	QUOTE_PRECISION_EXP,
} from '@drift-labs/sdk';
import { HistoryResolution } from '@drift/common';
import dayjs from 'dayjs';
import { useState } from 'react';

import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';
import { useCurrentVault } from '@/hooks/useVault';
import { useCurrentVaultStats } from '@/hooks/useVaultStats';

import {
	combineHistoricalApy,
	getMaxDailyDrawdown,
	getModifiedDietzApy,
} from '@/utils/vaults';

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

	const uiVaultConfig = VAULTS.find(
		(v) => v.pubkeyString === vaultAccountData?.pubkey.toString()
	);

	const totalEarnings = vaultStats.allTimeTotalPnlWithHistory;
	const allTimePnlHistory =
		vault?.pnlHistory.dailyAllTimePnls
			.map((pnl) => ({
				totalAccountValue: pnl.totalAccountValue,
				allTimeTotalPnl: pnl.allTimeTotalPnl,
				epochTs: pnl.epochTs,
			}))
			.concat({
				totalAccountValue: vaultStats.totalAccountValue.toNumber(),
				allTimeTotalPnl: vaultStats.allTimeTotalPnlWithHistory.toNumber(),
				epochTs: dayjs().unix(),
			}) ?? [];

	const formattedPnlHistory = allTimePnlHistory
		.map((snapshot) => ({
			x: snapshot.epochTs,
			y: snapshot[graphView.snapshotAttribute],
		}))
		.filter((snapshot) => snapshot.y !== undefined) as {
		x: number;
		y: number;
	}[];

	const displayedPnlHistory = formattedPnlHistory.slice(
		-1 * selectedGraphOption.days
	);

	const totalAccountValueBigNum = BigNum.from(
		vaultStats.totalAccountValue,
		QUOTE_PRECISION_EXP
	);
	const netDepositsBigNum = BigNum.from(
		vaultAccountData?.netDeposits,
		QUOTE_PRECISION_EXP
	);

	const cumulativeReturnsPct = totalAccountValueBigNum
		.sub(netDepositsBigNum)
		.mul(PERCENTAGE_PRECISION)
		.div(BN.max(netDepositsBigNum.val, ONE));

	// to get combined cumulative returns pct, current cumulative returns pct * historical cumulative returns pct
	// needs to be e.g. 1.08 * 1.45 instead of 0.08 * 0.45, and then subtract 1 at the end
	const cumulativeReturnsPctWithHistory = BigNum.from(
		cumulativeReturnsPct.val
			.add(PERCENTAGE_PRECISION)
			.mul(vaultStats.historicalCumulativeReturnsPct.add(PERCENTAGE_PRECISION))
			.div(PERCENTAGE_PRECISION)
			.sub(PERCENTAGE_PRECISION),
		PERCENTAGE_PRECISION_EXP
	);

	const currentApy = getModifiedDietzApy(
		BigNum.from(vaultStats.totalAccountValue, QUOTE_PRECISION_EXP).toNum(),
		vault?.vaultDeposits ?? []
	);
	const combinedHistoricalApy = uiVaultConfig?.pastPerformanceHistory
		? combineHistoricalApy(
				{
					initial: uiVaultConfig.pastPerformanceHistory[0].totalAccountValue,
					final:
						uiVaultConfig.pastPerformanceHistory.slice(-1)[0].totalAccountValue,
					numOfDays: dayjs
						.unix(uiVaultConfig?.pastPerformanceHistory.slice(-1)[0].epochTs)
						.diff(
							dayjs.unix(uiVaultConfig?.pastPerformanceHistory[0].epochTs),
							'days'
						),
				},
				{
					apy: currentApy,
					numOfDays: dayjs().diff(
						dayjs.unix(
							uiVaultConfig?.pastPerformanceHistory.slice(-1)[0].epochTs
						),
						'days'
					),
				}
		  )
		: currentApy;

	const vaultMaxDailyDrawdown = getMaxDailyDrawdown(allTimePnlHistory);
	const historicalMaxDailyDrawdown = getMaxDailyDrawdown(
		uiVaultConfig?.pastPerformanceHistory?.map((history) => ({
			...history,
			totalAccountValue: history.totalAccountValue.toNum(),
		})) ?? []
	);
	const maxDailyDrawdown = Math.min(
		vaultMaxDailyDrawdown,
		historicalMaxDailyDrawdown,
		0
	);

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
						value={`${(cumulativeReturnsPctWithHistory.toNum() * 100).toFixed(
							2
						)}%`}
					/>
					<BreakdownRow
						label="APY"
						value={`${(
							(isNaN(combinedHistoricalApy) ? 0 : combinedHistoricalApy) * 100
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
