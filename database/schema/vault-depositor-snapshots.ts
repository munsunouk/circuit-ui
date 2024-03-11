import { InferSelectModel } from 'drizzle-orm';
import { index, integer, pgTable, serial } from 'drizzle-orm/pg-core';

import { createBNField, createPubkeyField } from '../utils';

/**
 * This table stores snapshots of vault depositors.
 *
 */

export const vault_depositor_snapshots = pgTable(
	'vault_depositor_snapshots',
	{
		// metadata
		id: serial('id').primaryKey(),
		ts: createBNField('ts').notNull(),
		slot: integer('slot').notNull(),

		// extra information
		oraclePrice: createBNField('oraclePrice'),
		totalAccountQuoteValue: createBNField('totalAccountQuoteValue'),
		totalAccountBaseValue: createBNField('totalAccountBaseValue'),

		// important vault account data
		vault: createPubkeyField('vault').notNull(),
		vaultDepositor: createPubkeyField('vaultDepositor').notNull(),
		authority: createPubkeyField('authority').notNull(),

		vaultShares: createBNField('vaultShares').notNull(),
		lastWithdrawRequestShares: createBNField('lastWithdrawRequestShares'),
		lastWithdrawRequestValue: createBNField('lastWithdrawRequestValue'),
		lastWithdrawRequestTs: createBNField('lastWithdrawRequestTs'),
		lastValidTs: createBNField('lastValidTs'),
		netDeposits: createBNField('netDeposits'),
		totalDeposits: createBNField('totalDeposits'),
		totalWithdraws: createBNField('totalWithdraws'),
		cumulativeProfitShareAmount: createBNField('cumulativeProfitShareAmount'),
		vaultSharesBase: integer('vaultSharesBase'),
		profitShareFeePaid: createBNField('profitShareFeePaid'),
	},
	(t) => {
		return {
			vaultIdx: index('vd_snapshot_vaultIdx').on(t.vault),
			authorityIdx: index('vd_snapshot_authorityIdx').on(t.authority),
			slotSortIdx: index('vd_snapshot_slotSortIdx').on(t.slot),
		};
	}
);

export type SerializedVaultDepositorSnapshot = InferSelectModel<
	typeof vault_depositor_snapshots
>;
