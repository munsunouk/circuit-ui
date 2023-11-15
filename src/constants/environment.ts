import {
	DriftEnv,
	MainnetSpotMarkets,
	PerpMarketConfig,
	Wallet,
	initialize,
} from '@drift-labs/sdk';
import {
	EnvironmentConstants,
	Initialize as InitializeCommon,
} from '@drift/common';
import { Keypair } from '@solana/web3.js';

export const ARBITRARY_WALLET = new Wallet(new Keypair());
export const USDC_MARKET = MainnetSpotMarkets[0];

const driftEnv =
	process.env.NEXT_PUBLIC_DRIFT_ENV === 'mainnet-beta'
		? 'mainnet-beta'
		: ('devnet' as DriftEnv);

const SDKConfig = initialize({ env: driftEnv });
InitializeCommon(driftEnv);

type EnvironmentVariables = {
	driftEnv: DriftEnv;
	nextEnv: string | undefined;
	isDev: boolean | undefined;
	basePollingRateMs: number;
	rpcOverride: string | undefined;
	historyServerUrl: string;
};

const Env: EnvironmentVariables = {
	driftEnv,
	nextEnv: process.env.NEXT_PUBLIC_ENV,
	isDev:
		!process.env.NEXT_PUBLIC_ENV ||
		['local', 'master', 'devnet'].includes(process.env.NEXT_PUBLIC_ENV),
	basePollingRateMs: process.env.NEXT_PUBLIC_BASE_POLLING_RATE_MS
		? Number(process.env.NEXT_PUBLIC_BASE_POLLING_RATE_MS)
		: 1000,
	rpcOverride: process.env.NEXT_PUBLIC_RPC_OVERRIDE,
	historyServerUrl: process.env.NEXT_PUBLIC_EXCHANGE_HISTORY_SERVER_URL
		? process.env.NEXT_PUBLIC_EXCHANGE_HISTORY_SERVER_URL
		: process.env.NEXT_PUBLIC_DRIFT_ENV === 'mainnet-beta'
		? EnvironmentConstants.historyServerUrl.mainnet
		: EnvironmentConstants.historyServerUrl.dev,
};

// Spot markets
export const CURRENT_SPOT_MARKETS = SDKConfig.SPOT_MARKETS;
export const OrderedSpotMarkets = [...MainnetSpotMarkets].sort(
	(a, b) => a.marketIndex - b.marketIndex
);

// Perp markets
export const CURRENT_PERP_MARKETS = SDKConfig.PERP_MARKETS;
export const PERP_MARKETS_LOOKUP: Array<PerpMarketConfig> = new Array(
	CURRENT_PERP_MARKETS.length
);
CURRENT_PERP_MARKETS.forEach((market) => {
	PERP_MARKETS_LOOKUP[market.marketIndex] = market;
});

export default Env;
