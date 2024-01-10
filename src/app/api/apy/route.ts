import { DriftHistoryServerClient } from '@/drift-history/client';
import { SerializedDepositHistory } from '@/types';
import {
	BigNum,
	BulkAccountLoader,
	DRIFT_PROGRAM_ID,
	DriftClient,
	DriftClientConfig,
	PublicKey,
	QUOTE_PRECISION_EXP,
	getMarketsAndOraclesForSubscription,
} from '@drift-labs/sdk';
import { getVaultClient } from '@drift-labs/vaults-sdk';
import { COMMON_UI_UTILS } from '@drift/common';
import { Connection } from '@solana/web3.js';

import { getModifiedDietzApy } from '@/utils/vaults';

import Env from '@/constants/environment';
import { SUPERCHARGER_VAULT_PUBKEY } from '@/constants/vaults/supercharger';
import { TURBOCHARGER_VAULT } from '@/constants/vaults/turbocharger';

/** NextJS route handler configs */
export const revalidate = 60;
export const dynamic = 'force-dynamic'; // defaults to auto

const SUPERCHARGER_VAULT_USER = new PublicKey(
	'BRksHqLiq2gvQw1XxsZq6DXZjD3GB5a9J63tUBgd6QS9'
);
const TURBOCHARGER_VAULT_USER = new PublicKey(
	'2aMcirYcF9W8aTFem6qe8QtvfQ22SLY6KUe6yUQbqfHk'
);

const VAULTS = [
	{
		vault: new PublicKey(SUPERCHARGER_VAULT_PUBKEY),
		user: SUPERCHARGER_VAULT_USER,
	},
	{
		vault: new PublicKey(TURBOCHARGER_VAULT.pubkeyString!),
		user: TURBOCHARGER_VAULT_USER,
	},
];

const connection = new Connection(process.env.API_RPC_URL!, 'processed');
const dummyWallet = COMMON_UI_UTILS.createThrowawayIWallet();

const accountLoader = new BulkAccountLoader(connection, 'processed', 1000);

const { oracleInfos, perpMarketIndexes, spotMarketIndexes } =
	getMarketsAndOraclesForSubscription(Env.driftEnv);
const vaultDriftClientConfig: DriftClientConfig = {
	connection: connection,
	wallet: dummyWallet,
	programID: new PublicKey(DRIFT_PROGRAM_ID),
	env: Env.driftEnv,
	txVersion: 0,
	userStats: true,
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

export async function GET() {
	await driftClient.subscribe();

	const res = await DriftHistoryServerClient.fetchUserAccountsDepositHistory(
		false,
		...VAULTS.map((v) => v.user)
	);
	if (!res.success || !res.data) return Response.json({ error: res.message });
	const depositHistories = res.data.records as SerializedDepositHistory[][];

	// get each vault's tvl base value
	const vaultsEquity = await Promise.all(
		VAULTS.map((v) => vaultClient.calculateVaultEquity({ address: v.vault }))
	);
	const vaultsEquityNotionalValue = vaultsEquity.map((e) =>
		BigNum.from(e, QUOTE_PRECISION_EXP).toNum()
	);

	// calculate each vault's apy using modified dietz formula
	const vaultsApy = VAULTS.map((v, i) => {
		const apyBps = getModifiedDietzApy(
			vaultsEquityNotionalValue[i],
			depositHistories[i]
		);

		return (apyBps * 100).toFixed(2);
	});

	return Response.json({ data: vaultsApy });
}
