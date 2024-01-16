import { DriftHistoryServerClient } from '@/clients/drift-history-server';
import { useGetAssetPriceHistory } from '@/stores/assetPriceHistory/useFetchAssetPriceHistory';
import { SnapshotKey } from '@/types';
import { useOraclePriceStore } from '@drift-labs/react';
import {
	BN,
	BigNum,
	PERCENTAGE_PRECISION,
	PRICE_PRECISION,
	PRICE_PRECISION_EXP,
	QUOTE_PRECISION_EXP,
	ZERO,
} from '@drift-labs/sdk';
import {
	HistoryResolution,
	MarketId,
	UISerializableDepositRecord,
} from '@drift/common';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';
import { useCurrentVault } from '@/hooks/useVault';
import useVaultApyAndCumReturns from '@/hooks/useVaultApyAndCumReturns';
import { useCurrentVaultStats } from '@/hooks/useVaultStats';

import {
	displayAssetValue as displayAssetValueBase,
	getAssetPriceFromClosestTs,
	getBasePnlHistoryFromVaultDeposits,
} from '@/utils/utils';
import {
	getMaxDailyDrawdown,
	getMaxDailyDrawdownFromAccValue,
	getSimpleHistoricalApy,
} from '@/utils/vaults';

import { USDC_MARKET } from '@/constants/environment';
import { sourceCodePro } from '@/constants/fonts';
import { VAULTS } from '@/constants/vaults';

import SectionHeader from '../SectionHeader';
import ButtonTabs from '../elements/ButtonTabs';
import Dropdown, { Option } from '../elements/Dropdown';
import FadeInDiv from '../elements/FadeInDiv';
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
	totalEarningsQuote: BigNum;
	cumulativeReturnsPct: number;
	apy: number;
	maxDailyDrawdown: number;
};
const DEFAULT_DISPLAYED_DATA = {
	totalEarnings: BigNum.zero(),
	totalEarningsQuote: BigNum.zero(),
	cumulativeReturnsPct: 0,
	apy: 0,
	maxDailyDrawdown: 0,
};

const NOW_TS = dayjs().unix();

export default function VaultPerformance() {
	const vault = useCurrentVault();
	const vaultAccountData = useCurrentVaultAccountData();
	const vaultStats = useCurrentVaultStats();
	const { getMarketPriceData } = useOraclePriceStore();

	const [selectedGraphOption, setSelectedGraphOption] = useState(
		PERFORMANCE_GRAPH_OPTIONS[0]
	);
	const [graphView, setGraphView] = useState(GRAPH_VIEW_OPTIONS[0]);

	const [displayedData, setDisplayedData] = useState<DisplayedData>(
		DEFAULT_DISPLAYED_DATA
	);
	const [displayedGraph, setDisplayedGraph] = useState<
		{
			x: number;
			y: number;
		}[]
	>([]);
	const [vaultTotalDepositsHistory, setVaultTotalDepositsHistory] = useState<
		UISerializableDepositRecord[]
	>([]);
	const apyAndCumReturn = useVaultApyAndCumReturns(
		vaultAccountData?.pubkey.toString()
	);

	const uiVaultConfig = VAULTS.find(
		(v) => v.pubkeyString === vaultAccountData?.pubkey.toString()
	);
	const spotMarketConfig = uiVaultConfig?.market ?? USDC_MARKET;
	const basePrecisionExp = spotMarketConfig.precisionExp;

	const overallTimelineOptions: Option[] = [
		{ label: 'Current', value: OverallTimeline.Current },
	];
	if (uiVaultConfig?.pastPerformanceHistory)
		overallTimelineOptions.push({
			label: uiVaultConfig.historyType ?? 'Historical',
			value: OverallTimeline.Historical,
		});

	const [selectedTimelineOption, setSelectedTimelineOption] = useState(
		overallTimelineOptions[0]
	);

	const earliestTs =
		uiVaultConfig?.pastPerformanceHistory?.[0]?.epochTs ??
		vault?.pnlHistory.dailyAllTimePnls?.[0]?.epochTs ??
		NOW_TS;

	const { assetPriceHistory, loading: assetPriceHistoryLoading } =
		useGetAssetPriceHistory(spotMarketConfig.marketIndex, earliestTs);

	const allTimeQuotePnlHistory = useMemo(
		() =>
			vault?.pnlHistory.dailyAllTimePnls
				.map((pnl) => ({
					totalAccountValue: pnl.totalAccountValue,
					allTimeTotalPnl: pnl.allTimeTotalPnl,
					epochTs: pnl.epochTs,
				}))
				.concat({
					totalAccountValue: vaultStats.totalAccountQuoteValue.toNumber(),
					allTimeTotalPnl: vaultStats.allTimeTotalPnlQuoteValue.toNumber(),
					epochTs: NOW_TS,
				}) ?? [],
		[vault?.pnlHistory.dailyAllTimePnls, vaultStats]
	);

	const vaultUserStats = vault?.vaultDriftClient.userStats?.getAccount();
	const makerVol30Day = vaultUserStats?.makerVolume30D ?? ZERO;
	const takerVol30Day = vaultUserStats?.takerVolume30D ?? ZERO;
	const totalVol30Day = makerVol30Day.add(takerVol30Day);

	const currentAssetPrice =
		getMarketPriceData(MarketId.createSpotMarket(spotMarketConfig.marketIndex))
			?.priceData.price ?? 0;
	const currentAssetPriceBigNum = BigNum.fromPrint(
		currentAssetPrice.toString(),
		PRICE_PRECISION_EXP
	);

	const loading = !vaultStats.isLoaded;

	const basePnlHistory = useMemo(() => {
		if (!vaultAccountData || vaultTotalDepositsHistory.length === 0) return [];

		return getBasePnlHistoryFromVaultDeposits(
			vaultAccountData,
			vaultTotalDepositsHistory,
			allTimeQuotePnlHistory,
			assetPriceHistory
		);
	}, [
		vaultAccountData,
		vaultTotalDepositsHistory,
		allTimeQuotePnlHistory,
		assetPriceHistory,
	]);

	useEffect(() => {
		if (!vaultAccountData?.user) return;

		DriftHistoryServerClient.fetchUserAccountsDepositHistory(
			true,
			vaultAccountData.user
		).then((res) => {
			if (!res.success) return;

			const depositRecords = (res.data?.records[0] ??
				[]) as UISerializableDepositRecord[];
			depositRecords.reverse(); // we want the earliest deposit to be first
			setVaultTotalDepositsHistory(depositRecords);
		});
	}, [vaultAccountData?.user?.toString()]);

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
		basePnlHistory,
	]);

	const getDisplayedDataForHistorical = (): DisplayedData => {
		if (!uiVaultConfig?.pastPerformanceHistory) return DEFAULT_DISPLAYED_DATA;

		const lastHistoryData = uiVaultConfig.pastPerformanceHistory.slice(-1)[0];
		const firstHistoryData = uiVaultConfig.pastPerformanceHistory[0];

		const totalEarnings = lastHistoryData.allTimeTotalPnl;
		const totalEarningsQuote = totalEarnings
			.shiftTo(PRICE_PRECISION_EXP)
			.mul(currentAssetPriceBigNum);

		const cumulativeReturnsPct = totalEarnings
			.mul(PERCENTAGE_PRECISION)
			.mul(new BN(100))
			.div(lastHistoryData.netDeposits)
			.toNum();

		const apy = getSimpleHistoricalApy(
			lastHistoryData.netDeposits.toNumber() /
				spotMarketConfig.precision.toNumber(),
			lastHistoryData.totalAccountValue.toNum(),
			firstHistoryData.epochTs,
			lastHistoryData.epochTs
		);

		const maxDailyDrawdown = getMaxDailyDrawdownFromAccValue(
			uiVaultConfig.pastPerformanceHistory.map((history) => ({
				...history,
				totalAccountValue: history.totalAccountValue.toNum(),
			})) ?? []
		);

		return {
			totalEarnings,
			totalEarningsQuote,
			cumulativeReturnsPct,
			apy,
			maxDailyDrawdown,
		};
	};

	const getDisplayedGraphForHistorical = () => {
		const isUsdcMarket =
			spotMarketConfig.marketIndex === USDC_MARKET.marketIndex;
		if (
			!uiVaultConfig?.pastPerformanceHistory ||
			(assetPriceHistoryLoading && !isUsdcMarket)
		)
			return [];

		const data = uiVaultConfig.pastPerformanceHistory.map((history) => ({
			x: history.epochTs,
			y: history[graphView.snapshotAttribute] // historical data is initially already in base value, whereas current data is in quote value
				.mul(spotMarketConfig.precision)
				.toNum(),
		}));

		return data;
	};

	const getDisplayedDataForCurrent = (): DisplayedData => {
		const totalEarnings = BigNum.from(
			vaultStats.allTimeTotalPnlBaseValue,
			basePrecisionExp
		);
		const totalEarningsQuote = totalEarnings
			.shiftTo(PRICE_PRECISION_EXP)
			.mul(currentAssetPriceBigNum);

		const { apy, cumReturns: cumulativeReturnsPct } = apyAndCumReturn;
		const maxDailyDrawdown = getMaxDailyDrawdown(
			vault?.pnlHistory.dailyAllTimePnls ?? []
		);

		return {
			totalEarnings,
			totalEarningsQuote,
			cumulativeReturnsPct,
			apy,
			maxDailyDrawdown,
		};
	};

	const getDisplayedGraphForCurrent = () => {
		const isUsdcMarket =
			vaultAccountData?.spotMarketIndex === USDC_MARKET.marketIndex;

		if (assetPriceHistoryLoading && !isUsdcMarket) return [];

		const startTs = selectedGraphOption.days
			? dayjs().subtract(selectedGraphOption.days, 'day').unix()
			: 0;

		if (graphView.value === GraphView.VaultBalance || isUsdcMarket) {
			const quoteData = allTimeQuotePnlHistory
				.map((snapshot) => ({
					epochTs: snapshot.epochTs,
					quoteValue: snapshot[graphView.snapshotAttribute],
				}))
				.filter((snapshot) => snapshot.quoteValue !== undefined)
				.filter((snapshot) => snapshot.epochTs >= startTs)
				.map((snapshot) => ({
					epochTs: snapshot.epochTs,
					quoteValue: BigNum.fromPrint(
						snapshot.quoteValue.toString(),
						QUOTE_PRECISION_EXP
					),
				}));

			const baseAssetQuotePrice =
				getMarketPriceData(
					MarketId.createSpotMarket(spotMarketConfig.marketIndex)
				)?.priceData.price ?? 1;

			const baseData = quoteData.map((history, index) => {
				let priceOfAssetAtTime = isUsdcMarket
					? 1
					: getAssetPriceFromClosestTs(assetPriceHistory, history.epochTs)
							.price;

				if (index === quoteData.length - 1) {
					// we want the last data point to be the current oracle price and not the CoinGecko price, so as to match the earnings display
					// however for some reason, the division in useVaultStats appears to give a result slightly off the expected result, hence there
					// will still be discrepancies between the graph and the earnings display
					priceOfAssetAtTime = baseAssetQuotePrice;
				}

				return {
					x: history.epochTs,
					y: history.quoteValue
						.div(
							BigNum.fromPrint(
								priceOfAssetAtTime.toString(),
								PRICE_PRECISION_EXP
							)
						)
						.scale(spotMarketConfig.precision, PRICE_PRECISION)
						.toNum(),
				};
			});

			return baseData;
		}

		// PnL graph for non-USDC market requires special calculations
		if (graphView.value === GraphView.PnL) {
			return basePnlHistory
				.slice(0, -1) // remove last element as it is the current day and we want to sync with the earnings display
				.filter((pnl) => pnl.epochTs >= startTs)
				.map((pnl) => ({
					x: pnl.epochTs,
					y: pnl.pnl,
				}))
				.concat({
					x: NOW_TS,
					y: vaultStats.allTimeTotalPnlBaseValue.toNumber(), // add current day metric
				});
		}

		return [];
	};

	const displayAssetValue = (value: BigNum) =>
		displayAssetValueBase(value, spotMarketConfig.marketIndex ?? 0, true);

	return (
		<div className="flex flex-col w-full gap-8">
			<FadeInDiv className="flex flex-col w-full gap-4">
				<div className="flex items-center justify-between">
					<SectionHeader>Performance Breakdown</SectionHeader>
					{overallTimelineOptions.length > 1 && (
						<Dropdown
							options={overallTimelineOptions}
							selectedOption={selectedTimelineOption}
							setSelectedOption={setSelectedTimelineOption}
							width={120}
						/>
					)}
				</div>

				<div className="flex flex-col w-full gap-1 md:gap-2">
					<BreakdownRow
						label="Total Earnings (All Time)"
						value={displayAssetValue(displayedData.totalEarnings)}
						tooltip={{
							id: 'notional-earnings-tooltip',
							content: (
								<span className={twMerge(sourceCodePro.className)}>
									{displayedData.totalEarningsQuote.toNotional()}
								</span>
							),
							hide: spotMarketConfig.marketIndex === USDC_MARKET.marketIndex,
						}}
						loading={loading}
					/>
					<BreakdownRow
						label="Cumulative Return"
						value={`${displayedData.cumulativeReturnsPct.toFixed(2)}%`}
						loading={loading}
					/>
					<BreakdownRow
						label="APY"
						value={`${
							uiVaultConfig?.temporaryApy
								? uiVaultConfig.temporaryApy
								: displayedData.apy.toFixed(2)
						}%`}
						loading={loading}
					/>
					<BreakdownRow
						label="Max Daily Drawdown"
						value={`${(displayedData.maxDailyDrawdown * 100).toFixed(2)}%`}
						loading={loading}
					/>
					{selectedTimelineOption.value === OverallTimeline.Current && (
						<BreakdownRow
							label="30D Volume"
							value={`${BigNum.from(
								totalVol30Day,
								QUOTE_PRECISION_EXP
							).toNotional()}`}
							loading={loading}
						/>
					)}
				</div>
			</FadeInDiv>

			<FadeInDiv className="flex flex-col gap-4" delay={100}>
				<SectionHeader>Cumulative Performance</SectionHeader>
				<div className="flex justify-between w-full">
					<ButtonTabs
						tabs={GRAPH_VIEW_OPTIONS.map((option) => ({
							key: option.label,
							label: option.label,
							selected: graphView.value === option.value,
							onSelect: () => setGraphView(option),
						}))}
						tabClassName="whitespace-nowrap px-4 py-2"
					/>
					{selectedTimelineOption.value === OverallTimeline.Current && (
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
					)}
				</div>
				<div className="w-full h-[320px]">
					{!!displayedGraph?.length && (
						<div>
							<PerformanceGraph
								data={displayedGraph}
								marketIndex={spotMarketConfig.marketIndex}
								isPnl={graphView.value === GraphView.PnL}
							/>
							<div className="text-xs text-right text-gray-600">
								Powered by Coingecko
							</div>
						</div>
					)}
				</div>
			</FadeInDiv>
		</div>
	);
}
