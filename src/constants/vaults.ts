import { PerformanceGraphData } from '@/types';

import {
	SUPERCHARGER_PAST_DATA,
	SUPERCHARGER_VAULT_PUBKEY,
} from './supercharger';

export interface OverviewSection {
	title: string;
	paragraphs: ({ title?: string; className?: string } & (
		| { text: string; isDynamic?: false }
		| { text: string[]; isDynamic: true }
	))[]; // allows for placeholders to be replaced with dynamic values
}

export const FEES_PLACEHOLDER = '{fees_placeholder}';
export const PERIOD_PLACEHOLDER = '{period_placeholder}';

export interface UiVaultConfig {
	name: string;
	pubkeyString?: string;
	description: string;
	comingSoon?: boolean;
	permissioned?: boolean;
	previewBackdropUrl: string;
	backdropParticlesColor: string;
	pastPerformanceHistory?: PerformanceGraphData[];
	vaultOverview?: OverviewSection[];
}

export const SUPERCHARGER_VAULT: UiVaultConfig = {
	name: 'Supercharger',
	pubkeyString: SUPERCHARGER_VAULT_PUBKEY,
	description:
		'Multiply your yields with delta-neutral market making strategies',
	permissioned: true,
	previewBackdropUrl: '/backdrops/supercharger-backdrop.svg',
	backdropParticlesColor: '#88c9ff',
	pastPerformanceHistory: SUPERCHARGER_PAST_DATA,
	vaultOverview: [
		{
			title: 'Strategy',
			paragraphs: [
				{
					text: 'Supercharger vault employs a delta-neutral market making and liquidity provision strategy, primarily on Drift perpetual swaps. The strategy edge is in advanced volatility and inventory management models and a superior on-chain infrastructure setup.',
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
					text: 'Supercharger vault is exposed to volatility risk because rapid and large price movements can impact its ability to buy or sell instrument at desired prices. High volatility can widen bid-ask spreads, reducing profitability for the vault.',
				},
				{
					title: 'Counterparty Risk',
					text: 'Supercharger vault faces counterparty risk when dealing with other market participants. If vault enters into trades with a counterparty and the counterparty fails to fulfill their obligations, such as failing to deliver securities or make payment, the market maker may suffer financial losses.',
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

export const VAULTS: UiVaultConfig[] = [
	SUPERCHARGER_VAULT,
	{
		name: 'Turbocharger',
		// pubkey: new PublicKey('2bXtK9phuqUbqsmonWCNYcV87DkFmqyRiDqGen4daZwx'),
		description: 'Delta-neutral market making strategy',
		comingSoon: true,
		previewBackdropUrl: '/backdrops/turbocharger-backdrop.svg',
		backdropParticlesColor: '#3DBC9D',
	},
	{
		name: 'Delta Neutral DLP',
		// pubkey: new PublicKey('B4LBd4DEKZZLvkn7eazUf7xU9RuTpvxH4th18VgVzMpB'),
		description: 'Hedged Drift Liquidity Provider (DLP) strategy',
		comingSoon: true,
		previewBackdropUrl: '/backdrops/hedged-dlp-backdrop.svg',
		backdropParticlesColor: '#88c9ff',
	},
];
