import invariant from 'tiny-invariant';

import { useAppActions } from '@/hooks/useAppActions';
import useAppStore from '@/hooks/useAppStore';
import usePathToVaultPubKey from '@/hooks/usePathToVaultName';

import Button from '../elements/Button';

export default function DevFunctions() {
	const setStore = useAppStore((s) => s.set);
	const appActions = useAppActions();
	const vaultPubKey = usePathToVaultPubKey();

	const openStoreModal = () => {
		setStore((s) => {
			s.modals.showStoreModal = true;
		});
	};

	const liquidateVault = () => {
		invariant(vaultPubKey, 'Vault pub key is required');
		appActions.initVaultLiquidation(vaultPubKey);
	};

	return (
		<div className="flex flex-col gap-1 [&>button]:p-2">
			<Button onClick={openStoreModal}>Store</Button>
			<Button onClick={liquidateVault}>Liquidate</Button>
		</div>
	);
}
