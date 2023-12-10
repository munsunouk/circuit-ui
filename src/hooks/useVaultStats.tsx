import { useOraclePriceStore } from '@drift-labs/react';
import { BN, BigNum, PublicKey, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import { MarketId } from '@drift/common';
import { useEffect, useRef, useState } from 'react';

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

	const refreshStatsIntervalRef = useRef<NodeJS.Timer>();

	const uiVaultConfig = VAULTS.find(
		(vault) => vault.pubkeyString === vaultPubKey?.toString()
	);

	useEffect(() => {
		calcVaultStats().then((newVaultStats) => {
			setVaultStats(newVaultStats);
		});

		if (!refreshStatsIntervalRef.current) {
			refreshStatsIntervalRef.current = setInterval(() => {
				calcVaultStats().then((newVaultStats) => {
					setVaultStats(newVaultStats);
				});
			}, UPDATE_FREQUENCY_MS);
		}

		return () => {
			if (refreshStatsIntervalRef.current) {
				clearInterval(refreshStatsIntervalRef.current);
			}
		};
	}, [vaultPubKey, !!vaultAccountData, !!vaultDriftUser]);

	async function calcVaultStats() {
		if (!vaultDriftUser || !vaultClient || !vaultAccountData || !uiVaultConfig)
			return DEFAULT_VAULT_STATS;

		const baseAssetQuotePrice = getMarketPriceData(
			MarketId.createSpotMarket(uiVaultConfig.market.marketIndex)
		).priceData.price;

		// calculate total account value
		const totalAccountQuoteValue = await vaultClient.calculateVaultEquity({
			vault: vaultAccountData,
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
			uiVaultConfig.market.precisionExp
		).val;

		// calculate all time total pnl
		const netDepositBase = vaultAccountData?.netDeposits;

		const allTimeTotalPnlQuoteValue = vaultDriftUser.getTotalAllTimePnl();
		const allTimeTotalPnlBaseValueBN =
			totalAccountBaseValue.sub(netDepositBase);
		const allTimeTotalPnlBaseValueNum = BigNum.from(
			allTimeTotalPnlBaseValueBN,
			QUOTE_PRECISION_EXP
		).toNum();
		const allTimeTotalPnlBaseValue = BigNum.fromPrint(
			`${allTimeTotalPnlBaseValueNum}`,
			uiVaultConfig.market.precisionExp
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
