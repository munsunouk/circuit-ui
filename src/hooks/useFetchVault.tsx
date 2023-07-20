import { useCommonDriftStore, useDriftClientIsReady } from '@drift-labs/react';
import { PublicKey } from '@drift-labs/sdk';
import { useEffect } from 'react';

import NOTIFICATION_UTILS from '@/utils/notifications';

import { useAppActions } from './useAppActions';
import useCurrentVault from './useCurrentVault';
import usePathToVaultPubKey from './usePathToVaultName';

export default function useFetchVault() {
	const driftClientIsReady = useDriftClientIsReady();
	const appActions = useAppActions();
	const vaultPubKey = usePathToVaultPubKey();
	const authority = useCommonDriftStore((s) => s.authority);
	const currentVault = useCurrentVault();

	useEffect(() => {
		if (driftClientIsReady && vaultPubKey) {
			fetchAllVaultInformation(vaultPubKey);
		}
	}, [driftClientIsReady, vaultPubKey]);

	useEffect(() => {
		if (vaultPubKey && authority && currentVault?.info) {
			appActions.fetchVaultDepositor(vaultPubKey, authority);
		}
	}, [vaultPubKey, authority, currentVault?.info]);

	const fetchAllVaultInformation = async (vaultPubKey: PublicKey) => {
		try {
			await appActions.fetchVault(vaultPubKey);
			appActions.fetchVaultStats(vaultPubKey);
		} catch (err) {
			console.error(err);
			NOTIFICATION_UTILS.toast.error('Error fetching vault data');
		}
	};
}
