import { Vault } from '@drift-labs/vaults-sdk';

import useAppStore from './useAppStore';
import usePathToVaultPubKey from './usePathToVaultName';

export default function useCurrentVault() {
	const vaultPubKey = usePathToVaultPubKey();
	const vault = useAppStore((s) =>
		vaultPubKey?.toString() ? s.vaults[vaultPubKey.toString()] : undefined
	);

	return vault;
}
