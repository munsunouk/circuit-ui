import { SerializedPerformanceHistory } from '@/types';
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
	};
	vaultClient: VaultClient | undefined;
	vaults: {
		[vaultPubKey: string]:
			| {
					vaultDriftClient: DriftClient;
					vaultDriftUser: User; // used to get vault's drift account data (e.g. vault balance)
					vaultDriftUserAccount: UserAccount | undefined; // we store the actual account data so we know when it updates -> object reference will update when account data updates
					vaultAccount: VaultAccount;
					vaultAccountData: Vault; // we store the actual account data so we know when it updates
					vaultDepositorAccount?: VaultDepositorAccount;
					vaultDepositorAccountData?: VaultDepositor; // we store the actual account data so we know when it updates
					eventRecords: { records: WrappedEvents; isLoaded: boolean };
					pnlHistory: {
						dailyAllTimePnls: SerializedPerformanceHistory[];
					};
			  }
			| undefined;
	};
	balances: {
		usdc: number;
	};
	set: (x: (s: AppStoreState) => void) => void;
	get: () => AppStoreState;
	getVaultAccountData: (
		vaultAddress: PublicKey | undefined
	) => Vault | undefined;
	getVaultDepositorAccountData: (
		vaultAddress: PublicKey | undefined
	) => VaultDepositor | undefined;
	getVaultDriftUserAccount: (
		vaultAddress: PublicKey | undefined
	) => UserAccount | undefined;
}

const DEFAULT_APP_STORE_STATE = {
	modals: {
		showConnectWalletModal: false,
		showRpcSwitcherModal: false,
		showStoreModal: false,
		showActionRecordModal: {
			show: false as false,
		},
	},
	vaultClient: undefined,
	vaults: {},
	balances: {
		usdc: 0,
	},
};

const useAppStore = create<AppStoreState>((set, get) => {
	const setProducerFn = (fn: (s: AppStoreState) => void) => set(produce(fn));
	return {
		...DEFAULT_APP_STORE_STATE,
		set: setProducerFn,
		get: () => get(),
		getVaultAccountData: (vaultAddress: PublicKey | undefined) => {
			if (!vaultAddress) return undefined;

			const vault = get().vaults[vaultAddress.toString()];
			return vault?.vaultAccountData;
		},
		getVaultDepositorAccountData: (vaultAddress: PublicKey | undefined) => {
			if (!vaultAddress) return undefined;

			const vault = get().vaults[vaultAddress.toString()];
			return vault?.vaultDepositorAccountData;
		},
		getVaultDriftUserAccount: (vaultAddress: PublicKey | undefined) => {
			if (!vaultAddress) return undefined;

			const vault = get().vaults[vaultAddress.toString()];
			return vault?.vaultDriftUserAccount;
		},
	};
});

export default useAppStore;
