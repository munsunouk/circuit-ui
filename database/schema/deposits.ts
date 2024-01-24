import { InferSelectModel } from 'drizzle-orm';
import {
	index,
	integer,
	pgTable,
	serial,
	unique,
	varchar,
} from 'drizzle-orm/pg-core';

import { createBNField, createBigIntField, createPubkeyField } from '../utils';

export const deposit_records = pgTable(
	'deposit_records',
	{
		id: serial('id').primaryKey(),
		program_id: createPubkeyField('program_id'),
		tx_sig: varchar('tx_sig', { length: 128 }).notNull().default(''),
		slot: createBigIntField('slot'),
		market_index: integer('market_index').notNull(),
		ts: createBigIntField('ts'),
		deposit_record_id: createBigIntField('deposit_record_id'),
		user_authority: createPubkeyField('user_authority'),
		user: createPubkeyField('user'),
		direction: varchar('direction', { length: 16 }).notNull().default(''),
		amount: createBNField('amount'),
		oracle_price: createBNField('oracle_price'),
		market_deposit_balance: createBNField('market_deposit_balance'),
		market_withdraw_balance: createBNField('market_withdraw_balance'),
		market_cumulative_deposit_interest: createBNField(
			'market_cumulative_deposit_interest'
		),
		market_cumulative_borrow_interest: createBNField(
			'market_cumulative_borrow_interest'
		),
		total_deposits_after: createBNField('total_deposits_after'),
		total_withdraws_after: createBNField('total_withdraws_after'),
		transfer_user: createPubkeyField('transfer_user'),
		explanation: varchar('explanation', { length: 48 }).notNull(),
	},
	(t) => {
		return {
			unique: unique().on(t.tx_sig, t.market_index, t.deposit_record_id),
			user_authority: index('user_authority').on(t.user_authority),
			user: index('user').on(t.user),
			user_ts: index('user_ts').on(t.user, t.ts),
			user_id_ts: index('user_id_ts').on(t.user, t.id, t.ts),
			ts: index('ts').on(t.ts),
		};
	}
);

export type SerializedDepositRecord = InferSelectModel<typeof deposit_records>;
