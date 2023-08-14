import { PublicKey } from '@drift-labs/sdk';

import useAppStore from './useAppStore';
import usePathToVaultPubKey from './usePathToVaultName';

export function useVault(vaultPubKey: string | PublicKey | undefined) {
	const vault = useAppStore((s) =>
		vaultPubKey?.toString() ? s.vaults[vaultPubKey.toString()] : undefined
	);

	return vault;
}

export function useCurrentVault() {
	const vaultPubKey = usePathToVaultPubKey();
	const vault = useVault(vaultPubKey);
	return vault;
}
