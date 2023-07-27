import { CommonDriftStore } from '@drift-labs/react';
import {
	BN,
	BigNum,
	BulkAccountLoader,
	DRIFT_PROGRAM_ID,
	DriftClient,
	DriftClientConfig,
	PublicKey,
	QUOTE_PRECISION_EXP,
	getMarketsAndOraclesForSubscription,
} from '@drift-labs/sdk';
import {
	VAULT_PROGRAM_ID,
	VaultDepositorSubscriber,
	VaultSubscriber,
	WithdrawUnit,
	getDriftVaultProgram,
	getVaultClient,
	getVaultDepositorAddressSync,
} from '@drift-labs/vaults-sdk';
import { COMMON_UI_UTILS, HistoryResolution } from '@drift/common';
import { Commitment } from '@solana/web3.js';
import { StoreApi } from 'zustand';

import { AppStoreState } from '@/hooks/useAppStore';

import NOTIFICATION_UTILS, { ToastWithMessage } from '@/utils/notifications';
import { redeemPeriodToString } from '@/utils/utils';

import Env, { ARBITRARY_WALLET } from '@/constants/environment';

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

		const [vaultDriftClient, vaultSubscriber] = await Promise.all([
			setupVaultDriftClient(vaultAddress),
			initVaultSubscriber(vaultAddress),
		]);

		set((s) => {
			s.vaultDriftClient = vaultDriftClient;
			s.vaultClient = vaultClient;

			s.vaults[vaultAddress.toString()] = {
				vaultSubscriber: vaultSubscriber,
				stats: {
					netUsdValue: new BN(0),
				},
				pnlHistory: {
					[HistoryResolution.DAY]: [],
					[HistoryResolution.WEEK]: [],
					[HistoryResolution.MONTH]: [],
					[HistoryResolution.ALL]: [],
					dailyAllTimePnls: [],
				},
			};
		});
	};

	const setupVaultDriftClient = async (vaultPubKey: PublicKey) => {
		const commonState = getCommon();

		if (!commonState.connection) {
			throw new Error('No connection');
		}

		// Create Vault's DriftClient
		const newWallet = COMMON_UI_UTILS.createThrowawayIWallet(vaultPubKey);

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

		return vaultDriftClient;
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

	const initVaultSubscriber = async (vaultAddress: PublicKey) => {
		const connection = getCommon().connection;

		if (!connection) return;

		const accountLoader = new BulkAccountLoader(
			connection,
			DEFAULT_COMMITMENT_LEVEL,
			POLLING_FREQUENCY_MS
		);
		const newWallet = COMMON_UI_UTILS.createThrowawayIWallet(vaultAddress);

		const driftVaultsProgram = getDriftVaultProgram(connection, newWallet);

		const vaultSubscriber = new VaultSubscriber(
			driftVaultsProgram,
			vaultAddress,
			accountLoader
		);
		await vaultSubscriber.subscribe();

		vaultSubscriber.eventEmitter.on('update', () => {
			set((s) => {
				s.vaults[vaultAddress.toString()]!.vaultSubscriber = vaultSubscriber;
			});
		});

		return vaultSubscriber;
	};

	const initVaultDepositorSubscriber = async (
		vaultAddress: PublicKey,
		authority: PublicKey
	) => {
		const connection = getCommon().connection;
		const currentStoredVaultExists = !!get().vaults[vaultAddress.toString()];

		if (!authority || !currentStoredVaultExists || !connection) return;

		const vaultDepositorAddress = getVaultDepositorAddressSync(
			VAULT_PROGRAM_ID,
			vaultAddress,
			authority
		);

		const accountLoader = new BulkAccountLoader(
			connection,
			DEFAULT_COMMITMENT_LEVEL,
			POLLING_FREQUENCY_MS
		);
		const newWallet = COMMON_UI_UTILS.createThrowawayIWallet(
			vaultDepositorAddress
		);

		const driftVaultsProgram = getDriftVaultProgram(connection, newWallet);

		const vaultDepositorSubscriber = new VaultDepositorSubscriber(
			driftVaultsProgram,
			vaultDepositorAddress,
			accountLoader
		);
		await vaultDepositorSubscriber.subscribe();

		vaultDepositorSubscriber.eventEmitter.on('update', () => {
			set((s) => {
				s.vaults[vaultAddress.toString()]!.vaultDepositorSubscriber =
					vaultDepositorSubscriber;
			});
		});

		set((s) => {
			s.vaults[vaultAddress.toString()]!.vaultDepositorSubscriber =
				vaultDepositorSubscriber;
		});
	};

	const depositVault = async (vaultAddress: PublicKey, amount: BN) => {
		try {
			const vaultInfo = get().getVaultAccount(vaultAddress);
			const vaultDepositor = get().getVaultDepositor(vaultAddress);

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

			NOTIFICATION_UTILS.toast.success(
				`You have successfully deposited ${BigNum.from(
					amount,
					QUOTE_PRECISION_EXP
				).prettyPrint()} USDC`
			);

			return tx;
		} catch (err) {
			NOTIFICATION_UTILS.toast.error('Something went wrong. Please try again.');
		}
	};

	const requestVaultWithdrawal = async (
		vaultAddress: PublicKey,
		sharesAmount: BN
	) => {
		try {
			const vaultClient = get().vaultClient;
			const vaultDepositor = get().getVaultDepositor(vaultAddress);
			const vaultInfo = get().getVaultAccount(vaultAddress);

			if (!vaultClient || !vaultDepositor) {
				throw new Error('No vault client/vault depositor found');
			}

			const tx = await vaultClient.requestWithdraw(
				vaultDepositor.pubkey,
				sharesAmount,
				WithdrawUnit.SHARES
			);

			NOTIFICATION_UTILS.toast.success(
				<ToastWithMessage
					title="Withdrawal Requested"
					message={`You may make your withdrawal in ${redeemPeriodToString(
						vaultInfo?.redeemPeriod
					)}`}
				/>
			);

			return tx;
		} catch (err) {
			NOTIFICATION_UTILS.toast.error('Something went wrong. Please try again.');
		}
	};

	const cancelRequestWithdraw = async (vaultAddress: PublicKey) => {
		try {
			const vaultClient = get().vaultClient;
			const vaultDepositor = get().getVaultDepositor(vaultAddress);

			if (!vaultClient || !vaultDepositor) {
				throw new Error('No vault client/vault depositor found');
			}

			const tx = await vaultClient.cancelRequestWithdraw(vaultDepositor.pubkey);

			NOTIFICATION_UTILS.toast.success(
				'You have successfully cancelled your withdrawal request'
			);

			return tx;
		} catch (err) {
			NOTIFICATION_UTILS.toast.error('Something went wrong. Please try again.');
		}
	};

	const executeVaultWithdrawal = async (vaultAddress: PublicKey) => {
		const vaultClient = get().vaultClient;
		const vaultDepositor = get().getVaultDepositor(vaultAddress);

		if (!vaultClient || !vaultDepositor) {
			throw new Error('No vault client/vault depositor found');
		}

		const tx = await vaultClient.withdraw(vaultDepositor.pubkey);

		return tx;
	};

	return {
		fetchVault,
		fetchVaultStats,
		initVaultSubscriber,
		initVaultDepositorSubscriber,
		depositVault,
		requestVaultWithdrawal,
		cancelRequestWithdraw,
		executeVaultWithdrawal,
	};
};

export default createAppActions;
