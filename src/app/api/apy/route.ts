import { DriftHistoryServerClient } from '@/drift-history/client';
import { SerializedDepositHistory } from '@/types';
import { BigNum, PublicKey, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import { calcModifiedDietz } from '@drift-labs/vaults-sdk';

import { SPOT_MARKETS_LOOKUP } from '@/constants/environment';
import { SUPERCHARGER_VAULT_PUBKEY } from '@/constants/vaults/supercharger';
import { TURBOCHARGER_VAULT } from '@/constants/vaults/turbocharger';

import { setupClients } from '../_utils';

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

const { driftClient, vaultClient } = setupClients();

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
	const vaultsEquityBigNum = vaultsEquity.map((e) =>
		BigNum.from(e, QUOTE_PRECISION_EXP)
	);

	// calculate each vault's apy using modified dietz formula
	const vaultsApy = VAULTS.map((v, i) => {
		const { apy } = calcModifiedDietz(
			vaultsEquityBigNum[i],
			SPOT_MARKETS_LOOKUP[depositHistories[i][0].marketIndex].precisionExp,
			depositHistories[i]
		);

		return (apy * 100).toFixed(2);
	});

	return Response.json({ data: vaultsApy });
}
