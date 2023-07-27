import useAppStore from './useAppStore';
import usePathToVaultPubKey from './usePathToVaultName';

export default function useCurrentVaultAccount() {
	const currentVaultPubKey = usePathToVaultPubKey();
	const vaultDepositor = useAppStore((s) =>
		s.getVaultAccount(currentVaultPubKey)
	);
	return vaultDepositor;
}
