import { UiVaultConfig } from '@/types';

import { USDC_DEPOSIT_ASSET } from '../assets';
import { FEES_PLACEHOLDER, PERIOD_PLACEHOLDER } from '../misc';

export const TURBOCHARGER_VAULT: UiVaultConfig = {
	name: 'Turbocharger',
	pubkeyString: 'F3no8aqNZRSkxvMEARC4feHJfvvrST2ZrHzr2NBVyJUr',
	description:
		'Multiply your yields with delta-neutral market making strategies',
	permissioned: false,
	market: USDC_DEPOSIT_ASSET.market,
	assetColor: USDC_DEPOSIT_ASSET.borderColor,
	previewBackdropUrl: '/backdrops/hedged-dlp-backdrop.svg',
	backdropParticlesColor: '#88c9ff',
	historyType: 'Historical',
	vaultOverview: [
		{
			title: 'Strategy',
			paragraphs: [
				{
					text: 'Turbocharger vault employs market making and liquidity provision strategy, primarily on Drift perpetual swaps for BTC and ETH. The strategy edge is in advanced volatility and inventory management models and a superior on-chain infrastructure setup.',
				},
				{
					text: 'The strategy is built on a smart contract, meaning funds cannot be withdrawn by anyone but you.',
					className: 'text-text-emphasis font-semibold',
				},
			],
		},
		{
			title: 'Risks',
			paragraphs: [
				{
					title: 'Volatility Risk',
					text: 'Turbocharger aims to be delta neutral, but may hold delta in BTC and ETH in the direction against taker flow in markets..',
				},
				{
					title: 'Counterparty Risk',
					text: 'Turbocharger vault faces counterparty risk when dealing with other market participants. If vault enters into trades with a counterparty and the counterparty fails to fulfill their obligations, such as failing to deliver securities or make payment, the market maker may suffer financial losses.',
				},
			],
		},
		{
			title: 'Lock Up Period & Withdrawals',
			paragraphs: [
				{
					text: [
						'Deposited funds are subject to a ',
						PERIOD_PLACEHOLDER,
						' redemption period.',
					],
					isDynamic: true,
				},
				{
					text: 'Withdrawals can be requested at any time. Funds will be made available for withdrawal at the end of the redemption period.',
				},
			],
		},
		{
			title: 'Fees',
			paragraphs: [
				{
					text: ['A performance fee of ', FEES_PLACEHOLDER, '% applies'],
					isDynamic: true,
				},
				{
					text: 'For deposits over $250,000, contact us to learn more about our White Glove service.',
				},
			],
		},
	],
};
