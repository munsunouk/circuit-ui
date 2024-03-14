import { AppSetupProps } from '@drift-labs/react';
import { DriftEnv, PublicKey, Wallet, initialize } from '@drift-labs/sdk';
import {
	Config as CommonConfig,
	EnvironmentConstants,
	Initialize as InitializeCommon,
	USDC_SPOT_MARKET_INDEX,
} from '@drift/common';
import { Commitment, Keypair } from '@solana/web3.js';

export const ARBITRARY_WALLET = new Wallet(new Keypair());

const driftEnv =
	process.env.NEXT_PUBLIC_DRIFT_ENV === 'mainnet-beta'
		? 'mainnet-beta'
		: ('devnet' as DriftEnv);

initialize({ env: driftEnv });
InitializeCommon(driftEnv);

interface EnvironmentVariables extends AppSetupProps {
	driftEnv: DriftEnv;
	nextEnv: string | undefined;
	isDev: boolean | undefined;
	basePollingRateMs: number;
	rpcOverride: string | undefined;
	historyServerUrl: string;
	commitment: Commitment;
	priorityFee: {
		targetPercentile: number;
		maxFeeInSol: number;
	};
}

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
	commitment: (process.env.COMMITMENT ?? 'confirmed') as Commitment,
	priorityFeePollingMultiplier: 5,
	priorityFee: {
		targetPercentile: 0.5,
		maxFeeInSol: 1,
	},
};

CommonConfig.spotMarketsLookup[6].symbol = 'JitoSOL';

// Spot markets
export const SPOT_MARKETS_LOOKUP = CommonConfig.spotMarketsLookup;
export const USDC_MARKET = SPOT_MARKETS_LOOKUP[USDC_SPOT_MARKET_INDEX];
export const SOL_MARKET = SPOT_MARKETS_LOOKUP[1];
export const WBTC_MARKET = SPOT_MARKETS_LOOKUP[3];
export const WETH_MARKET = SPOT_MARKETS_LOOKUP[4];
export const JITOSOL_MARKET = SPOT_MARKETS_LOOKUP[6];
export const JUP_MARKET = SPOT_MARKETS_LOOKUP[11];

// Perp markets
export const PERP_MARKETS_LOOKUP = CommonConfig.perpMarketsLookup;

// APIs
export const DEFAULT_DEDUPING_INTERVAL = 2000;

export const PYTH_PROGRAM_ID = new PublicKey(
	'FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH'
);

export const MARKET_INDEX_TO_PYTH_SYMBOL_MAP: {
	[marketIndex: number]: string;
} = {
	0: 'Crypto.USDC/USD',
	1: 'Crypto.SOL/USD',
	2: 'Crypto.MSOL/USD',
	3: 'Crypto.BTC/USD',
	4: 'Crypto.ETH/USD',
	5: 'Crypto.USDT/USD',
	6: 'Crypto.JITOSOL/USD',
	7: 'Crypto.PYTH/USD',
	8: 'Crypto.BSOL/USD',
	9: 'Crypto.JTO/USD',
	10: 'Crypto.WIF/USD',
	11: 'Crypto.JUP/USD',
	12: 'Crypto.RNDR/USD',
};

export const CIRCUIT_TXN_COMPUTE_UNITS_LIMIT_ESTIMATE = 750_000;

export const RPC_LIST =
	driftEnv === 'mainnet-beta'
		? EnvironmentConstants.rpcs.mainnet
		: EnvironmentConstants.rpcs.dev;

export default Env;
