import { UISerializableAccountSnapshot } from '@drift/common';

export type SnapshotKey = keyof Pick<
	UISerializableAccountSnapshot,
	'totalAccountValue' | 'allTimeTotalPnl'
>;
