import { BN, PublicKey, User } from '@drift-labs/sdk';
import { useEffect, useState } from 'react';

import useAppStore from './useAppStore';
import usePathToVaultPubKey from './usePathToVaultName';

const UPDATE_FREQUENCY_MS = 10_000;

interface VaultStats {
	netUsdValue: BN;
	totalAllTimePnl: BN;
	isLoaded: boolean;
}

const DEFAULT_VAULT_STATS: VaultStats = {
	netUsdValue: new BN(0),
	totalAllTimePnl: new BN(0),
	isLoaded: false,
};

export function useVaultStats(vaultPubKey: PublicKey | undefined): VaultStats {
	const vaultDriftUser = useAppStore(
		(s) => s.vaults[vaultPubKey?.toString() ?? '']?.vaultDriftUser
	);
	const [vaultStats, setVaultStats] = useState(DEFAULT_VAULT_STATS);

	useEffect(() => {
		const newVaultStats = calcVaultStats(vaultDriftUser);
		setVaultStats(newVaultStats);

		const interval = setInterval(() => {
			const newVaultStats = calcVaultStats(vaultDriftUser);
			setVaultStats(newVaultStats);
		}, UPDATE_FREQUENCY_MS);

		return () => clearInterval(interval);
	}, [vaultDriftUser]);

	function calcVaultStats(vaultDriftUser: User | undefined) {
		if (!vaultDriftUser) return DEFAULT_VAULT_STATS;

		const collateral = vaultDriftUser.getNetSpotMarketValue();
		const unrealizedPNL = vaultDriftUser.getUnrealizedPNL();
		const netUsdValue = collateral.add(unrealizedPNL);

		const totalAllTimePnl = vaultDriftUser.getTotalAllTimePnl();

		return {
			netUsdValue,
			totalAllTimePnl,
			isLoaded: true,
		};
	}

	return vaultStats;
}

export function useCurrentVaultStats(): VaultStats {
	const currentVaultPubKey = usePathToVaultPubKey();
	return useVaultStats(currentVaultPubKey);
}
