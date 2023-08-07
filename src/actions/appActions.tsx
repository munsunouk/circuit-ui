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
	Vault,
	VaultAccount,
	VaultDepositor,
	VaultDepositorAccount,
	WithdrawUnit,
	getDriftVaultProgram,
	getVaultClient,
	getVaultDepositorAddressSync,
} from '@drift-labs/vaults-sdk';
import {
	COMMON_UI_UTILS,
	HistoryResolution,
	UISnapshotHistory,
} from '@drift/common';
import { Commitment } from '@solana/web3.js';
import axios from 'axios';
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
	 * Gets on-chain data of the given vault address
	 * @param vaultAddress The address of the vault
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

		const [
			{ vaultDriftClient, vaultDriftUser, vaultDriftUserAccount },
			{ vaultSubscriber, vaultAccount },
		] = await Promise.all([
			setupVaultDriftClient(vaultAddress),
			initVaultSubscriber(vaultAddress),
		]);

		const vaultSnapshots = await fetchAndSetVaultSnapshots(vaultAccount.user);

		set((s) => {
			s.vaultClient = vaultClient;

			s.vaults[vaultAddress.toString()] = {
				vaultDriftClient,
				vaultDriftUser,
				vaultDriftUserAccount,
				vaultAccount: vaultSubscriber,
				vaultAccountData: vaultAccount,
				pnlHistory: vaultSnapshots,
			};
		});
	};

	const fetchAndSetVaultSnapshots = async (userAccount: PublicKey) => {
		try {
			const res = await axios.get<{ data: UISnapshotHistory[] }>(
				`${
					Env.historyServerUrl
				}/userSnapshots/?userPubKeys=${userAccount.toString()}`
			);

			const snapshots = res.data.data;

			return snapshots[0];
		} catch (err) {
			console.error(err);

			return {
				[HistoryResolution.DAY]: [],
				[HistoryResolution.WEEK]: [],
				[HistoryResolution.MONTH]: [],
				[HistoryResolution.ALL]: [],
				dailyAllTimePnls: [],
			};
		}
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
		const vaultDriftUser = vaultDriftClient.getUser(0, vaultPubKey);
		const vaultDriftUserAccount = vaultDriftClient.getUserAccount(
			0,
			vaultPubKey
		);

		vaultDriftClient.eventEmitter.on('update', () => {
			set((s) => {
				if (s.vaults[vaultPubKey.toString()]) {
					s.vaults[vaultPubKey.toString()]!.vaultDriftClient = vaultDriftClient;
					s.vaults[vaultPubKey.toString()]!.vaultDriftUser = vaultDriftUser;
				}
			});
		});

		vaultDriftUser.eventEmitter.on('userAccountUpdate', (userAccount) => {
			set((s) => {
				s.vaults[vaultPubKey.toString()]!.vaultDriftUserAccount = userAccount;
			});
		});

		return { vaultDriftClient, vaultDriftUser, vaultDriftUserAccount };
	};

	const initVaultSubscriber = async (vaultAddress: PublicKey) => {
		const connection = getCommon().connection;

		if (!connection) throw new Error('No connection');

		const accountLoader = new BulkAccountLoader(
			connection,
			DEFAULT_COMMITMENT_LEVEL,
			POLLING_FREQUENCY_MS
		);
		const newWallet = COMMON_UI_UTILS.createThrowawayIWallet(vaultAddress);

		const driftVaultsProgram = getDriftVaultProgram(connection, newWallet);

		const vaultAccount = new VaultAccount(
			driftVaultsProgram,
			vaultAddress,
			accountLoader
		);
		await vaultAccount.subscribe();
		const vaultAccountData = vaultAccount.getData();

		vaultAccount.eventEmitter.on('update', () => {
			set((s) => {
				s.vaults[vaultAddress.toString()]!.vaultAccount = vaultAccount;
			});
		});

		vaultAccount.eventEmitter.on('vaultUpdate', (newVaultData) => {
			set((s) => {
				s.vaults[vaultAddress.toString()]!.vaultAccountData =
					newVaultData as Vault;
			});
		});

		return { vaultSubscriber: vaultAccount, vaultAccount: vaultAccountData };
	};

	const initVaultDepositorSubscriber = async (
		vaultAddress: PublicKey,
		authority: PublicKey
	) => {
		const connection = getCommon().connection;

		if (!authority || !connection) return;

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

		const vaultDepositorAccount = new VaultDepositorAccount(
			driftVaultsProgram,
			vaultDepositorAddress,
			accountLoader
		);
		await vaultDepositorAccount.subscribe();
		const vaultDepositorAccountData = vaultDepositorAccount.getData();

		if (!vaultDepositorAccountData) {
			console.log('User is not a vault depositor');
			await vaultDepositorAccount.unsubscribe();
			return;
		}

		vaultDepositorAccount.eventEmitter.on('update', () => {
			set((s) => {
				s.vaults[vaultAddress.toString()]!.vaultDepositorAccount =
					vaultDepositorAccount;
			});
		});

		vaultDepositorAccount.eventEmitter.on(
			'vaultDepositorUpdate',
			(newVaultDepositorData) => {
				set((s) => {
					s.vaults[vaultAddress.toString()]!.vaultDepositorAccountData =
						newVaultDepositorData as VaultDepositor;
				});
			}
		);

		set((s) => {
			s.vaults[vaultAddress.toString()]!.vaultDepositorAccount =
				vaultDepositorAccount;
			s.vaults[vaultAddress.toString()]!.vaultDepositorAccountData =
				vaultDepositorAccountData;
		});
	};

	const depositVault = async (vaultAddress: PublicKey, amount: BN) => {
		try {
			const vaultInfo = get().getVaultAccountData(vaultAddress);
			const vaultDepositor = get().getVaultDepositorAccountData(vaultAddress);
			const connection = getCommon().connection;

			if (!connection) throw new Error('No connection');

			if (!vaultDepositor && vaultInfo?.permissioned) {
				NOTIFICATION_UTILS.toast.error(
					'You do not have permission to deposit to this vault.'
				);
				return '';
			}

			const vaultClient = get().vaultClient;

			if (!vaultClient) {
				throw new Error('No vault client');
			}

			let tx: string;
			if (!vaultDepositor) {
				// init vault depositor with deposit ix
				const authority = getCommon().authority;
				if (!authority) {
					NOTIFICATION_UTILS.toast.error('Please connect your wallet first!');
					return '';
				}

				const vaultDepositorPubkey = VaultDepositorAccount.getAddressSync(
					VAULT_PROGRAM_ID,
					vaultAddress,
					authority
				);
				tx = await vaultClient.deposit(vaultDepositorPubkey, amount, {
					authority,
					vault: vaultAddress,
				});

				await connection.confirmTransaction(tx, 'finalized');
				await initVaultDepositorSubscriber(vaultAddress, authority);
			} else {
				tx = await vaultClient.deposit(vaultDepositor.pubkey, amount);
			}

			NOTIFICATION_UTILS.toast.success(
				`You have successfully deposited ${BigNum.from(
					amount,
					QUOTE_PRECISION_EXP
				).prettyPrint()} USDC`
			);

			return tx;
		} catch (err) {
			console.error(err);
			NOTIFICATION_UTILS.toast.error('Something went wrong. Please try again.');
		}
	};

	const requestVaultWithdrawal = async (
		vaultAddress: PublicKey,
		percentage: BN
	) => {
		try {
			const vaultClient = get().vaultClient;
			const vaultAccountData = get().getVaultAccountData(vaultAddress);
			const vaultDepositor = get().getVaultDepositorAccountData(vaultAddress);

			if (!vaultClient || !vaultDepositor) {
				throw new Error('No vault client/vault depositor found');
			}

			const tx = await vaultClient.requestWithdraw(
				vaultDepositor.pubkey,
				percentage,
				WithdrawUnit.SHARES_PERCENT
			);

			NOTIFICATION_UTILS.toast.success(
				<ToastWithMessage
					title="Withdrawal Requested"
					message={`You may make your withdrawal in ${redeemPeriodToString(
						vaultAccountData?.redeemPeriod
					)}`}
				/>
			);

			return tx;
		} catch (err) {
			console.error(err);
			NOTIFICATION_UTILS.toast.error('Something went wrong. Please try again.');
		}
	};

	const cancelRequestWithdraw = async (vaultAddress: PublicKey) => {
		try {
			const vaultClient = get().vaultClient;
			const vaultDepositor = get().getVaultDepositorAccountData(vaultAddress);

			if (!vaultClient || !vaultDepositor) {
				throw new Error('No vault client/vault depositor found');
			}

			const tx = await vaultClient.cancelRequestWithdraw(vaultDepositor.pubkey);

			NOTIFICATION_UTILS.toast.success(
				'You have successfully cancelled your withdrawal request'
			);

			return tx;
		} catch (err) {
			console.error(err);
			NOTIFICATION_UTILS.toast.error('Something went wrong. Please try again.');
		}
	};

	const executeVaultWithdrawal = async (vaultAddress: PublicKey) => {
		const vaultClient = get().vaultClient;
		const vaultDepositor = get().getVaultDepositorAccountData(vaultAddress);

		if (!vaultClient || !vaultDepositor) {
			throw new Error('No vault client/vault depositor found');
		}

		const tx = await vaultClient.withdraw(vaultDepositor.pubkey);

		return tx;
	};

	return {
		fetchVault,
		initVaultDepositorSubscriber,
		depositVault,
		requestVaultWithdrawal,
		cancelRequestWithdraw,
		executeVaultWithdrawal,
	};
};

export default createAppActions;
