import useAppStore from './useAppStore';
import usePathToVaultPubKey from './usePathToVaultName';

export default function useCurrentVaultDepositor() {
	const currentVaultPubKey = usePathToVaultPubKey();
	const vaultDepositor = useAppStore((s) =>
		s.getVaultDepositor(currentVaultPubKey)
	);
	return vaultDepositor;
}
