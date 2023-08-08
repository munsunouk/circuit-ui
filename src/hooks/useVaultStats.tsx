import { BN, PublicKey } from '@drift-labs/sdk';

import useAppStore from './useAppStore';
import usePathToVaultPubKey from './usePathToVaultName';

interface VaultStats {
	netUsdValue: BN;
	totalAllTimePnl: BN;
}

const DEFAULT_VAULT_STATS: VaultStats = {
	netUsdValue: new BN(0),
	totalAllTimePnl: new BN(0),
};

export function useVaultStats(vaultPubKey: PublicKey | undefined): VaultStats {
	const vaultDriftUser = useAppStore(
		(s) => s.vaults[vaultPubKey?.toString() ?? '']?.vaultDriftUser
	);

	// This is needed to re-render the hook when the user account updates.
	// Drift user does not update when the user account updates, but user is required
	// to calculate the stats from the user account, hence we require both states
	useAppStore(
		(s) => s.vaults[vaultPubKey?.toString() ?? '']?.vaultDriftUserAccount
	);

	if (!vaultDriftUser) return DEFAULT_VAULT_STATS;

	const collateral = vaultDriftUser.getNetSpotMarketValue();
	const unrealizedPNL = vaultDriftUser.getUnrealizedPNL();
	const netUsdValue = collateral.add(unrealizedPNL);

	const totalAllTimePnl = vaultDriftUser.getTotalAllTimePnl();

	return {
		netUsdValue,
		totalAllTimePnl,
	};
}

export function useCurrentVaultStats(): VaultStats {
	const currentVaultPubKey = usePathToVaultPubKey();
	return useVaultStats(currentVaultPubKey);
}
