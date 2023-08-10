import { PublicKey } from '@solana/web3.js';
import { useEffect } from 'react';

import { useAppActions } from './useAppActions';
import useAppStore from './useAppStore';

export default function useFetchEventRecords(
	vaultPubKey: PublicKey | undefined
) {
	const appActions = useAppActions();
	const vaultDepositorAccountData = useAppStore((s) =>
		s.getVaultDepositorAccountData(vaultPubKey)
	);

	useEffect(() => {
		if (vaultPubKey && vaultDepositorAccountData) {
			appActions.fetchVaultDepositorEvents(vaultPubKey);
		}
	}, [vaultPubKey, vaultDepositorAccountData]);
}
