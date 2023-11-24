import { useOraclePriceStore } from '@drift-labs/react';
import { BN, BigNum, PublicKey, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import { MarketId } from '@drift/common';
import { useEffect, useState } from 'react';

import { VAULTS } from '@/constants/vaults';

import useAppStore from '../stores/app/useAppStore';
import usePathToVaultPubKey from './usePathToVaultName';
import { useVault } from './useVault';

const UPDATE_FREQUENCY_MS = 10_000;

interface VaultStats {
	totalAccountQuoteValue: BN;
	totalAccountBaseValue: BN;
	allTimeTotalPnlQuoteValue: BN;
	allTimeTotalPnlBaseValue: BN;
	isLoaded: boolean;
}

const DEFAULT_VAULT_STATS: VaultStats = {
	totalAccountQuoteValue: new BN(0),
	totalAccountBaseValue: new BN(0),
	allTimeTotalPnlQuoteValue: new BN(0),
	allTimeTotalPnlBaseValue: new BN(0),
	isLoaded: false,
};

export function useVaultStats(vaultPubKey: PublicKey | undefined): VaultStats {
	const vault = useVault(vaultPubKey);
	const vaultDriftUser = vault?.vaultDriftUser;
	const vaultAccountData = useAppStore((s) =>
		s.getVaultAccountData(vaultPubKey)
	);
	const vaultClient = useAppStore((s) => s.vaultClient);
	const { getMarketPriceData } = useOraclePriceStore();

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
		if (
			!vaultDriftUser ||
			!vaultClient ||
			!vault.vaultAccount ||
			!uiVaultConfig
		)
			return DEFAULT_VAULT_STATS;

		const baseAssetQuotePrice = getMarketPriceData(
			MarketId.createSpotMarket(uiVaultConfig.depositAsset.marketIndex)
		).priceData.price;

		// calculate total account value
		const totalAccountQuoteValue = await vaultClient.calculateVaultEquity({
			vault: vault.vaultAccountData,
		});
		const totalAccountBaseValueBN = totalAccountQuoteValue.div(
			BigNum.from(baseAssetQuotePrice, QUOTE_PRECISION_EXP).val
		);
		const totalAccountBaseValueNum = BigNum.from(
			totalAccountBaseValueBN,
			QUOTE_PRECISION_EXP
		).toNum();
		const totalAccountBaseValue = BigNum.fromPrint(
			`${totalAccountBaseValueNum}`,
			uiVaultConfig.depositAsset.precisionExp
		).val;

		// calculate all time total pnl
		const allTimeTotalPnlQuoteValue = vaultDriftUser.getTotalAllTimePnl();
		const allTimeTotalPnlBaseValueBN = allTimeTotalPnlQuoteValue.div(
			BigNum.from(baseAssetQuotePrice, QUOTE_PRECISION_EXP).val
		);
		const allTimeTotalPnlBaseValueNum = BigNum.from(
			allTimeTotalPnlBaseValueBN,
			QUOTE_PRECISION_EXP
		).toNum();
		const allTimeTotalPnlBaseValue = BigNum.fromPrint(
			`${allTimeTotalPnlBaseValueNum}`,
			uiVaultConfig.depositAsset.precisionExp
		).val;

		return {
			totalAccountQuoteValue,
			totalAccountBaseValue,
			allTimeTotalPnlQuoteValue,
			allTimeTotalPnlBaseValue,
			isLoaded: true,
		};
	}

	return vaultStats;
}

export function useCurrentVaultStats(): VaultStats {
	const currentVaultPubKey = usePathToVaultPubKey();
	return useVaultStats(currentVaultPubKey);
}
