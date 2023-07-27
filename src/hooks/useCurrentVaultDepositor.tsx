import useAppStore from './useAppStore';
import usePathToVaultPubKey from './usePathToVaultName';

export default function useCurrentVaultDepositor() {
	const currentVaultPubKey = usePathToVaultPubKey();
	const vaultDepositor = useAppStore(
		(s) => s.vaults[currentVaultPubKey?.toString() ?? '']?.vaultDepositorAccount
	);
	return vaultDepositor;
}
