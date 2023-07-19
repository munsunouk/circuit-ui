import { CommonDriftStore } from '@drift-labs/react';
import {
	VAULT_PROGRAM_ID,
	VaultClient,
	encodeName,
	getVaultAddressSync,
	getVaultClient,
} from '@drift-labs/vaults-sdk';
import { StoreApi } from 'zustand';

import { AppStoreState } from '@/hooks/useAppStore';

import { ARBITRARY_WALLET } from '@/constants/environment';

const createAppActions = (
	getCommon: StoreApi<CommonDriftStore>['getState'],
	_setCommon: (x: (s: CommonDriftStore) => void) => void,
	_get: StoreApi<AppStoreState>['getState'],
	_set: (x: (s: AppStoreState) => void) => void
) => {
	/**
	 * Gets on-chain data of the given vault name
	 * @param vaultName The name of the vault
	 */
	const getVault = async (vaultName: string) => {
		const state = getCommon();

		if (!state.connection || !state.driftClient.client) {
			throw new Error('No connection');
		}

		const vaultAddress = getVaultAddressSync(
			VAULT_PROGRAM_ID,
			encodeName(vaultName)
		);

		const vaultClient = getVaultClient(
			state.connection,
			ARBITRARY_WALLET,
			state.driftClient.client
		);

		const vault = (await vaultClient.getVault(vaultAddress)) as VaultClient;

		return vault;
	};

	return {
		getVault,
	};
};

export default createAppActions;
