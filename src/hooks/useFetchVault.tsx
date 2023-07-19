import { useDriftClientIsReady } from '@drift-labs/react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import NOTIFICATION_UTILS from '@/utils/notifications';

import { DEFAULT_VAULT_NAME } from '@/constants/vaults';

import { useAppActions } from './useAppActions';
import useAppStore from './useAppStore';

export default function useFetchVault() {
	const pathname = usePathname();
	const driftClientIsReady = useDriftClientIsReady();
	const appActions = useAppActions();
	const setStore = useAppStore((s) => s.set);

	useEffect(() => {
		if (driftClientIsReady && pathname === '/') {
			appActions
				.getVault(DEFAULT_VAULT_NAME)
				.then((vault) => {
					setStore((s) => {
						s.vaults[DEFAULT_VAULT_NAME] = vault;
					});
				})
				.catch((err) => {
					NOTIFICATION_UTILS.toast.error('Error fetching vault data');
				});
		}
	}, [driftClientIsReady, pathname]);
}
