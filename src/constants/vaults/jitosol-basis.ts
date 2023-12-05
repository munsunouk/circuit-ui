import { PerformanceGraphData, UiVaultConfig } from '@/types';
import { BigNum } from '@drift-labs/sdk';
import dayjs from 'dayjs';

import { normalizeDate } from '@/utils/utils';

import { JITOSOL_DEPOSIT_ASSET } from '../assets';
import { JITOSOL_MARKET } from '../environment';

const JITOSOL_BASIS_BACKTEST_RAW_DATA = [
	{
		datetime: '2023-10-23 00:00:00',
		totalAccountValue: 20000.0,
	},
	{
		datetime: '2023-10-24 00:00:00',
		totalAccountValue: 20000.26130866741,
	},
	{
		datetime: '2023-10-25 00:00:00',
		totalAccountValue: 20000.72546541461,
	},
	{
		datetime: '2023-10-26 00:00:00',
		totalAccountValue: 20000.836313677864,
	},
	{
		datetime: '2023-10-27 00:00:00',
		totalAccountValue: 20000.79741397345,
	},
	{
		datetime: '2023-10-28 00:00:00',
		totalAccountValue: 20002.484987694257,
	},
	{
		datetime: '2023-10-29 00:00:00',
		totalAccountValue: 20009.771251291084,
	},
	{
		datetime: '2023-10-30 00:00:00',
		totalAccountValue: 20018.37538983102,
	},
	{
		datetime: '2023-10-31 00:00:00',
		totalAccountValue: 20031.974399887506,
	},
	{
		datetime: '2023-11-01 00:00:00',
		totalAccountValue: 20045.980881467734,
	},
	{
		datetime: '2023-11-02 00:00:00',
		totalAccountValue: 20041.94397447557,
	},
	{
		datetime: '2023-11-03 00:00:00',
		totalAccountValue: 20051.125804744,
	},
	{
		datetime: '2023-11-04 00:00:00',
		totalAccountValue: 20064.242696957142,
	},
	{
		datetime: '2023-11-05 00:00:00',
		totalAccountValue: 20115.198237233493,
	},
	{
		datetime: '2023-11-06 00:00:00',
		totalAccountValue: 20143.934343254816,
	},
	{
		datetime: '2023-11-07 00:00:00',
		totalAccountValue: 20167.856825446244,
	},
	{
		datetime: '2023-11-08 00:00:00',
		totalAccountValue: 20191.614391917403,
	},
	{
		datetime: '2023-11-09 00:00:00',
		totalAccountValue: 20226.21987027694,
	},
	{
		datetime: '2023-11-10 00:00:00',
		totalAccountValue: 20254.26518083021,
	},
	{
		datetime: '2023-11-11 00:00:00',
		totalAccountValue: 20272.58904293788,
	},
	{
		datetime: '2023-11-12 00:00:00',
		totalAccountValue: 20289.272048707557,
	},
	{
		datetime: '2023-11-13 00:00:00',
		totalAccountValue: 20313.068258754058,
	},
	{
		datetime: '2023-11-14 00:00:00',
		totalAccountValue: 20337.862000831497,
	},
	{
		datetime: '2023-11-16 00:00:00',
		totalAccountValue: 20353.900431320304,
	},
	{
		datetime: '2023-11-17 00:00:00',
		totalAccountValue: 20378.91289117254,
	},
	{
		datetime: '2023-11-18 00:00:00',
		totalAccountValue: 20382.125701612367,
	},
	{
		datetime: '2023-11-19 00:00:00',
		totalAccountValue: 20401.26369344084,
	},
	{
		datetime: '2023-11-20 00:00:00',
		totalAccountValue: 20441.69554567444,
	},
	{
		datetime: '2023-11-21 00:00:00',
		totalAccountValue: 20439.97090921314,
	},
	{
		datetime: '2023-11-22 00:00:00',
		totalAccountValue: 20445.078396699904,
	},
];

const INITIAL_DEPOSIT = BigNum.fromPrint(
	JITOSOL_BASIS_BACKTEST_RAW_DATA[0].totalAccountValue.toString(),
	JITOSOL_MARKET.precisionExp
);

export const JITOSOL_BASIS_BACKTEST_DATA: PerformanceGraphData[] =
	JITOSOL_BASIS_BACKTEST_RAW_DATA.map((data) => {
		return {
			epochTs: normalizeDate(dayjs(data.datetime).unix()),
			allTimeTotalPnl: BigNum.fromPrint(
				(
					data.totalAccountValue -
					// assumes no deposits/withdrawals
					INITIAL_DEPOSIT.toNum()
				).toString(),
				JITOSOL_MARKET.precisionExp
			),
			totalAccountValue: BigNum.fromPrint(
				data.totalAccountValue.toString(),
				JITOSOL_MARKET.precisionExp
			),
			netDeposits: INITIAL_DEPOSIT.val,
		};
	});

export const JITOSOL_BASIS_VAULT_PUBKEY =
	'ACmnVY5gf1z9UGhzBgnr2bf3h2ZwXW2EDW1w8RC9cQk4';

export const JITOSOL_BASIS_VAULT: UiVaultConfig = {
	name: 'JitoSOL Basis Vault',
	pubkeyString: JITOSOL_BASIS_VAULT_PUBKEY,
	description: 'Basis trading strategy for JitoSOL',
	previewBackdropUrl: '/backdrops/turbocharger-backdrop.svg',
	backdropParticlesColor: '#3DBC9D',
	market: JITOSOL_DEPOSIT_ASSET.market,
	assetColor: JITOSOL_DEPOSIT_ASSET.borderColor,
	pastPerformanceHistory: JITOSOL_BASIS_BACKTEST_DATA,
	historyType: 'Backtest',
	vaultOverview: [
		{
			title: 'Description',
			paragraphs: [
				{
					text: 'Basis trading, also known as “cash and carry”, is a delta-neutral arbitrage strategy that effectively captures the premium between futures contracts and the underlying spot pair. This strategy is denominated in JitoSOL, meaning that returns will be calculated in JitoSOL (versus USDC). Any profits or losses will be denominated in the underlying currency (JitoSOL). ',
				},
				{
					text: 'The strategy takes in JitoSOL as collateral, borrows 1x additional SOL to maintain exposure to SOL and hedges out the delta by going 1x short SOL-PERP on Drift. As long as the funding rate (the premium between the perp contract and spot) remains positive, the strategy will continue to stay short. If funding is flat or negative for a sustained period (>5 days), the strategy will unwind its short hedge. The strategy actively scales in and out of its basis position based on market conditions, capitalizing on volatility and outperforming merely holding the basis position.',
				},
				{
					text: 'If the funding rate for SOL-PERP remains positive, the basis trading strategy should be profitable and any trader who is short continues to receive hourly funding payments. However, when the funding rate turns negative, any trader that holds a short position will start paying (instead of receiving) funding payments and the basis trade will be closed out and the short position will be closed.',
				},
			],
		},
	],
};
