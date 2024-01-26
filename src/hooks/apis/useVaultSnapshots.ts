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

export const useVaultSnapshots = (vault?: PublicKey | string) => {
	const { data, error, isLoading } = useSWR<VaultSnapshotEssentials[]>(
		vault
			? `${API_ROUTES.GET_VAULT_SNAPSHOTS}?vault=${vault.toString()}`
			: null,
		{
			fallbackData: [],
		}
	);

	if (error) {
		console.error(error);

		return {
			snapshots: [],
			isLoading: false,
		};
	}

	return {
		snapshots: data ?? [],
		isLoading,
	};
};
