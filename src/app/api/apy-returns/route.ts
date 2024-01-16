import { DriftHistoryServerClient } from '@/drift-history/client';
import { SerializedDepositHistory } from '@/types';
import { BigNum, PublicKey, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import { calcModifiedDietz } from '@drift-labs/vaults-sdk';
import { kv } from '@vercel/kv';

import { SPOT_MARKETS_LOOKUP } from '@/constants/environment';
import { VAULTS } from '@/constants/vaults';

import { RedisKeyManager } from '../_redis';
import { setupClients } from '../_utils';

/** NextJS route handler configs */
export const revalidate = 60;
export const dynamic = 'force-dynamic'; // defaults to auto

const FORMATTED_VAULTS = VAULTS.filter((vault) => !!vault.pubkeyString).map(
	(vault) => ({
		vault: new PublicKey(vault.pubkeyString!),
		user: new PublicKey(vault.userPubKey),
	})
);

const { driftClient, vaultClient } = setupClients();

export async function GET() {
	const apyReturnsKey = RedisKeyManager.getApyReturnsKey(Date.now());

	// check redis cache for apy returns first
	const cachedApyReturns = await kv.hgetall(apyReturnsKey);

	if (cachedApyReturns) {
		return Response.json({ data: cachedApyReturns });
	}

	// start of fetching and calculating apy & returns
	await driftClient.subscribe();

	// fetch deposit history for each vault
	const res = await DriftHistoryServerClient.fetchUserAccountsDepositHistory(
		false,
		...FORMATTED_VAULTS.map((v) => v.user)
	);
	if (!res.success || !res.data) return Response.json({ error: res.message });
	const depositHistories = res.data.records as SerializedDepositHistory[][];

	// get each vault's tvl base value
	const vaultsEquity = await Promise.all(
		FORMATTED_VAULTS.map((v) =>
			vaultClient.calculateVaultEquity({ address: v.vault })
		)
	);
	const vaultsEquityBigNum = vaultsEquity.map((e) =>
		BigNum.from(e, QUOTE_PRECISION_EXP)
	);

	// calculate each vault's apy using modified dietz formula
	const vaultsApyAndReturns = FORMATTED_VAULTS.reduce(
		(acc, v, i) => {
			const { apy, returns } = calcModifiedDietz(
				vaultsEquityBigNum[i],
				SPOT_MARKETS_LOOKUP[depositHistories[i][0].marketIndex].precisionExp,
				depositHistories[i]
			);

			acc[v.vault.toString()] = { apy, returns };

			return acc;
		},
		{} as Record<string, { apy: number; returns: number }>
	);

	// save into redis cache
	await kv.hset(apyReturnsKey, vaultsApyAndReturns);
	await kv.expire(apyReturnsKey, revalidate * 2);

	return Response.json({ data: vaultsApyAndReturns });
}
