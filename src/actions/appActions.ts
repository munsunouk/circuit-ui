import { CommonDriftStore } from '@drift-labs/react';
import {
	BN,
	BulkAccountLoader,
	DRIFT_PROGRAM_ID,
	DriftClient,
	DriftClientConfig,
	IWallet,
	PublicKey,
	getMarketsAndOraclesForSubscription,
} from '@drift-labs/sdk';
import {
	VAULT_PROGRAM_ID,
	Vault,
	WithdrawUnit,
	getVaultClient,
	getVaultDepositorAddressSync,
} from '@drift-labs/vaults-sdk';
import { Commitment, Keypair } from '@solana/web3.js';
import { StoreApi } from 'zustand';

import { AppStoreState } from '@/hooks/useAppStore';

import NOTIFICATION_UTILS from '@/utils/notifications';

import Env, { ARBITRARY_WALLET } from '@/constants/environment';
import { VaultDepositor } from '@drift-labs/vaults-sdk';

const POLLING_FREQUENCY_MS = 1000;
const DEFAULT_COMMITMENT_LEVEL: Commitment = 'confirmed';

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

		const vaultClient = getVaultClient(
			state.connection,
			ARBITRARY_WALLET,
			state.driftClient.client
		);
		const vault = (await vaultClient.getVault(vaultAddress)) as Vault;

		await setupVaultDriftClient(vaultAddress);

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

	const setupVaultDriftClient = async (vaultPubKey: PublicKey) => {
		const commonState = getCommon();

		if (!commonState.connection) {
			throw new Error('No connection');
		}

		// Create Vault's DriftClient
		const newKeypair = new Keypair({
			publicKey: vaultPubKey.toBytes(),
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

		const accountLoader = new BulkAccountLoader(
			commonState.connection,
			DEFAULT_COMMITMENT_LEVEL,
			POLLING_FREQUENCY_MS
		);
		const { oracleInfos, perpMarketIndexes, spotMarketIndexes } =
			getMarketsAndOraclesForSubscription(Env.driftEnv);
		const vaultDriftClientConfig: DriftClientConfig = {
			connection: commonState.connection,
			wallet: newWallet,
			programID: new PublicKey(DRIFT_PROGRAM_ID),
			env: Env.driftEnv,
			txVersion: 0,
			userStats: true,
			perpMarketIndexes: perpMarketIndexes,
			spotMarketIndexes: spotMarketIndexes,
			oracleInfos: oracleInfos,
			accountSubscription: {
				type: 'polling',
				accountLoader: accountLoader,
			},
		};

		const vaultDriftClient = new DriftClient(vaultDriftClientConfig);
		const userAccounts = await vaultDriftClient.getUserAccountsForAuthority(
			vaultPubKey
		);

		if (!userAccounts) {
			throw new Error(
				'No user account found for vault:' + vaultPubKey.toString()
			);
		}

		await Promise.all(
			userAccounts.map((account) =>
				vaultDriftClient.addUser(account.subAccountId, vaultPubKey)
			)
		);

		// Subscribe to Vault's DriftClient
		const subscriptionResult = await vaultDriftClient.subscribe();

		if (!subscriptionResult) {
			// retry once
			await vaultDriftClient.subscribe();
		}

		vaultDriftClient.eventEmitter.on('update', () => {
			set((s) => {
				s.vaultDriftClient = vaultDriftClient;
			});
		});

		set((s) => {
			s.vaultDriftClient = vaultDriftClient;
		});

		return subscriptionResult;
	};

	const fetchVaultStats = async (vaultAddress: PublicKey) => {
		const commonState = getCommon();
		const appState = get();

		if (!commonState.connection || !appState.vaultDriftClient) {
			throw new Error('No connection');
		}

		const user = appState.vaultDriftClient.getUser(0, vaultAddress);

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
		const vaultClient = get().vaultClient;
		const currentStoredVaultExists = !!get().vaults[vaultAddress.toString()];

		if (!authority || !currentStoredVaultExists || !vaultClient) return;

		const vaultDepositorAddress = getVaultDepositorAddressSync(
			VAULT_PROGRAM_ID,
			vaultAddress,
			authority
		);

		const vaultDepositor = (await vaultClient.getVaultDepositor(
			vaultDepositorAddress
		)) as VaultDepositor;

		set((s) => {
			s.vaults[vaultAddress.toString()]!.vaultDepositor = vaultDepositor;
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

		const tx = await vaultClient.deposit(vaultDepositor!.pubkey, amount);

		return tx;
	};

	const requestVaultWithdrawal = async (
		vaultAddress: PublicKey,
		sharesAmount: BN
	): Promise<string> => {
		const vaultClient = get().vaultClient;
		const vaultDepositor =
			get().vaults[vaultAddress.toString()]?.vaultDepositor;

		if (!vaultClient || !vaultDepositor) {
			throw new Error('No vault client/vault depositor found');
		}

		const tx = await vaultClient.requestWithdraw(
			vaultDepositor.pubkey,
			sharesAmount,
			WithdrawUnit.SHARES
		);

		return tx;
	};

	return {
		fetchVault,
		fetchVaultStats,
		fetchVaultDepositor,
		depositVault,
		requestVaultWithdrawal,
	};
};

export default createAppActions;
