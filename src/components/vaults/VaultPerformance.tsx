import { useGetAssetPriceHistory } from '@/stores/assetPriceHistory/useFetchAssetPriceHistory';
import { SnapshotKey } from '@/types';
import { useOraclePriceStore } from '@drift-labs/react';
import {
	BN,
	BigNum,
	ONE,
	PERCENTAGE_PRECISION,
	PRICE_PRECISION,
	PRICE_PRECISION_EXP,
	QUOTE_PRECISION_EXP,
	ZERO,
} from '@drift-labs/sdk';
import { HistoryResolution, MarketId } from '@drift/common';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';
import { useCurrentVault } from '@/hooks/useVault';
import { useCurrentVaultStats } from '@/hooks/useVaultStats';

import {
	displayAssetValue as displayAssetValueBase,
	getAssetPriceFromClosestTs,
} from '@/utils/utils';
import {
	getMaxDailyDrawdown,
	getMaxDailyDrawdownFromAccValue,
	getModifiedDietzApy,
	getSimpleHistoricalApy,
} from '@/utils/vaults';

import { USDC_MARKET } from '@/constants/environment';
import { sourceCodePro } from '@/constants/fonts';
import { VAULTS } from '@/constants/vaults';

import SectionHeader from '../SectionHeader';
import Button from '../elements/Button';
import ButtonTabs from '../elements/ButtonTabs';
import Dropdown, { Option } from '../elements/Dropdown';
import FadeInDiv from '../elements/FadeInDiv';
import { ExternalLink } from '../icons';
import BreakdownRow from './BreakdownRow';
import PerformanceGraph from './PerformanceGraph';
import { VaultTable } from './VaultTable/VaultTable';

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

	const allTimePnlHistory =
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
			}) ?? [];
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

		const totalAccountValueBigNum = BigNum.from(
			vaultStats.totalAccountBaseValue,
			basePrecisionExp
		);
		const netDepositsBigNum = BigNum.from(
			vaultAccountData?.netDeposits,
			basePrecisionExp
		);
		const cumulativeReturnsPct =
			totalAccountValueBigNum
				.sub(netDepositsBigNum)
				.mul(PERCENTAGE_PRECISION)
				.div(BN.max(netDepositsBigNum.val, ONE))
				.toNum() * 100;

		const apy = getModifiedDietzApy(
			BigNum.from(vaultStats.totalAccountBaseValue, basePrecisionExp).toNum(),
			vault?.vaultDeposits ?? []
		);

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
			spotMarketConfig.marketIndex === USDC_MARKET.marketIndex;

		if (assetPriceHistoryLoading && !isUsdcMarket) return [];

		const quoteData = allTimePnlHistory
			.map((snapshot) => ({
				epochTs: snapshot.epochTs,
				quoteValue: snapshot[graphView.snapshotAttribute],
			}))
			.filter((snapshot) => snapshot.quoteValue !== undefined)
			.slice(-1 * selectedGraphOption.days)
			.map((snapshot) => ({
				epochTs: snapshot.epochTs,
				quoteValue: BigNum.fromPrint(
					snapshot.quoteValue.toString(),
					QUOTE_PRECISION_EXP
				),
			}));

		const baseAssetQuotePrice = getMarketPriceData(
			MarketId.createSpotMarket(spotMarketConfig.marketIndex)
		).priceData.price;

		const baseData = quoteData.map((history, index) => {
			let priceOfAssetAtTime = isUsdcMarket
				? 1
				: getAssetPriceFromClosestTs(assetPriceHistory, history.epochTs).price;

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
						BigNum.fromPrint(priceOfAssetAtTime.toString(), PRICE_PRECISION_EXP)
					)
					.scale(spotMarketConfig.precision, PRICE_PRECISION)
					.toNum(),
			};
		});

		return baseData;
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
						value={`${(
							(isNaN(displayedData.apy) ? 0 : displayedData.apy) * 100
						).toFixed(2)}%`}
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
						<PerformanceGraph
							data={displayedGraph}
							marketIndex={spotMarketConfig.marketIndex}
							isPnl={graphView.value === GraphView.PnL}
						/>
					)}
				</div>
			</FadeInDiv>

			<FadeInDiv delay={200}>
				<SectionHeader className="mb-4">Vault Details</SectionHeader>
				<VaultTable />
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
