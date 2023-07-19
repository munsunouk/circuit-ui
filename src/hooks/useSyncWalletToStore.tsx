import { useCommonDriftActions, useCommonDriftStore } from '@drift-labs/react';
import { BASE_PRECISION_EXP, BigNum } from '@drift-labs/sdk';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';

import useAppStore from './useAppStore';

/**
 * Keeps the authority and connected state of `WalletContext` from `@solana/wallet-adapter-react` updated in the app store when the wallet connects, disconnects, or changes.
 *
 * Also sets SOL balance in the store to 0 on disconnect.
 */
const useSyncWalletToStore = () => {
	const actions = useCommonDriftActions();
	const set = useCommonDriftStore((s) => s.set);
	const walletContextState = useWallet();

	const setStore = useAppStore((s) => s.set);

	const closeConnectWalletModal = () => {
		setStore((s) => {
			s.modals.showConnectWalletModal = false;
		});
	};

	useEffect(() => {
		walletContextState?.wallet?.adapter?.on('connect', () => {
			console.log('connecting');
			const authority = walletContextState?.wallet?.adapter?.publicKey;

			set((s) => {
				s.currentSolBalance = {
					value: new BigNum(0, BASE_PRECISION_EXP),
					loaded: false,
				};
				s.authority = authority;
				s.authorityString = authority?.toString() || '';
			});

			if (authority && walletContextState.wallet?.adapter) {
				closeConnectWalletModal();
				actions.handleWalletConnect(
					authority,
					walletContextState.wallet?.adapter
				);
			}
		});

		walletContextState?.wallet?.adapter?.on('disconnect', () => {
			set((s) => {
				s.currentSolBalance = {
					value: new BigNum(0, BASE_PRECISION_EXP),
					loaded: false,
				};
				s.authority = undefined;
				s.authorityString = '';
			});

			actions.handleWalletDisconnect();
		});

		return () => {
			console.log('adapter changed, firing off');
			walletContextState?.wallet?.adapter.off('connect');
			walletContextState?.wallet?.adapter.off('disconnect');
		};
	}, [walletContextState?.wallet?.adapter]);
};

export default useSyncWalletToStore;
