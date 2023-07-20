import { CommonDriftStore } from '@drift-labs/react';
import { BN, IWallet, PublicKey } from '@drift-labs/sdk';
import {
	VAULT_PROGRAM_ID,
	Vault,
	getVaultClient,
	getVaultDepositorAddressSync,
} from '@drift-labs/vaults-sdk';
import { Keypair } from '@solana/web3.js';
import { StoreApi } from 'zustand';

import { AppStoreState } from '@/hooks/useAppStore';

import NOTIFICATION_UTILS from '@/utils/notifications';

import { ARBITRARY_WALLET } from '@/constants/environment';

const createAppActions = (
	getCommon: StoreApi<CommonDriftStore>['getState'],
	_setCommon: (x: (s: CommonDriftStore) => void) => void,
	get: StoreApi<AppStoreState>['getState'],
	set: (x: (s: AppStoreState) => void) => void
) => {
	/**
	 * Gets on-chain data of the given vault name
	 * @param vaultAddress The name of the vault
	 */
	const fetchVault = async (vaultAddress: PublicKey) => {
		const state = getCommon();

		if (!state.connection || !state.driftClient.client) {
			throw new Error('No connection');
		}

		const arbitraryVaultClient = getVaultClient(
			state.connection,
			ARBITRARY_WALLET,
			state.driftClient.client
		);
		const vault = (await arbitraryVaultClient.getVault(vaultAddress)) as Vault;

		// TODO: abstract this into common-ts
		const newKeypair = new Keypair({
			publicKey: vault.pubkey.toBytes(),
			secretKey: new Keypair().publicKey.toBytes(),
		});
		const newWallet: IWallet = {
			publicKey: newKeypair.publicKey,
			//@ts-ignore
			signTransaction: () => {
				return Promise.resolve();
			},
			//@ts-ignore
			signAllTransactions: () => {
				return Promise.resolve();
			},
		};

		const success = await state.driftClient.client.updateWallet(
			newWallet as IWallet
		);

		if (!success) {
			throw new Error('Unsuccessful update of drift client wallet.');
		}

		const vaultClient = getVaultClient(
			state.connection,
			newWallet,
			state.driftClient.client
		);

		const currentStoredVaultExists = !!get().vaults[vaultAddress.toString()];
		set((s) => {
			s.vaultClient = vaultClient;

			if (currentStoredVaultExists) {
				s.vaults[vaultAddress.toString()]!.info = vault;
			} else {
				s.vaults[vaultAddress.toString()] = {
					info: vault,
					stats: {
						netUsdValue: new BN(0),
					},
				};
			}
		});

		return vault;
	};

	const fetchVaultStats = async (vaultAddress: PublicKey) => {
		const state = getCommon();

		if (!state.connection || !state.driftClient.client) {
			throw new Error('No connection');
		}

		const user = state.driftClient.client.getUser(0, vaultAddress);

		const collateral = user.getNetSpotMarketValue();
		const unrealizedPNL = user.getUnrealizedPNL();
		const netUsdValue = collateral.add(unrealizedPNL);

		const currentStoredVaultExists = !!get().vaults[vaultAddress.toString()];
		set((s) => {
			if (currentStoredVaultExists) {
				s.vaults[vaultAddress.toString()]!.stats = {
					netUsdValue,
				};
			}
		});
	};

	const fetchVaultDepositor = async (
		vaultAddress: PublicKey,
		authority: PublicKey
	) => {
		const currentStoredVaultExists = !!get().vaults[vaultAddress.toString()];

		if (!authority || !currentStoredVaultExists) return;

		const vaultDepositorAddress = getVaultDepositorAddressSync(
			VAULT_PROGRAM_ID,
			vaultAddress,
			authority
		);

		set((s) => {
			s.vaults[vaultAddress.toString()]!.vaultDepositor = vaultDepositorAddress;
		});
	};

	const depositVault = async (
		vaultAddress: PublicKey,
		amount: BN
	): Promise<string> => {
		const vaultInfo = get().vaults[vaultAddress.toString()]?.info;
		const vaultDepositor =
			get().vaults[vaultAddress.toString()]?.vaultDepositor;

		if (!vaultDepositor && vaultInfo?.permissioned) {
			NOTIFICATION_UTILS.toast.error(
				'You do not have permission to deposit to this vault.'
			);
			return '';
		}

		if (!vaultDepositor) {
			// TODO: initialize vault depositor for non-permissioned vault
		}

		const vaultClient = get().vaultClient;

		if (!vaultClient) {
			throw new Error('No vault client');
		}

		const tx = await vaultClient.deposit(vaultDepositor!, amount);

		return tx;
	};

	return {
		fetchVault,
		fetchVaultStats,
		fetchVaultDepositor,
		depositVault,
	};
};

export default createAppActions;
