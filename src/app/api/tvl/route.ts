import { BigNum, PublicKey, QUOTE_PRECISION_EXP, ZERO } from '@drift-labs/sdk';

import { VAULTS } from '@/constants/vaults';

import { setupClients } from '../_utils';

export const revalidate = 60;

const { driftClient, vaultClient } = setupClients();

export const GET = async () => {
	await driftClient.subscribe();

	const vaultsEquity = await Promise.all(
		VAULTS.filter((v) => !!v.pubkeyString).map((v) =>
			vaultClient.calculateVaultEquity({
				address: new PublicKey(v.pubkeyString!),
			})
		)
	);

	const combinedVaultsEquity = vaultsEquity.reduce(
		(acc, equity) => acc.add(equity),
		ZERO
	);

	const circuitNotionalTvl = BigNum.from(
		combinedVaultsEquity,
		QUOTE_PRECISION_EXP
	).toNum();

	return Response.json(circuitNotionalTvl, {
		headers: {
			'Access-Control-Allow-Origin': '*',
		},
	});
};
