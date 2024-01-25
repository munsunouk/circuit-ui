import { InferSelectModel } from 'drizzle-orm';
import { index, integer, pgTable, serial } from 'drizzle-orm/pg-core';

import { createBNField, createPubkeyField } from '../utils';

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
