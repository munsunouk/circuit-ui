import { InferSelectModel } from 'drizzle-orm';
import {
	index,
	integer,
	pgTable,
	serial,
	unique,
	varchar,
} from 'drizzle-orm/pg-core';

import { createBNField, createPubkeyField } from '../utils';

export const vault_depositor_records = pgTable(
	'vault_depositor_records',
	{
		id: serial('id').primaryKey(),
		ts: createBNField('ts').notNull(),
		txSig: varchar('tx_sig', { length: 128 }).notNull(),
		slot: integer('slot').notNull(),

		vault: createPubkeyField('vault').notNull(),
		depositorAuthority: createPubkeyField('depositorAuthority').notNull(),
		action: varchar('action', { length: 32 }).notNull().default(''),
		amount: createBNField('amount').notNull(),
		spotMarketIndex: integer('spotMarketIndex').notNull(),
		vaultSharesBefore: createBNField('vaultSharesBefore').notNull(),
		vaultSharesAfter: createBNField('vaultSharesAfter').notNull(),
		vaultEquityBefore: createBNField('vaultEquityBefore').notNull(),
		userVaultSharesBefore: createBNField('userVaultSharesBefore').notNull(),
		totalVaultSharesBefore: createBNField('totalVaultSharesBefore').notNull(),
		userVaultSharesAfter: createBNField('userVaultSharesAfter').notNull(),
		totalVaultSharesAfter: createBNField('totalVaultSharesAfter').notNull(),
		profitShare: createBNField('profitShare').notNull(),
		managementFee: createBNField('managementFee').notNull(),
		managementFeeShares: createBNField('managementFeeShares').notNull(),

		assetPrice: createBNField('assetPrice').notNull(),
		notionalValue: createBNField('notionalValue').notNull(),
	},
	(t) => {
		return {
			uniqueTxSig: unique().on(t.txSig),
			vault: index('vault').on(t.vault),
			vaultDepositor: index('vaultDepositor').on(t.vault, t.depositorAuthority),
		};
	}
);

export type SerializedVaultDepositorRecord = InferSelectModel<
	typeof vault_depositor_records
>;
