import {
	OptionalSerializedPerformanceHistory,
	SerializedDepositHistory,
} from '@/types';
import { DriftClient, PublicKey, User, UserAccount } from '@drift-labs/sdk';
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
import { produce } from 'immer';
import { create } from 'zustand';

type UIVault = {
	vaultDriftClient: DriftClient;
	vaultDriftUser: User; // used to get vault's drift account data (e.g. vault balance)
	vaultDriftUserAccount: UserAccount | undefined; // we store the actual account data so we know when it updates -> object reference will update when account data updates
	vaultAccount: VaultAccount;
	vaultAccountData: Vault; // we store the actual account data so we know when it updates
	vaultDepositorAccount?: VaultDepositorAccount;
	vaultDepositorAccountData?: VaultDepositor; // we store the actual account data so we know when it updates
	eventRecords: { records: WrappedEvents; isLoaded: boolean };
	pnlHistory: {
		dailyAllTimePnls: OptionalSerializedPerformanceHistory[];
	};
	vaultDeposits: SerializedDepositHistory[];
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
	};
	vaultClient: VaultClient | undefined;
	vaults: {
		[vaultPubKey: string]: UIVault | undefined;
	};
	balances: {
		usdc: number;
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
	},
	vaultClient: undefined,
	vaults: {},
	balances: {
		usdc: 0,
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
	};
});

export default useAppStore;
