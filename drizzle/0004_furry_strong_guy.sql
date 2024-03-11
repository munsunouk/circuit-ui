CREATE TABLE IF NOT EXISTS "vault_depositor_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"ts" numeric(40, 0) NOT NULL,
	"slot" integer NOT NULL,
	"oraclePrice" numeric(40, 0),
	"totalAccountQuoteValue" numeric(40, 0),
	"totalAccountBaseValue" numeric(40, 0),
	"vault" varchar(44) NOT NULL,
	"vaultDepositor" varchar(44) NOT NULL,
	"authority" varchar(44) NOT NULL,
	"vaultShares" numeric(40, 0) NOT NULL,
	"lastWithdrawRequestShares" numeric(40, 0),
	"lastWithdrawRequestValue" numeric(40, 0),
	"lastWithdrawRequestTs" numeric(40, 0),
	"lastValidTs" numeric(40, 0),
	"netDeposits" numeric(40, 0),
	"totalDeposits" numeric(40, 0),
	"totalWithdraws" numeric(40, 0),
	"cumulativeProfitShareAmount" numeric(40, 0),
	"vaultSharesBase" integer,
	"profitShareFeePaid" numeric(40, 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vd_snapshot_vaultIdx" ON "vault_depositor_snapshots" ("vault");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vd_snapshot_authorityIdx" ON "vault_depositor_snapshots" ("authority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vd_snapshot_slotSortIdx" ON "vault_depositor_snapshots" ("slot");