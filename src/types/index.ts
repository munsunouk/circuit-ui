import { UISerializableAccountSnapshot } from '@drift/common';

export type SnapshotKey = keyof Pick<
	UISerializableAccountSnapshot,
	'totalAccountValue' | 'allTimeTotalPnl'
>;

export type PerformanceGraphData = Pick<
UISerializableAccountSnapshot,
'epochTs' | 'allTimeTotalPnl' | 'totalAccountValue'
>;