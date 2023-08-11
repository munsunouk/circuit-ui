import { UISerializableAccountSnapshot } from '@drift/common';

export type SnapshotKey = keyof Pick<
	UISerializableAccountSnapshot,
	'totalAccountValue' | 'allTimeTotalPnl'
>;

export type PerformanceGraphData = Pick<
	UISerializableAccountSnapshot,
	'epochTs' | 'allTimeTotalPnl' | 'totalAccountValue'
>;

export type SerializedPerformanceHistory = {
	totalAccountValue: number;
	allTimeTotalPnl: number;
	epochTs: number;
};
