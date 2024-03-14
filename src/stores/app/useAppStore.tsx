import { UserBalance } from '@/types';
import {
	BN,
	BigNum,
	DriftClient,
	PublicKey,
	User,
	UserAccount,
} from '@drift-labs/sdk';
import {
	EventType,
	Vault,
	VaultAccount,
	VaultClient,
	VaultDepositor,
	VaultDepositorAccount,
	WrappedEvent,
	WrappedEvents,
} from '@drift-labs/vaults-sdk';
import { OpenPosition } from '@drift/common';
import { produce } from 'immer';
import { create } from 'zustand';

import { UISerializableOrderWithOraclePrice } from '@/hooks/table-data/useVaultOpenOrders';

import { getUiVaultConfig } from '@/utils/vaults';

import { JITOSOL_MARKET, USDC_MARKET } from '@/constants/environment';

export interface VaultStats {
	totalAccountQuoteValue: BN;
	totalAccountBaseValue: BN;
	allTimeTotalPnlQuoteValue: BN;
	allTimeTotalPnlBaseValue: BN;
	isLoaded: boolean;
}

export const DEFAULT_VAULT_STATS: VaultStats = {
	totalAccountQuoteValue: new BN(0),
	totalAccountBaseValue: new BN(0),
	allTimeTotalPnlQuoteValue: new BN(0),
	allTimeTotalPnlBaseValue: new BN(0),
	isLoaded: false,
};

export type UIVault = {
	vaultDriftClient: DriftClient;
	vaultDriftUser: User; // used to get vault's drift account data (e.g. vault balance)
	vaultDriftUserAccount: UserAccount | undefined; // we store the actual account data so we know when it updates -> object reference will update when account data updates
	vaultAccount: VaultAccount;
	vaultAccountData: Vault; // we store the actual account data so we know when it updates
	vaultDepositorAccount?: VaultDepositorAccount;
	vaultDepositorAccountData?: VaultDepositor; // we store the actual account data so we know when it updates
	isVaultDepositorDataLoaded: boolean; // used to determine if user is a vault depositor; if vault depositor data is loaded and vaultDepositorAccount is not undefined, then user is a vault depositor
	eventRecords: { records: WrappedEvents; isLoaded: boolean };
	accountSummary: {
		openPositions: (OpenPosition & { indexPrice: number })[];
		balances: UserBalance[];
		openOrders: UISerializableOrderWithOraclePrice[];
	};
	vaultStats: VaultStats;
};

export interface AppStoreState {
	modals: {
		showConnectWalletModal: boolean;
		showRpcSwitcherModal: boolean;
		showStoreModal: boolean;
		showActionRecordModal:
			| {
					show: true;
					actionRecord: WrappedEvent<EventType>;
			  }
			| { show: false };
		showAcknowledgeTermsModal: boolean;
		showPriorityFeesSettingModal: boolean;
	};
	vaultClient: VaultClient | undefined;
	vaults: {
		[vaultPubKey: string]: UIVault | undefined;
	};
	balances: {
		// use actual SpotMarketConfig symbol
		[key: string]: number;
	};
	set: (x: (s: AppStoreState) => void) => void;
	get: () => AppStoreState;
	getVaultDriftClient: (
		vaultAddress: PublicKey | undefined
	) => DriftClient | undefined;
	getVaultAccountData: (
		vaultAddress: PublicKey | undefined
	) => Vault | undefined;
	getVaultDepositorAccountData: (
		vaultAddress: PublicKey | undefined
	) => VaultDepositor | undefined;
	getVaultDriftUserAccount: (
		vaultAddress: PublicKey | undefined
	) => UserAccount | undefined;
	getVaultDriftUser: (vaultAddress: PublicKey | undefined) => User | undefined;
	getVaultStats: (
		vaultAddress: PublicKey | undefined
	) => VaultStats | undefined;
	getVaultDepositorStats: (vaultAddress: PublicKey | undefined) => {
		balanceBase: BigNum;
		totalEarningsBase: BigNum;
		isLoaded: boolean;
	};

	getAreVaultsAccountDataLoaded: () => boolean;
	getAreVaultDepositorsAccountDataLoaded: () => boolean;
	getAreVaultsStatsLoaded: () => boolean;
}

const DEFAULT_APP_STORE_STATE = {
	modals: {
		showConnectWalletModal: false,
		showRpcSwitcherModal: false,
		showStoreModal: false,
		showActionRecordModal: {
			show: false as false,
		},
		showAcknowledgeTermsModal: false,
		showPriorityFeesSettingModal: false,
	},
	vaultClient: undefined,
	vaults: {},
	balances: {
		[USDC_MARKET.symbol]: 0,
		[JITOSOL_MARKET.symbol]: 0,
	},
};

const vaultPropGetter = (
	get: () => AppStoreState,
	vaultAddress: PublicKey | undefined,
	key: keyof UIVault
) => {
	if (!vaultAddress) return undefined;

	const vault = get().vaults[vaultAddress.toString()];
	return vault?.[key];
};

const useAppStore = create<AppStoreState>((set, get) => {
	const setProducerFn = (fn: (s: AppStoreState) => void) => set(produce(fn));
	return {
		...DEFAULT_APP_STORE_STATE,
		set: setProducerFn,
		get: () => get(),
		getVaultDriftClient: (vaultAddress: PublicKey | undefined) => {
			return vaultPropGetter(
				get,
				vaultAddress,
				'vaultDriftClient'
			) as DriftClient;
		},
		getVaultAccountData: (vaultAddress: PublicKey | undefined) => {
			return vaultPropGetter(get, vaultAddress, 'vaultAccountData') as Vault;
		},
		getVaultDepositorAccountData: (vaultAddress: PublicKey | undefined) => {
			return vaultPropGetter(
				get,
				vaultAddress,
				'vaultDepositorAccountData'
			) as VaultDepositor;
		},
		getVaultDriftUserAccount: (vaultAddress: PublicKey | undefined) => {
			return vaultPropGetter(
				get,
				vaultAddress,
				'vaultDriftUserAccount'
			) as UserAccount;
		},
		getVaultDriftUser: (vaultAddress: PublicKey | undefined) => {
			return vaultPropGetter(get, vaultAddress, 'vaultDriftUser') as User;
		},
		getVaultStats: (vaultAddress: PublicKey | undefined) => {
			return vaultPropGetter(get, vaultAddress, 'vaultStats') as VaultStats;
		},
		getVaultDepositorStats: (vaultAddress: PublicKey | undefined) => {
			if (!vaultAddress)
				return {
					balanceBase: BigNum.zero(),
					totalEarningsBase: BigNum.zero(),
					isLoaded: false,
				};

			const vault = get().vaults[vaultAddress.toString()];
			const vaultStats = vault?.vaultStats;
			const vaultAccountData = vault?.vaultAccountData;
			const vaultDepositorAccountData = vault?.vaultDepositorAccountData;

			if (!vaultStats || !vaultAccountData || !vaultDepositorAccountData) {
				return {
					balanceBase: BigNum.zero(),
					totalEarningsBase: BigNum.zero(),
					isLoaded:
						!!vaultStats &&
						!!vaultAccountData &&
						!!vault?.isVaultDepositorDataLoaded,
				};
			}

			const lastRequestedShares =
				vaultDepositorAccountData?.lastWithdrawRequest.shares ?? new BN(0);
			const isFullWithdrawalInProgress = lastRequestedShares.eq(
				// we capped the UI display of user's balance only for full withdrawals for now, since partial withdrawal requires some calculation
				vaultDepositorAccountData.vaultShares
			);

			const marketPrecisionExp =
				getUiVaultConfig(vaultAddress)?.market.precisionExp ??
				USDC_MARKET.precisionExp;

			// User's vault share proportion
			const totalVaultShares = vaultAccountData.totalShares.toNumber();
			const userVaultShares = vaultDepositorAccountData.vaultShares.toNumber();
			const userSharesProportion =
				userVaultShares / (totalVaultShares ?? 1) || 0;

			// User's current balance
			const vaultAccountBaseBalance =
				vaultStats.totalAccountBaseValue.toNumber();
			const userBalance = vaultAccountBaseBalance * userSharesProportion;
			const userBalanceBigNum = BigNum.from(
				isFullWithdrawalInProgress // user can only withdraw a maximum of their last withdrawal requested value - they do not accrue value during the redemption period, whereas losses will continue to accrue if it happens
					? Math.min(
							vaultDepositorAccountData?.lastWithdrawRequest.value.toNumber() ??
								Infinity,
							userBalance
						)
					: userBalance,
				marketPrecisionExp
			);

			// User's total earnings
			const userTotalDepositsBigNum = BigNum.from(
				vaultDepositorAccountData.totalDeposits,
				marketPrecisionExp
			);
			const userTotalWithdrawsBigNum = BigNum.from(
				vaultDepositorAccountData.totalWithdraws,
				marketPrecisionExp
			);
			const totalEarnings = userTotalWithdrawsBigNum
				.sub(userTotalDepositsBigNum)
				.add(userBalanceBigNum);

			return {
				balanceBase: userBalanceBigNum,
				totalEarningsBase: totalEarnings,
				isLoaded: true,
			};
		},

		getAreVaultsAccountDataLoaded: () => {
			const vaults = get().vaults;
			const vaultsKeys = Object.keys(vaults);
			return vaultsKeys.every((vaultKey) => {
				const vault = vaults[vaultKey];
				return !!vault?.vaultAccountData;
			});
		},
		getAreVaultDepositorsAccountDataLoaded: () => {
			const vaults = get().vaults;
			const vaultsKeys = Object.keys(vaults);
			return vaultsKeys.every((vaultKey) => {
				const vault = vaults[vaultKey];
				return !!vault?.isVaultDepositorDataLoaded;
			});
		},
		getAreVaultsStatsLoaded: () => {
			const vaults = get().vaults;
			const vaultsKeys = Object.keys(vaults);
			return vaultsKeys.every((vaultKey) => {
				const vault = vaults[vaultKey];
				return !!vault?.vaultStats.isLoaded;
			});
		},
	};
});

export default useAppStore;
