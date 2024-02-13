import { useCommonDriftStore, useDriftClientIsReady } from '@drift-labs/react';
import { PublicKey } from '@drift-labs/sdk';
import { useEffect } from 'react';

import NOTIFICATION_UTILS from '@/utils/notifications';

import { useAppActions } from '../../hooks/useAppActions';
import useCurrentVaultAccountData from '../../hooks/useCurrentVaultAccountData';
import usePathToVaultPubKey from '../../hooks/usePathToVaultName';
import useAppStore from './useAppStore';

/**
 * Fetches
 * - Vault account
 * - Vault's Drift User account
 * - Vault Depositor
 * - Vault PnL History
 */
export default function useFetchVault() {
	const driftClientIsReady = useDriftClientIsReady();
	const appActions = useAppActions();
	const vaultPubKey = usePathToVaultPubKey();
	const authority = useCommonDriftStore((s) => s.authority);
	const vaultAccountData = useCurrentVaultAccountData();
	const currentVault = useAppStore(
		(s) => s.vaults[vaultPubKey?.toString() ?? '']
	);
	const setAppStore = useAppStore((s) => s.set);

	useEffect(() => {
		if (driftClientIsReady) {
			appActions.setupVaultClient();
		}
	}, [driftClientIsReady]);

	// fetch vault account, vault drift account
	useEffect(() => {
		// we don't want to re-fetch the vault if it is already set, which is possible if the home page fetches all vaults
		if (driftClientIsReady && vaultPubKey && !currentVault) {
			fetchAllVaultInformation(vaultPubKey);
		}
	}, [driftClientIsReady, vaultPubKey, currentVault]);

	// fetch vault depositor
	useEffect(() => {
		if (vaultPubKey && authority && vaultAccountData) {
			appActions.initVaultDepositorSubscriber(vaultPubKey, authority);
		}

		if (!authority) {
			setAppStore((s) => {
				Object.keys(s.vaults).forEach((vaultPubKey) => {
					s.vaults[vaultPubKey]!.isVaultDepositorDataLoaded = false;
					s.vaults[vaultPubKey]!.vaultDepositorAccount = undefined;
					s.vaults[vaultPubKey]!.vaultDepositorAccountData = undefined;
				});
			});
		}
	}, [vaultPubKey, authority, !!vaultAccountData]);

	const fetchAllVaultInformation = async (vaultPubKey: PublicKey) => {
		try {
			await appActions.fetchVault(vaultPubKey);
		} catch (err) {
			console.error(err);
			NOTIFICATION_UTILS.toast.error('Error fetching vault data');
		}
	};
}
