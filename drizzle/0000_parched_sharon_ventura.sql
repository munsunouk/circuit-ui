CREATE TABLE IF NOT EXISTS "deposit_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" varchar(44) NOT NULL,
	"tx_sig" varchar(128) DEFAULT '' NOT NULL,
	"slot" bigint NOT NULL,
	"market_index" integer NOT NULL,
	"ts" bigint NOT NULL,
	"deposit_record_id" bigint NOT NULL,
	"user_authority" varchar(44) NOT NULL,
	"user" varchar(44) NOT NULL,
	"direction" varchar(16) DEFAULT '' NOT NULL,
	"amount" numeric(40, 0) NOT NULL,
	"oracle_price" numeric(40, 0) NOT NULL,
	"market_deposit_balance" numeric(40, 0) NOT NULL,
	"market_withdraw_balance" numeric(40, 0) NOT NULL,
	"market_cumulative_deposit_interest" numeric(40, 0) NOT NULL,
	"market_cumulative_borrow_interest" numeric(40, 0) NOT NULL,
	"total_deposits_after" numeric(40, 0) NOT NULL,
	"total_withdraws_after" numeric(40, 0) NOT NULL,
	"transfer_user" varchar(44),
	"explanation" varchar(48) NOT NULL,
	CONSTRAINT "deposit_records_tx_sig_market_index_deposit_record_id_unique" UNIQUE("tx_sig","market_index","deposit_record_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_authority" ON "deposit_records" ("user_authority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user" ON "deposit_records" ("user");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_ts" ON "deposit_records" ("user","ts");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_ts" ON "deposit_records" ("user","id","ts");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ts" ON "deposit_records" ("ts");