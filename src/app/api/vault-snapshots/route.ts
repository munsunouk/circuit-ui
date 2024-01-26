import { asc, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '../../../../database/connect';
import { vault_snapshots } from '../../../../database/schema';

export const GET = async (request: NextRequest) => {
	const searchParams = request.nextUrl.searchParams;

	const vault = searchParams.get('vault');

	if (!vault) {
		return Response.json({
			error: 'vault is required in the query params',
		});
	}

	const vaultSnapshots = await db
		.select({
			ts: vault_snapshots.ts,
			slot: vault_snapshots.slot,
			oraclePrice: vault_snapshots.oraclePrice,
			totalAccountQuoteValue: vault_snapshots.totalAccountQuoteValue,
			totalAccountBaseValue: vault_snapshots.totalAccountBaseValue,
			netDeposits: vault_snapshots.netDeposits,
		})
		.from(vault_snapshots)
		.where(eq(vault_snapshots.vault, vault))
		.orderBy(asc(vault_snapshots.slot));

	return Response.json(vaultSnapshots);
};
