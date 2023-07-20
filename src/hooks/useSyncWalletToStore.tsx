import { useCommonDriftActions, useCommonDriftStore } from '@drift-labs/react';
import { BASE_PRECISION_EXP, BigNum } from '@drift-labs/sdk';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';

import { useAppActions } from './useAppActions';
import useAppStore from './useAppStore';

/**
 * Keeps the authority and connected state of `WalletContext` from `@solana/wallet-adapter-react` updated in the app store when the wallet connects, disconnects, or changes.
 *
 * Also sets SOL balance in the store to 0 on disconnect.
 */
const useSyncWalletToStore = () => {
	const commonActions = useCommonDriftActions();
	const setCommonStore = useCommonDriftStore((s) => s.set);
	const walletContextState = useWallet();

	const setAppStore = useAppStore((s) => s.set);

	const closeConnectWalletModal = () => {
		setAppStore((s) => {
			s.modals.showConnectWalletModal = false;
		});
	};

	useEffect(() => {
		walletContextState?.wallet?.adapter?.on('connect', async () => {
			console.log('connecting');
			const authority = walletContextState?.wallet?.adapter?.publicKey;

			setCommonStore((s) => {
				s.currentSolBalance = {
					value: new BigNum(0, BASE_PRECISION_EXP),
					loaded: false,
				};
				s.authority = authority;
				s.authorityString = authority?.toString() || '';
			});

			if (authority && walletContextState.wallet?.adapter) {
				closeConnectWalletModal();
				commonActions.handleWalletConnect(
					authority,
					walletContextState.wallet?.adapter
				);
			}
		});

		walletContextState?.wallet?.adapter?.on('disconnect', () => {
			setCommonStore((s) => {
				s.currentSolBalance = {
					value: new BigNum(0, BASE_PRECISION_EXP),
					loaded: false,
				};
				s.authority = undefined;
				s.authorityString = '';
			});

			commonActions.handleWalletDisconnect();
		});

		return () => {
			console.log('adapter changed, firing off');
			walletContextState?.wallet?.adapter.off('connect');
			walletContextState?.wallet?.adapter.off('disconnect');
		};
	}, [walletContextState?.wallet?.adapter]);
};

export default useSyncWalletToStore;
