import { DriftClient, User, UserAccount } from '@drift-labs/sdk';
import {
	Vault,
	VaultClient,
	VaultDepositor,
	VaultDepositorSubscriber,
	VaultSubscriber,
} from '@drift-labs/vaults-sdk';
import { UISnapshotHistory } from '@drift/common';
import { produce } from 'immer';
import { create } from 'zustand';

export interface AppStoreState {
	modals: {
		showConnectWalletModal: boolean;
		showRpcSwitcherModal: boolean;
	};
	vaultClient: VaultClient | undefined;
	vaults: {
		[vaultPubKey: string]:
			| {
					vaultDriftClient: DriftClient;
					vaultDriftUser: User; // used to get vault's drift account data
					vaultDriftUserAccount: UserAccount | undefined;
					vaultSubscriber: VaultSubscriber;
					vaultAccount: Vault;
					vaultDepositorSubscriber?: VaultDepositorSubscriber;
					vaultDepositorAccount?: VaultDepositor;
					pnlHistory: UISnapshotHistory;
			  }
			| undefined;
	};
	balances: {
		usdc: number;
	};
	set: (x: (s: AppStoreState) => void) => void;
	get: () => AppStoreState;
}

const DEFAULT_APP_STORE_STATE = {
	modals: {
		showConnectWalletModal: false,
		showRpcSwitcherModal: false,
	},
	vaultClient: undefined,
	vaultDriftClient: undefined,
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
	};
});

export default useAppStore;
