CREATE TABLE IF NOT EXISTS "vault_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"ts" numeric(40, 0) NOT NULL,
	"slot" integer NOT NULL,
	"oraclePrice" numeric(40, 0) NOT NULL,
	"totalAccountQuoteValue" numeric(40, 0) NOT NULL,
	"totalAccountBaseValue" numeric(40, 0) NOT NULL,
	"vault" varchar(44) NOT NULL,
	"userShares" numeric(40, 0) NOT NULL,
	"totalShares" numeric(40, 0) NOT NULL,
	"netDeposits" numeric(40, 0) NOT NULL,
	"totalDeposits" numeric(40, 0) NOT NULL,
	"totalWithdraws" numeric(40, 0) NOT NULL,
	"totalWithdrawRequested" numeric(40, 0) NOT NULL,
	"managerNetDeposits" numeric(40, 0) NOT NULL,
	"managerTotalDeposits" numeric(40, 0) NOT NULL,
	"managerTotalWithdraws" numeric(40, 0) NOT NULL,
	"managerTotalProfitShare" numeric(40, 0) NOT NULL,
	"managerTotalFee" numeric(40, 0) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vaultIdx" ON "vault_snapshots" ("vault");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slotSortIdx" ON "vault_snapshots" ("slot");