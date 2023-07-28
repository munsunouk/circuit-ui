import { useCommonDriftStore, useDriftClientIsReady } from '@drift-labs/react';
import { PublicKey } from '@drift-labs/sdk';
import { UISnapshotHistory } from '@drift/common';
import axios from 'axios';
import { useEffect } from 'react';

import NOTIFICATION_UTILS from '@/utils/notifications';

import Env from '@/constants/environment';

import { useAppActions } from './useAppActions';
import useAppStore from './useAppStore';
import useCurrentVaultAccount from './useCurrentVaultAccount';
import usePathToVaultPubKey from './usePathToVaultName';

/**
 * Fetches
 * - Vault account
 * - Vault's Drift User account
 * - Vault Depositor
 * - Vault PnL History
 */
export default function useFetchVault() {
	const driftClientIsReady = useDriftClientIsReady();
	const appActions = useAppActions();
	const vaultPubKey = usePathToVaultPubKey();
	const authority = useCommonDriftStore((s) => s.authority);
	const setAppStore = useAppStore((s) => s.set);
	const vaultAccount = useCurrentVaultAccount();

	// fetch vault account, vault drift account
	useEffect(() => {
		if (driftClientIsReady && vaultPubKey) {
			fetchAllVaultInformation(vaultPubKey);
		}
	}, [driftClientIsReady, vaultPubKey]);

	// fetch vault depositor
	useEffect(() => {
		if (vaultPubKey && authority && vaultAccount) {
			appActions.initVaultDepositorSubscriber(vaultPubKey, authority);
		}
	}, [vaultPubKey, authority, !!vaultAccount]);

	// fetch vault pnl history
	useEffect(() => {
		if (vaultAccount && vaultPubKey) {
			fetchVaultSnapshots(vaultAccount.user, vaultPubKey).then(() => {});
		}
	}, [!!vaultAccount, vaultPubKey]);

	const fetchAllVaultInformation = async (vaultPubKey: PublicKey) => {
		try {
			await appActions.fetchVault(vaultPubKey);
		} catch (err) {
			console.error(err);
			NOTIFICATION_UTILS.toast.error('Error fetching vault data');
		}
	};

	const fetchVaultSnapshots = async (
		userAccount: PublicKey,
		vaultPubKey: PublicKey
	) => {
		const res = await axios.get<{ data: UISnapshotHistory[] }>(
			`${
				Env.historyServerUrl
			}/userSnapshots/?userPubKeys=${userAccount.toString()}`
		);

		const snapshots = res.data.data;

		setAppStore((s) => {
			s.vaults[vaultPubKey.toString()]!.pnlHistory = snapshots[0];
		});
	};
}
