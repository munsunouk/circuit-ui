import { BN, PublicKey, ZERO } from '@drift-labs/sdk';
import { useEffect, useState } from 'react';

import { VAULTS } from '@/constants/vaults';

import useAppStore from './useAppStore';
import usePathToVaultPubKey from './usePathToVaultName';
import { useVault } from './useVault';

const UPDATE_FREQUENCY_MS = 10_000;

interface VaultStats {
	totalAccountValue: BN;
	allTimeTotalPnl: BN;
	totalAccountValueWithHistory: BN;
	allTimeTotalPnlWithHistory: BN;
	netDepositsWithHistory: BN;
	isLoaded: boolean;
}

const DEFAULT_VAULT_STATS: VaultStats = {
	totalAccountValue: new BN(0),
	allTimeTotalPnl: new BN(0),
	totalAccountValueWithHistory: new BN(0),
	allTimeTotalPnlWithHistory: new BN(0),
	netDepositsWithHistory: new BN(0),
	isLoaded: false,
};

export function useVaultStats(vaultPubKey: PublicKey | undefined): VaultStats {
	const vault = useVault(vaultPubKey);
	const vaultDriftUser = vault?.vaultDriftUser;
	const vaultAccountData = useAppStore((s) =>
		s.getVaultAccountData(vaultPubKey)
	);
	const vaultClient = useAppStore((s) => s.vaultClient);

	const [vaultStats, setVaultStats] = useState(DEFAULT_VAULT_STATS);

	const uiVaultConfig = VAULTS.find(
		(vault) => vault.pubkeyString === vaultPubKey?.toString()
	);

	useEffect(() => {
		calcVaultStats().then((newVaultStats) => {
			setVaultStats(newVaultStats);
		});

		const interval = setInterval(() => {
			calcVaultStats().then((newVaultStats) => {
				setVaultStats(newVaultStats);
			});
		}, UPDATE_FREQUENCY_MS);

		return () => clearInterval(interval);
	}, [vaultDriftUser, uiVaultConfig, vaultAccountData, vaultClient, vault]);

	async function calcVaultStats() {
		if (!vaultDriftUser || !vaultClient || !vault.vaultAccount)
			return DEFAULT_VAULT_STATS;

		const totalAccountValue = await vaultClient.calculateVaultEquity({
			vault: vault.vaultAccountData,
		});
		const allTimeTotalPnl = vaultDriftUser.getTotalAllTimePnl();

		let totalAccountValueWithHistory = totalAccountValue;
		let allTimeTotalPnlWithHistory = allTimeTotalPnl;
		let netDepositsWithHistory = vaultAccountData?.netDeposits || ZERO;

		if (uiVaultConfig?.pastPerformanceHistory) {
			const lastPastHistoryPoint =
				uiVaultConfig.pastPerformanceHistory.slice(-1)[0];

			totalAccountValueWithHistory = totalAccountValueWithHistory.add(
				new BN(lastPastHistoryPoint.totalAccountValue.toNum())
			);
			allTimeTotalPnlWithHistory = allTimeTotalPnlWithHistory.add(
				new BN(lastPastHistoryPoint.allTimeTotalPnl.toNum())
			);
			netDepositsWithHistory = netDepositsWithHistory.add(
				new BN(lastPastHistoryPoint.netDeposits.toString())
			);
		}

		return {
			totalAccountValue,
			allTimeTotalPnl,
			totalAccountValueWithHistory,
			allTimeTotalPnlWithHistory,
			netDepositsWithHistory,
			isLoaded: true,
		};
	}

	return vaultStats;
}

export function useCurrentVaultStats(): VaultStats {
	const currentVaultPubKey = usePathToVaultPubKey();
	return useVaultStats(currentVaultPubKey);
}
