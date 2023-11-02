import { SnapshotKey } from '@/types';
import {
	BN,
	BigNum,
	ONE,
	PERCENTAGE_PRECISION,
	QUOTE_PRECISION,
	QUOTE_PRECISION_EXP,
	ZERO,
} from '@drift-labs/sdk';
import { HistoryResolution } from '@drift/common';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';
import { useCurrentVault } from '@/hooks/useVault';
import { useCurrentVaultStats } from '@/hooks/useVaultStats';

import {
	getMaxDailyDrawdown,
	getModifiedDietzApy,
	getSimpleHistoricalApy,
} from '@/utils/vaults';

import { VAULTS } from '@/constants/vaults';

import SectionHeader from '../SectionHeader';
import Button from '../elements/Button';
import ButtonTabs from '../elements/ButtonTabs';
import Dropdown, { Option } from '../elements/Dropdown';
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
		days: 0, // all
	},
];

enum OverallTimeline {
	Current,
	Historical,
}

const OVERALL_TIMELINE_OPTIONS: Option[] = [
	{ label: 'Current', value: OverallTimeline.Current },
	{ label: 'Historical', value: OverallTimeline.Historical },
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

type DisplayedData = {
	totalEarnings: BigNum;
	cumulativeReturnsPct: number;
	apy: number;
	maxDailyDrawdown: number;
};
const DEFAULT_DISPLAYED_DATA = {
	totalEarnings: BigNum.zero(),
	cumulativeReturnsPct: 0,
	apy: 0,
	maxDailyDrawdown: 0,
};

export default function VaultPerformance() {
	const vault = useCurrentVault();
	const vaultAccountData = useCurrentVaultAccountData();
	const vaultStats = useCurrentVaultStats();

	const [selectedGraphOption, setSelectedGraphOption] = useState(
		PERFORMANCE_GRAPH_OPTIONS[0]
	);
	const [graphView, setGraphView] = useState(GRAPH_VIEW_OPTIONS[0]);
	const [selectedTimelineOption, setSelectedTimelineOption] = useState(
		OVERALL_TIMELINE_OPTIONS[0]
	);

	const [displayedData, setDisplayedData] = useState<DisplayedData>(
		DEFAULT_DISPLAYED_DATA
	);
	const [displayedGraph, setDisplayedGraph] = useState<
		{
			x: number;
			y: number;
		}[]
	>([]);

	const uiVaultConfig = VAULTS.find(
		(v) => v.pubkeyString === vaultAccountData?.pubkey.toString()
	);
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
	const vaultUserStats = vault?.vaultDriftClient.userStats?.getAccount();
	const makerVol30Day = vaultUserStats?.makerVolume30D ?? ZERO;
	const takerVol30Day = vaultUserStats?.takerVolume30D ?? ZERO;
	const totalVol30Day = makerVol30Day.add(takerVol30Day);

	useEffect(() => {
		if (!vault || !vaultAccountData || !vaultStats) return;

		if (selectedTimelineOption.value === OverallTimeline.Historical) {
			setDisplayedData(getDisplayedDataForHistorical());
			setDisplayedGraph(getDisplayedGraphForHistorical());
		} else if (selectedTimelineOption.value === OverallTimeline.Current) {
			setDisplayedData(getDisplayedDataForCurrent());
			setDisplayedGraph(getDisplayedGraphForCurrent());
		}
	}, [
		vault,
		vault?.pnlHistory,
		vaultAccountData,
		vaultStats,
		selectedTimelineOption,
		selectedGraphOption,
		graphView,
	]);

	const getDisplayedDataForHistorical = (): DisplayedData => {
		if (!uiVaultConfig?.pastPerformanceHistory) return DEFAULT_DISPLAYED_DATA;

		const lastHistoryData = uiVaultConfig.pastPerformanceHistory.slice(-1)[0];
		const firstHistoryData = uiVaultConfig.pastPerformanceHistory[0];

		const totalEarnings = lastHistoryData.allTimeTotalPnl;
		const cumulativeReturnsPct =
			totalEarnings
				.mul(PERCENTAGE_PRECISION)
				.mul(new BN(100))
				.div(lastHistoryData.netDeposits)
				.toNum() / PERCENTAGE_PRECISION.toNumber();

		const apy = getSimpleHistoricalApy(
			lastHistoryData.netDeposits.toNumber(),
			lastHistoryData.totalAccountValue.toNum(),
			firstHistoryData.epochTs,
			lastHistoryData.epochTs
		);
		const maxDailyDrawdown = getMaxDailyDrawdown(
			uiVaultConfig.pastPerformanceHistory.map((history) => ({
				...history,
				totalAccountValue: history.totalAccountValue.toNum(),
			})) ?? []
		);

		return {
			totalEarnings,
			cumulativeReturnsPct,
			apy,
			maxDailyDrawdown,
		};
	};

	const getDisplayedGraphForHistorical = () => {
		if (!uiVaultConfig?.pastPerformanceHistory) return [];

		return uiVaultConfig.pastPerformanceHistory.map((history) => ({
			x: history.epochTs,
			y: history[graphView.snapshotAttribute].mul(QUOTE_PRECISION).toNum(),
		}));
	};

	const getDisplayedDataForCurrent = (): DisplayedData => {
		const totalEarnings = BigNum.from(
			vaultStats.allTimeTotalPnl,
			QUOTE_PRECISION_EXP
		);

		const totalAccountValueBigNum = BigNum.from(
			vaultStats.totalAccountValue,
			QUOTE_PRECISION_EXP
		);
		const netDepositsBigNum = BigNum.from(
			vaultAccountData?.netDeposits,
			QUOTE_PRECISION_EXP
		);
		const cumulativeReturnsPct =
			totalAccountValueBigNum
				.sub(netDepositsBigNum)
				.mul(PERCENTAGE_PRECISION)
				.div(BN.max(netDepositsBigNum.val, ONE))
				.toNum() * 100;

		const apy = getModifiedDietzApy(
			BigNum.from(vaultStats.totalAccountValue, QUOTE_PRECISION_EXP).toNum(),
			vault?.vaultDeposits ?? []
		);

		const maxDailyDrawdown = getMaxDailyDrawdown(allTimePnlHistory);

		return {
			totalEarnings,
			cumulativeReturnsPct,
			apy,
			maxDailyDrawdown,
		};
	};

	const getDisplayedGraphForCurrent = () => {
		return allTimePnlHistory
			.map((snapshot) => ({
				x: snapshot.epochTs,
				y: snapshot[graphView.snapshotAttribute],
			}))
			.filter((snapshot) => snapshot.y !== undefined)
			.slice(-1 * selectedGraphOption.days) as {
			x: number;
			y: number;
		}[];
	};

	return (
		<div className="flex flex-col w-full gap-8">
			<FadeInDiv className="flex flex-col w-full gap-4">
				<div className="flex items-center justify-between">
					<SectionHeader>Performance Breakdown</SectionHeader>
					<Dropdown
						options={OVERALL_TIMELINE_OPTIONS}
						selectedOption={selectedTimelineOption}
						setSelectedOption={setSelectedTimelineOption}
						width={120}
					/>
				</div>

				<div className="flex flex-col w-full gap-1 md:gap-2">
					<BreakdownRow
						label="Total Earnings (All Time)"
						value={displayedData.totalEarnings.toNotional()}
					/>
					<BreakdownRow
						label="Cumulative Return"
						value={`${displayedData.cumulativeReturnsPct.toFixed(2)}%`}
					/>
					<BreakdownRow
						label="APY"
						value={`${(
							(isNaN(displayedData.apy) ? 0 : displayedData.apy) * 100
						).toFixed(2)}%`}
					/>
					<BreakdownRow
						label="Max Daily Drawdown"
						value={`${(displayedData.maxDailyDrawdown * 100).toFixed(2)}%`}
					/>
					{selectedTimelineOption.value === OverallTimeline.Current && (
						<BreakdownRow
							label="30D Volume"
							value={`${BigNum.from(
								totalVol30Day,
								QUOTE_PRECISION_EXP
							).toNotional()}`}
						/>
					)}
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
					{selectedTimelineOption === OVERALL_TIMELINE_OPTIONS[0] && (
						<Dropdown
							options={
								graphView.value === GraphView.VaultBalance &&
								uiVaultConfig?.pastPerformanceHistory
									? PERFORMANCE_GRAPH_OPTIONS
									: PERFORMANCE_GRAPH_OPTIONS
							}
							selectedOption={selectedGraphOption}
							setSelectedOption={
								setSelectedGraphOption as (option: {
									label: string;
									value: HistoryResolution;
								}) => void
							}
							width={120}
						/>
					)}
				</div>
				<div className="w-full h-[320px]">
					{!!displayedGraph?.length && (
						<PerformanceGraph data={displayedGraph} />
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
