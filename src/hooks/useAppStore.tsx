import { DriftClient, PublicKey, User, UserAccount } from '@drift-labs/sdk';
import {
	Vault,
	VaultAccount,
	VaultClient,
	VaultDepositor,
	VaultDepositorAccount,
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
					vaultDriftUser: User; // used to get vault's drift account data (e.g. vault balance)
					vaultDriftUserAccount: UserAccount | undefined; // we store the actual account data so we know when it updates -> object reference will update when account data updates
					vaultAccount: VaultAccount;
					vaultAccountData: Vault; // we store the actual account data so we know when it updates
					vaultDepositorAccount?: VaultDepositorAccount;
					vaultDepositorAccountData?: VaultDepositor; // we store the actual account data so we know when it updates
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
	getVaultDriftUserAccount: (
		vaultAddress: PublicKey | undefined
	) => UserAccount | undefined;
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
			return vault?.vaultAccountData;
		},
		getVaultDepositor: (vaultAddress: PublicKey | undefined) => {
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
