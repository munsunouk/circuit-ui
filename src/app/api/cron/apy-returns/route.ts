import { BN, BigNum, PublicKey, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import { calcModifiedDietz } from '@drift-labs/vaults-sdk';
import { kv } from '@vercel/kv';
import { and, eq, or } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { SPOT_MARKETS_LOOKUP } from '@/constants/environment';
import { VAULTS } from '@/constants/vaults';

import { db } from '../../../../../database/connect';
import { vault_depositor_records } from '../../../../../database/schema';
import { getHistoricalPriceFromPyth } from '../../../../../scripts/tasks/utils';
import { setupClients } from '../../../../../utils';
import { RedisKeyManager } from '../../_redis';

/** NextJS route handler configs */
export const dynamic = 'force-dynamic'; // defaults to auto

const FORMATTED_VAULTS = VAULTS.filter((vault) => !!vault.pubkeyString).map(
	(vault) => ({
		vault: new PublicKey(vault.pubkeyString!),
		user: new PublicKey(vault.userPubKey),
	})
);

const { driftClient, vaultClient } = setupClients();

const fetchVaultDepositHistory = async (vault: PublicKey) => {
	const history = await db
		.select({
			ts: vault_depositor_records.ts,
			amount: vault_depositor_records.amount,
			marketIndex: vault_depositor_records.spotMarketIndex,
			direction: vault_depositor_records.action,
		})
		.from(vault_depositor_records)
		.where(
			and(
				eq(vault_depositor_records.vault, vault.toString()),
				or(
					eq(vault_depositor_records.action, 'deposit'),
					eq(vault_depositor_records.action, 'withdraw')
				)
			)
		);

	return history.sort((a, b) => +b.ts - +a.ts) as {
		ts: string;
		amount: string;
		marketIndex: number;
		direction: 'deposit' | 'withdraw';
	}[];
};

const getVaultBaseValue = async (
	vaultQuoteValue: BigNum,
	marketIndex: number,
	precisionExp: BN
) => {
	const oraclePrice = await getHistoricalPriceFromPyth(
		Math.round(Date.now() / 1000) - 30, // give a 30 seconds buffer else the oracle price may not be available yet
		marketIndex
	);

	const vaultBaseValue = vaultQuoteValue
		.shift(oraclePrice.precision)
		.div(oraclePrice)
		.shiftTo(precisionExp);

	return vaultBaseValue;
};

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get('authorization');
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response('Unauthorized', {
			status: 401,
		});
	}

	// start of fetching and calculating apy & returns
	await driftClient.subscribe();

	// fetch deposit history for each vault
	const depositHistories = await Promise.all(
		FORMATTED_VAULTS.map((v) => fetchVaultDepositHistory(v.vault))
	);

	// get each vault's tvl base value
	const vaultsEquityQuoteValue = await Promise.all(
		FORMATTED_VAULTS.map((v) =>
			vaultClient.calculateVaultEquity({ address: v.vault })
		)
	);
	const vaultsQuoteValueBigNum = vaultsEquityQuoteValue.map((e) =>
		BigNum.from(e, QUOTE_PRECISION_EXP)
	);
	const vaultsBaseValueBigNum = await Promise.all(
		vaultsQuoteValueBigNum.map((v, i) =>
			getVaultBaseValue(
				v,
				depositHistories[i][0].marketIndex,
				SPOT_MARKETS_LOOKUP[depositHistories[i][0].marketIndex].precisionExp
			)
		)
	);

	// calculate each vault's apy using modified dietz formula
	const vaultsApyAndReturns = FORMATTED_VAULTS.reduce(
		(acc, v, i) => {
			const { apy, returns } = calcModifiedDietz(
				vaultsBaseValueBigNum[i],
				SPOT_MARKETS_LOOKUP[depositHistories[i][0].marketIndex].precisionExp,
				depositHistories[i]
			);

			const apyAfterFees = apy * (1 - VAULTS[i].feesFraction);

			acc[v.vault.toString()] = { apy: apyAfterFees, returns };

			return acc;
		},
		{} as Record<string, { apy: number; returns: number }>
	);

	const value = {
		vaults: vaultsApyAndReturns,
		ts: Date.now(),
	};

	// save into redis cache
	const apyReturnsKey = RedisKeyManager.getApyReturnsKey();
	await kv.hset(apyReturnsKey, value);

	return Response.json({ data: value });
}
