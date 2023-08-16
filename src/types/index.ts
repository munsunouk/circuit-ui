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
