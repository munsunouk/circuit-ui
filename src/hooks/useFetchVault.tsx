import { useDriftClientIsReady } from '@drift-labs/react';
import { PublicKey } from '@drift-labs/sdk';
import { useEffect } from 'react';

import NOTIFICATION_UTILS from '@/utils/notifications';

import { useAppActions } from './useAppActions';
import usePathToVaultPubKey from './usePathToVaultName';

export default function useFetchVault() {
	const driftClientIsReady = useDriftClientIsReady();
	const appActions = useAppActions();
	const vaultPubKey = usePathToVaultPubKey();

	useEffect(() => {
		if (driftClientIsReady && vaultPubKey) {
			fetchAllVaultInformation(vaultPubKey);
		}
	}, [driftClientIsReady, vaultPubKey]);

	const fetchAllVaultInformation = async (vaultPubKey: PublicKey) => {
		try {
			await appActions.fetchVault(vaultPubKey);
			await appActions.fetchVaultStats(vaultPubKey);
		} catch (err) {
			console.error(err);
			NOTIFICATION_UTILS.toast.error('Error fetching vault data');
		}
	};
}
