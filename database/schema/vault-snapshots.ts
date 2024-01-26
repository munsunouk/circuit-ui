import { InferSelectModel } from 'drizzle-orm';
import { index, integer, pgTable, serial } from 'drizzle-orm/pg-core';

import { createBNField, createPubkeyField } from '../utils';

/**
 * This table stores snapshots of vaults on the hour.
 *
 * However, these snapshots started on 26th Jan 2024, whereas the vaults started way before.
 * The Circuit UI has been dependent on the Drift snapshot data before that, hence we needed to backfill
 * the vaults snapshots from the start of the vaults to fit into this schema. This schema differs
 * from the Drift snapshot schema in that it stores the net deposits (base value), which allows
 * us to calculate both vault balance and P&L at the point of snapshot (especially important for non-USDC
 * deposit vaults).
 *
 * Unfortunately, not all data can be accurately backfilled. Incorrect fields include:
 * - totalWithdrawRequested
 *
 * The reason for the above field is too troublesome to accurately backfill, not essential for historical snapshots.
 *
 * - userShares
 * - totalShares
 * - managerTotalProfitShare
 * - managerTotalFee
 *
 * The reason for the above fields is that we don't have easy access to the changes in these fields on the blockchain,
 * (there are no log events that account for these field changes).
 */

export const vault_snapshots = pgTable(
	'vault_snapshots',
	{
		// metadata
		id: serial('id').primaryKey(),
		ts: createBNField('ts').notNull(),
		slot: integer('slot').notNull(),

		// extra information
		oraclePrice: createBNField('oraclePrice').notNull(),
		totalAccountQuoteValue: createBNField('totalAccountQuoteValue').notNull(),
		totalAccountBaseValue: createBNField('totalAccountBaseValue').notNull(),

		// important vault account data
		vault: createPubkeyField('vault').notNull(),
		userShares: createBNField('userShares').notNull(),
		totalShares: createBNField('totalShares').notNull(),
		netDeposits: createBNField('netDeposits').notNull(),
		totalDeposits: createBNField('totalDeposits').notNull(),
		totalWithdraws: createBNField('totalWithdraws').notNull(),
		totalWithdrawRequested: createBNField('totalWithdrawRequested').notNull(),
		managerNetDeposits: createBNField('managerNetDeposits').notNull(),
		managerTotalDeposits: createBNField('managerTotalDeposits').notNull(),
		managerTotalWithdraws: createBNField('managerTotalWithdraws').notNull(),
		managerTotalProfitShare: createBNField('managerTotalProfitShare').notNull(),
		managerTotalFee: createBNField('managerTotalFee').notNull(),
	},
	(t) => {
		return {
			vaultIdx: index('vaultIdx').on(t.vault),
			slotSortIdx: index('slotSortIdx').on(t.slot),
		};
	}
);

export type SerializedVaultSnapshot = InferSelectModel<typeof vault_snapshots>;
