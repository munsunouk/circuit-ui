ALTER TABLE "deposit_records" ALTER COLUMN "amount" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "deposit_records" ALTER COLUMN "oracle_price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "deposit_records" ALTER COLUMN "market_deposit_balance" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "deposit_records" ALTER COLUMN "market_withdraw_balance" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "deposit_records" ALTER COLUMN "market_cumulative_deposit_interest" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "deposit_records" ALTER COLUMN "market_cumulative_borrow_interest" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "deposit_records" ALTER COLUMN "total_deposits_after" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "deposit_records" ALTER COLUMN "total_withdraws_after" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vault_depositor_records" ADD COLUMN "assetPrice" numeric(40, 0);--> statement-breakpoint
ALTER TABLE "vault_depositor_records" ADD COLUMN "notionalValue" numeric(40, 0);