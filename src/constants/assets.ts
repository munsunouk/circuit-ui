import { SpotMarketConfig } from '@drift-labs/sdk';

import { JITOSOL_MARKET, USDC_MARKET, WETH_MARKET } from './environment';

type Asset = {
	market: SpotMarketConfig;
	borderColor: string;
	coingeckoId: string;
};

export const USDC_DEPOSIT_ASSET: Asset = {
	market: USDC_MARKET,
	borderColor: 'var(--main-blue)',
	coingeckoId: 'usd-coin',
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

export const ASSETS = [
	USDC_DEPOSIT_ASSET,
	JITOSOL_DEPOSIT_ASSET,
	WETH_DEPOSIT_ASSET,
];
