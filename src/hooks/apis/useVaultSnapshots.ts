import { PublicKey } from '@drift-labs/sdk';
import useSWR from 'swr';

import { API_ROUTES } from '@/constants/api-routes';

import { SerializedVaultSnapshot } from '../../../database/schema';

export type VaultSnapshotEssentials = Pick<
	SerializedVaultSnapshot,
	| 'ts'
	| 'slot'
	| 'oraclePrice'
	| 'totalAccountBaseValue'
	| 'totalAccountQuoteValue'
	| 'netDeposits'
>;

const DEFAULT_SNAPSHOT: VaultSnapshotEssentials[] = [];

export const useVaultSnapshots = (vault?: PublicKey | string) => {
	const { data, error, isLoading } = useSWR<VaultSnapshotEssentials[]>(
		vault
			? `${API_ROUTES.GET_VAULT_SNAPSHOTS}?vault=${vault.toString()}`
			: null,
		{
			fallbackData: DEFAULT_SNAPSHOT,
		}
	);

	if (error) {
		console.error(error);

		return {
			snapshots: DEFAULT_SNAPSHOT,
			isLoading: false,
		};
	}

	return {
		snapshots: data ?? DEFAULT_SNAPSHOT,
		isLoading,
	};
};
