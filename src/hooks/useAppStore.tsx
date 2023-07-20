import { BN } from '@drift-labs/sdk';
import { Vault, VaultClient } from '@drift-labs/vaults-sdk';
import { produce } from 'immer';
import { create } from 'zustand';

export interface AppStoreState {
	modals: {
		showConnectWalletModal: boolean;
	};
	vaultClient: VaultClient | undefined;
	vaults: {
		// vault names are unique
		[vaultName: string]:
			| {
					info: Vault;
					stats: {
						netUsdValue: BN;
					};
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
	};
});

export default useAppStore;
