import {
	BulkAccountLoader,
	DRIFT_PROGRAM_ID,
	DriftClient,
	DriftClientConfig,
	PublicKey,
	getMarketsAndOraclesForSubscription,
} from '@drift-labs/sdk';
import { getVaultClient } from '@drift-labs/vaults-sdk';
import { COMMON_UI_UTILS } from '@drift/common';
import { Connection } from '@solana/web3.js';

import Env from './src/constants/environment';

/**
 * Sets up DriftClient and VaultClient for use in API routes.
 */
export const setupClients = () => {
	const connection = new Connection(process.env.API_RPC_URL!, Env.commitment);
	const dummyWallet = COMMON_UI_UTILS.createThrowawayIWallet();

	const accountLoader = new BulkAccountLoader(connection, Env.commitment, 0); // we don't want to poll for updates

	const { oracleInfos, perpMarketIndexes, spotMarketIndexes } =
		getMarketsAndOraclesForSubscription(Env.driftEnv);
	const vaultDriftClientConfig: DriftClientConfig = {
		connection: connection,
		wallet: dummyWallet,
		programID: new PublicKey(DRIFT_PROGRAM_ID),
		env: Env.driftEnv,
		txVersion: 0,
		userStats: false,
		perpMarketIndexes: perpMarketIndexes,
		spotMarketIndexes: spotMarketIndexes,
		oracleInfos: oracleInfos,
		accountSubscription: {
			type: 'polling',
			accountLoader: accountLoader,
		},
	};

	const driftClient = new DriftClient(vaultDriftClientConfig);

	const vaultClient = getVaultClient(connection, dummyWallet, driftClient);

	return {
		driftClient,
		vaultClient,
		connection,
		accountLoader,
	};
};
