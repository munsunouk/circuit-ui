import { UiVaultConfig } from '@/types';
import { useOraclePriceStore } from '@drift-labs/react';
import {
	BN,
	BigNum,
	PublicKey,
	QUOTE_PRECISION_EXP,
	User,
} from '@drift-labs/sdk';
import { Vault, VaultClient } from '@drift-labs/vaults-sdk';
import { MarketId } from '@drift/common';
import { useEffect } from 'react';
import { singletonHook } from 'react-singleton-hook';

import { VAULTS } from '@/constants/vaults';

import useAppStore from '../stores/app/useAppStore';
import usePathToVaultPubKey from './usePathToVaultName';

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

function useSyncVaultsStatsImpl() {
	const vaultKeys = useAppStore((s) => Object.keys(s.vaults));
	const getAppStore = useAppStore((s) => s.get);
	const setAppStore = useAppStore((s) => s.set);
	const { getMarketPriceData } = useOraclePriceStore();

	const combinedVaultKeysString = vaultKeys.join(',');

	useEffect(() => {
		fetchAllVaultsStats();

		const refreshStatsInterval = setInterval(() => {
			fetchAllVaultsStats();
		}, UPDATE_FREQUENCY_MS);

		return () => {
			clearInterval(refreshStatsInterval);
		};
	}, [combinedVaultKeysString]);

	async function fetchAllVaultsStats() {
		const vaultClient = getAppStore().vaultClient;
		const vaults = getAppStore().vaults;
		const vaultsKeys = Object.keys(vaults);

		if (!vaultClient) return;

		vaultsKeys.forEach((vaultKey) => {
			const vault = vaults[vaultKey];
			const vaultDriftUser = vault?.vaultDriftUser;
			const vaultAccountData = vault?.vaultAccountData;
			const uiVaultConfig = VAULTS.find(
				(vault) => vault.pubkeyString === vaultKey
			);

			if (vaultDriftUser && vaultAccountData && uiVaultConfig) {
				fetchVaultStats(
					vaultClient,
					vaultDriftUser,
					vaultAccountData,
					uiVaultConfig
				)
					.then((newVaultStats) => {
						setAppStore((s) => {
							s.vaults[vaultKey]!.vaultStats = newVaultStats;
						});
					})
					.catch((err) => {
						console.error(err);
					});
			}
		});
	}

	async function fetchVaultStats(
		vaultClient: VaultClient,
		vaultDriftUser: User,
		vaultAccountData: Vault,
		uiVaultConfig: UiVaultConfig
	) {
		let baseAssetQuotePrice = getMarketPriceData(
			MarketId.createSpotMarket(uiVaultConfig.market.marketIndex)
		).priceData.price;

		if (baseAssetQuotePrice === 0) {
			console.error('market price from oracle store returned 0');
			baseAssetQuotePrice = 1; // default to 1 if price = 0
		}

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
		const allTimeTotalPnlBaseValue = totalAccountBaseValue.sub(netDepositBase);

		return {
			totalAccountQuoteValue,
			totalAccountBaseValue,
			allTimeTotalPnlQuoteValue,
			allTimeTotalPnlBaseValue,
			isLoaded: true,
		};
	}
}

export const useSyncVaultStats = singletonHook(
	undefined,
	useSyncVaultsStatsImpl
);

export function useVaultStats(vaultPubKey: PublicKey | undefined): VaultStats {
	const vaultStats = useAppStore((s) => s.getVaultStats(vaultPubKey));
	return vaultStats ?? DEFAULT_VAULT_STATS;
}

export function useCurrentVaultStats(): VaultStats {
	const currentVaultPubKey = usePathToVaultPubKey();
	return useVaultStats(currentVaultPubKey);
}
