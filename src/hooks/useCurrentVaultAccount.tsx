import useAppStore from './useAppStore';
import usePathToVaultPubKey from './usePathToVaultName';

export default function useCurrentVaultAccount() {
	const currentVaultPubKey = usePathToVaultPubKey();
	const vaultAccount = useAppStore((s) =>
		s.getVaultAccount(currentVaultPubKey)
	);
	return vaultAccount;
}
