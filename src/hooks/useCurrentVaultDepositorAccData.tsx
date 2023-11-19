import useAppStore from '../stores/app/useAppStore';
import usePathToVaultPubKey from './usePathToVaultName';

export default function useCurrentVaultDepositorAccData() {
	const currentVaultPubKey = usePathToVaultPubKey();
	const vaultDepositor = useAppStore((s) =>
		s.getVaultDepositorAccountData(currentVaultPubKey)
	);
	return vaultDepositor;
}
