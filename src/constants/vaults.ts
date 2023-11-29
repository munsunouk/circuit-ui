import { PerformanceGraphData } from '@/types';
import { SpotMarketConfig } from '@drift-labs/sdk';

import { JITOSOL_MARKET, USDC_MARKET, WETH_MARKET } from './environment';
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

const USDC_DEPOSIT_ASSET = {
	market: USDC_MARKET,
	borderColor: 'var(--main-blue)',
};
const JITOSOL_DEPOSIT_ASSET = {
	market: JITOSOL_MARKET,
	borderColor: '#AFE9B8',
};
const WETH_DEPOSIT_ASSET = {
	market: WETH_MARKET,
	borderColor: '#CFADF2',
};

export interface UiVaultConfig {
	name: string;
	pubkeyString?: string;
	description: string;
	permissioned?: boolean;
	previewBackdropUrl: string;
	backdropParticlesColor: string;
	pastPerformanceHistory?: PerformanceGraphData[];
	vaultOverview?: OverviewSection[];
	market: SpotMarketConfig;
	assetColor: string; // primarily used for the deposit asset border color
}

const SUPERCHARGER_VAULT: UiVaultConfig = {
	name: 'Supercharger',
	pubkeyString: SUPERCHARGER_VAULT_PUBKEY,
	description:
		'Multiply your yields with delta-neutral market making strategies',
	permissioned: true,
	market: USDC_DEPOSIT_ASSET.market,
	assetColor: USDC_DEPOSIT_ASSET.borderColor,
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

const JITOSOL_BASIS_VAULT = {
	name: 'jitoSOL Basis Vault',
	pubkeyString: 'ACmnVY5gf1z9UGhzBgnr2bf3h2ZwXW2EDW1w8RC9cQk4',
	description: 'Basis trading strategy for jitoSOL',
	previewBackdropUrl: '/backdrops/turbocharger-backdrop.svg',
	backdropParticlesColor: '#3DBC9D',
	market: JITOSOL_DEPOSIT_ASSET.market,
	assetColor: JITOSOL_DEPOSIT_ASSET.borderColor,
};

const WETH_BASIS_VAULT = {
	name: 'wETH Basis Vault',
	pubkeyString: 'DAFeTZdBRmpawFXV61NuVF93ad79d67YEGQGFuWR2LfS',
	description: 'Basis trading strategy for wETH',
	previewBackdropUrl: '/backdrops/hedged-dlp-backdrop.svg',
	backdropParticlesColor: '#88c9ff',
	market: WETH_DEPOSIT_ASSET.market,
	assetColor: WETH_DEPOSIT_ASSET.borderColor,
};

export const VAULTS: UiVaultConfig[] = [
	SUPERCHARGER_VAULT,
	JITOSOL_BASIS_VAULT,
	WETH_BASIS_VAULT,
];

export const DEPOSIT_ASSET_MARKETS = VAULTS.map((v) => v.market);
