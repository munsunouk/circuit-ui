import { BN, PublicKey } from '@drift-labs/sdk';
import { VaultDepositorRecord } from '@drift-labs/vaults-sdk';
import useSWR from 'swr';

import { API_ROUTES } from '@/constants/api-routes';
import { DEFAULT_DEDUPING_INTERVAL } from '@/constants/environment';

import { SerializedVaultDepositorRecord } from '../../../database/schema';

export type GetVaultDepositorRecordsResponse = {
	records: SerializedVaultDepositorRecord[];
	count: number;
};

export const useVaultDepositorRecords = (
	vault: PublicKey | string | undefined,
	depositorAuthority: PublicKey | string | undefined | null,
	limit = 100,
	page = 0
): { records: VaultDepositorRecord[]; count: number; isLoading: boolean } => {
	const vaultString = vault?.toString();
	const depositorString = depositorAuthority?.toString();

	const { data, error, isLoading } = useSWR<GetVaultDepositorRecordsResponse>(
		vaultString && depositorString
			? `${API_ROUTES.GET_VAULT_DEPOSITOR_RECORDS}?${new URLSearchParams({
					vault: vaultString,
					depositor: depositorString,
					limit: limit.toString(),
					page: page.toString(),
				})}`
			: null,
		{
			dedupingInterval: DEFAULT_DEDUPING_INTERVAL,
			fallbackData: {
				records: [],
				count: 0,
			},
		}
	);

	if (error) {
		console.error(error);

		return {
			records: [],
			count: 0,
			isLoading: false,
		};
	}

	if (!data) {
		return {
			records: [],
			count: 0,
			isLoading,
		};
	}

	const deserializedRecords = data.records.map((record) => ({
		...record,
		ts: new BN(record.ts),
		depositorAuthority: new PublicKey(record.depositorAuthority),
		vault: new PublicKey(record.vault),
		amount: new BN(record.amount),
		vaultSharesAfter: new BN(record.vaultSharesAfter),
		vaultSharesBefore: new BN(record.vaultSharesBefore),
		vaultEquityBefore: new BN(record.vaultEquityBefore),
		userVaultSharesBefore: new BN(record.userVaultSharesBefore),
		totalVaultSharesBefore: new BN(record.totalVaultSharesBefore),
		userVaultSharesAfter: new BN(record.userVaultSharesAfter),
		totalVaultSharesAfter: new BN(record.totalVaultSharesAfter),
		profitShare: new BN(record.profitShare),
		managementFee: new BN(record.managementFee),
		managementFeeShares: new BN(record.managementFeeShares),
	}));

	return {
		records: deserializedRecords,
		count: data.count,
		isLoading,
	};
};
