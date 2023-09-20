import { BN } from '@drift-labs/sdk';
import { UISerializableAccountSnapshot } from '@drift/common';

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
	direction: string;
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
