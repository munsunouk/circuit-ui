import { BN, PublicKey } from '@drift-labs/sdk';
import { useEffect, useState } from 'react';

import { VAULTS } from '@/constants/vaults';

import usePathToVaultPubKey from './usePathToVaultName';
import { useVault } from './useVault';

const UPDATE_FREQUENCY_MS = 10_000;

interface VaultStats {
	totalAccountValue: BN;
	allTimeTotalPnl: BN;
	isLoaded: boolean;
}

const DEFAULT_VAULT_STATS: VaultStats = {
	totalAccountValue: new BN(0),
	allTimeTotalPnl: new BN(0),
	isLoaded: false,
};

export function useVaultStats(vaultPubKey: PublicKey | undefined): VaultStats {
	const vault = useVault(vaultPubKey);
	const vaultDriftUser = vault?.vaultDriftUser;

	const [vaultStats, setVaultStats] = useState(DEFAULT_VAULT_STATS);

	const uiVaultConfig = VAULTS.find(
		(vault) => vault.pubkeyString === vaultPubKey?.toString()
	);

	useEffect(() => {
		const newVaultStats = calcVaultStats();
		setVaultStats(newVaultStats);

		const interval = setInterval(() => {
			const newVaultStats = calcVaultStats();
			setVaultStats(newVaultStats);
		}, UPDATE_FREQUENCY_MS);

		return () => clearInterval(interval);
	}, [vaultDriftUser, uiVaultConfig]);

	function calcVaultStats() {
		if (!vaultDriftUser) return DEFAULT_VAULT_STATS;

		const collateral = vaultDriftUser.getNetSpotMarketValue();
		const unrealizedPNL = vaultDriftUser.getUnrealizedPNL();
		let totalAccountValue = collateral.add(unrealizedPNL);

		let allTimeTotalPnl = vaultDriftUser.getTotalAllTimePnl();

		if (uiVaultConfig?.pastPerformanceHistory) {
			const lastPastHistoryPoint =
				uiVaultConfig.pastPerformanceHistory.slice(-1)[0];

			totalAccountValue = totalAccountValue.add(
				new BN(lastPastHistoryPoint.totalAccountValue.toNum())
			);
			allTimeTotalPnl = allTimeTotalPnl.add(
				new BN(lastPastHistoryPoint.allTimeTotalPnl.toNum())
			);
		}

		return {
			totalAccountValue,
			allTimeTotalPnl,
			isLoaded: true,
		};
	}

	return vaultStats;
}

export function useCurrentVaultStats(): VaultStats {
	const currentVaultPubKey = usePathToVaultPubKey();
	return useVaultStats(currentVaultPubKey);
}
