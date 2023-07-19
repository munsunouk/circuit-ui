import { VaultClient } from '@drift-labs/vaults-sdk';
import { produce } from 'immer';
import { create } from 'zustand';

export interface AppStoreState {
	modals: {
		showConnectWalletModal: boolean;
	};
	vaults: {
		[vaultName: string]: VaultClient; // vault names are unique
	};
	set: (x: (s: AppStoreState) => void) => void;
	get: () => AppStoreState;
}

const DEFAULT_APP_STORE_STATE = {
	modals: {
		showConnectWalletModal: false,
	},
	vaults: {},
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
