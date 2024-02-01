import { SpotMarketConfig } from '@drift-labs/sdk';

import {
	JITOSOL_MARKET,
	JUP_MARKET,
	SOL_MARKET,
	USDC_MARKET,
	WBTC_MARKET,
	WETH_MARKET,
} from './environment';

export type Asset = {
	market: SpotMarketConfig;
	borderColor: string;
	coingeckoId: string;
};

export const USDC_DEPOSIT_ASSET: Asset = {
	market: USDC_MARKET,
	borderColor: 'var(--main-blue)',
	coingeckoId: 'usd-coin',
};
export const SOL_DEPOSIT_ASSET: Asset = {
	market: SOL_MARKET,
	borderColor: '#9840DE',
	coingeckoId: 'solana',
};
export const JITOSOL_DEPOSIT_ASSET: Asset = {
	market: JITOSOL_MARKET,
	borderColor: '#AFE9B8',
	coingeckoId: 'jito-staked-sol',
};
export const WETH_DEPOSIT_ASSET: Asset = {
	market: WETH_MARKET,
	borderColor: '#CFADF2',
	coingeckoId: 'ethereum',
};
export const WBTC_DEPOSIT_ASSET: Asset = {
	market: WBTC_MARKET,
	borderColor: '#F7931A',
	coingeckoId: 'bitcoin',
};
export const JUP_DEPOSIT_ASSET: Asset = {
	market: JUP_MARKET,
	borderColor: '#AFE9B8',
	coingeckoId: 'jupiter-exchange-solana',
};

export const ASSETS = [
	USDC_DEPOSIT_ASSET,
	JITOSOL_DEPOSIT_ASSET,
	WETH_DEPOSIT_ASSET,
	WBTC_DEPOSIT_ASSET,
];
