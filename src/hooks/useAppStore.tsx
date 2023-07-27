import { BN, DriftClient, PublicKey } from '@drift-labs/sdk';
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
	vaultDriftClient: DriftClient | undefined; // used to get vault's drift account data
	vaults: {
		// vault names are unique
		[vaultName: string]:
			| {
					vaultDepositorSubscriber?: VaultDepositorSubscriber;
					vaultSubscriber?: VaultSubscriber;
					stats: {
						netUsdValue: BN;
					};
					pnlHistory: UISnapshotHistory;
			  }
			| undefined;
	};
	balances: {
		usdc: number;
	};
	set: (x: (s: AppStoreState) => void) => void;
	get: () => AppStoreState;
	getVaultAccount: (vaultAddress: PublicKey | undefined) => Vault | undefined;
	getVaultDepositor: (
		vaultAddress: PublicKey | undefined
	) => VaultDepositor | undefined;
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
		getVaultAccount: (vaultAddress: PublicKey | undefined) => {
			if (!vaultAddress) return undefined;

			const vault = get().vaults[vaultAddress.toString()];
			return vault?.vaultSubscriber?.getUserAccountAndSlot().data;
		},
		getVaultDepositor: (vaultAddress: PublicKey | undefined) => {
			if (!vaultAddress) return undefined;

			const vault = get().vaults[vaultAddress.toString()];
			return vault?.vaultDepositorSubscriber?.getUserAccountAndSlot().data;
		},
	};
});

export default useAppStore;
