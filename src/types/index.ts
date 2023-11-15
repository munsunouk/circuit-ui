import { BN, BigNum } from '@drift-labs/sdk';
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

// to allow for undefined values in case we want to show the historical value of the other property
export type OptionalSerializedPerformanceHistory = Omit<
	SerializedPerformanceHistory,
	'totalAccountValue' | 'allTimeTotalPnl'
> & {
	totalAccountValue: number | undefined;
	allTimeTotalPnl: number | undefined;
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

export type UserBalance = {
	baseBalance: BigNum;
	oraclePrice: BigNum;
	quoteValue: BigNum;
	marketIndex: number;
	liquidationPrice: BigNum;
};
