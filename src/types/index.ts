import { BN, BigNum, SpotBalanceType, SpotMarketConfig } from '@drift-labs/sdk';
import { UISerializableAccountSnapshot } from '@drift/common';

import { Asset } from '@/constants/assets';

export type SnapshotKey = keyof Pick<
	UISerializableAccountSnapshot,
	'totalAccountValue' | 'allTimeTotalPnl'
>;

export type PerformanceGraphData = Pick<
	UISerializableAccountSnapshot,
	'epochTs' | 'allTimeTotalPnl' | 'totalAccountValue'
> & { netDeposits: BN };

export type SerializedPerformanceHistory = {
	totalAccountValue: number;
	allTimeTotalPnl: number;
	allTimeTotalPnlPct: number;
	epochTs: number;
};

export type SerializedDepositHistory = {
	id: number;
	txSig: string;
	slot: number;
	ts: string;
	depositRecordId: string;
	userAuthority: string;
	user: string;
	direction: 'deposit' | 'withdraw';
	marketIndex: number;
	amount: string;
	oraclePrice: string;
	marketDepositBalance: string;
	marketWithdrawBalance: string;
	marketCumulativeDepositInterest: string;
	marketCumulativeBorrowInterest: string;
	totalDepositsAfter: string;
	totalWithdrawsAfter: string;
	explanation: string;
};

export type UserBalance = {
	baseBalance: BigNum;
	oraclePrice: BigNum;
	quoteValue: BigNum;
	marketIndex: number;
	liquidationPrice: BigNum;
	spotBalanceType: SpotBalanceType;
};

export interface OverviewSection {
	title: string;
	paragraphs: ({ title?: string; className?: string } & (
		| { text: string; isDynamic?: false }
		| { text: string[]; isDynamic: true }
	))[]; // allows for placeholders to be replaced with dynamic values
}

export interface UiVaultConfig {
	name: string;
	pubkeyString?: string;
	description: string;
	permissioned?: boolean;
	previewBackdropUrl: string;
	backdropParticlesColor: string;
	pastPerformanceHistory?: PerformanceGraphData[];
	vaultOverview?: OverviewSection[];
	market: SpotMarketConfig;
	assetColor: string; // primarily used for the deposit asset border color
	historyType?: 'Historical' | 'Backtest';
	assetsOperatedOn?: Asset[];
	comingSoon?: boolean;
	temporaryApy?: number; // used at the start of a new vault to show a temporary APY
	userPubKey: string;
	feesFraction: number;
}
