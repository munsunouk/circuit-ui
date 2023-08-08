import { useCommonDriftStore, useDriftClientIsReady } from '@drift-labs/react';
import { PublicKey } from '@drift-labs/sdk';
import { useEffect } from 'react';

import NOTIFICATION_UTILS from '@/utils/notifications';

import { useAppActions } from './useAppActions';
import useCurrentVaultAccountData from './useCurrentVaultAccountData';
import usePathToVaultPubKey from './usePathToVaultName';

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

	useEffect(() => {
		if (driftClientIsReady) {
			appActions.setupVaultClient();
		}
	}, [driftClientIsReady]);

	// fetch vault account, vault drift account
	useEffect(() => {
		if (driftClientIsReady && vaultPubKey) {
			fetchAllVaultInformation(vaultPubKey);
		}
	}, [driftClientIsReady, vaultPubKey]);

	// fetch vault depositor
	useEffect(() => {
		if (vaultPubKey && authority && vaultAccountData) {
			appActions.initVaultDepositorSubscriber(vaultPubKey, authority);
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
