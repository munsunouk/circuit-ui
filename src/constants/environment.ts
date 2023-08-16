import { DriftEnv, MainnetSpotMarkets, Wallet } from '@drift-labs/sdk';
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

export const OrderedSpotMarkets = [...MainnetSpotMarkets].sort(
	(a, b) => a.marketIndex - b.marketIndex
);

export default Env;
