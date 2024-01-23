CREATE TABLE IF NOT EXISTS "vault_depositor_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"vault" varchar(44) NOT NULL,
	"depositorAuthority" varchar(44) NOT NULL,
	"action" varchar(32) DEFAULT '' NOT NULL,
	"amount" numeric(40, 0) NOT NULL,
	"spotMarketIndex" integer NOT NULL,
	"vaultSharesBefore" numeric(40, 0) NOT NULL,
	"vaultSharesAfter" numeric(40, 0) NOT NULL,
	"vaultEquityBefore" numeric(40, 0) NOT NULL,
	"userVaultSharesBefore" numeric(40, 0) NOT NULL,
	"totalVaultSharesBefore" numeric(40, 0) NOT NULL,
	"userVaultSharesAfter" numeric(40, 0) NOT NULL,
	"totalVaultSharesAfter" numeric(40, 0) NOT NULL,
	"profitShare" numeric(40, 0) NOT NULL,
	"managementFee" numeric(40, 0) NOT NULL,
	"managementFeeShares" numeric(40, 0) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vault" ON "vault_depositor_records" ("vault");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vaultDepositor" ON "vault_depositor_records" ("vault","depositorAuthority");