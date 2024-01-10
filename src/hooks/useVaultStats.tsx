import { UiVaultConfig } from '@/types';
import { useOraclePriceStore } from '@drift-labs/react';
import { BN, PRICE_PRECISION, PublicKey, User } from '@drift-labs/sdk';
import { Vault, VaultClient } from '@drift-labs/vaults-sdk';
import { MarketId } from '@drift/common';
import { USDC_SPOT_MARKET_INDEX } from '@drift/common';
import { useEffect } from 'react';
import { singletonHook } from 'react-singleton-hook';

import { SPOT_MARKETS_LOOKUP } from '@/constants/environment';
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
		const marketIndex = uiVaultConfig.market.marketIndex;
		const isUsdcMarket = marketIndex === USDC_SPOT_MARKET_INDEX;

		let baseAssetPrice = isUsdcMarket
			? 1
			: getMarketPriceData(
					MarketId.createSpotMarket(uiVaultConfig.market.marketIndex)
				).priceData.price;

		if (baseAssetPrice === 0) {
			console.error(
				'market price from oracle store returned 0 for market index:',
				marketIndex
			);
			baseAssetPrice = 1; // default to 1 if price = 0
		}

		const baseAssetPriceBN = new BN(
			baseAssetPrice * PRICE_PRECISION.toNumber()
		);

		// calculate total account value
		const totalAccountQuoteValueBN = await vaultClient.calculateVaultEquity({
			vault: vaultAccountData,
		});
		const totalAccountBaseValueBN = totalAccountQuoteValueBN
			.mul(SPOT_MARKETS_LOOKUP[marketIndex].precision)
			.div(baseAssetPriceBN);

		// calculate all time total pnl
		const netDepositBase = vaultAccountData?.netDeposits;

		const allTimeTotalPnlQuoteValue = vaultDriftUser.getTotalAllTimePnl();
		const allTimeTotalPnlBaseValue =
			totalAccountBaseValueBN.sub(netDepositBase);

		return {
			totalAccountQuoteValue: totalAccountQuoteValueBN,
			totalAccountBaseValue: totalAccountBaseValueBN,
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
