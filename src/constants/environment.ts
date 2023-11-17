import { DriftEnv, Wallet, initialize } from '@drift-labs/sdk';
import {
	Config as CommonConfig,
	EnvironmentConstants,
	Initialize as InitializeCommon,
	USDC_SPOT_MARKET_INDEX,
} from '@drift/common';
import { Keypair } from '@solana/web3.js';

export const ARBITRARY_WALLET = new Wallet(new Keypair());

const driftEnv =
	process.env.NEXT_PUBLIC_DRIFT_ENV === 'mainnet-beta'
		? 'mainnet-beta'
		: ('devnet' as DriftEnv);

initialize({ env: driftEnv });
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
export const SPOT_MARKETS_LOOKUP = CommonConfig.spotMarketsLookup;
export const USDC_MARKET = SPOT_MARKETS_LOOKUP[USDC_SPOT_MARKET_INDEX];

// Perp markets
export const PERP_MARKETS_LOOKUP = CommonConfig.perpMarketsLookup;

export default Env;
