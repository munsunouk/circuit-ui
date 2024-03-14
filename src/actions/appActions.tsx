import { AppStoreState, DEFAULT_VAULT_STATS } from '@/stores/app/useAppStore';
import { CommonDriftStore, PriorityFeeStore } from '@drift-labs/react';
import {
	BN,
	BigNum,
	DRIFT_PROGRAM_ID,
	DriftClient,
	DriftClientConfig,
	PublicKey,
	fetchLogs,
	getMarketsAndOraclesForSubscription,
} from '@drift-labs/sdk';
import {
	LogParser,
	TxParams,
	VAULT_PROGRAM_ID,
	Vault,
	VaultAccount,
	VaultDepositor,
	VaultDepositorAccount,
	WithdrawUnit,
	WrappedEvents,
	getDriftVaultProgram,
	getVaultClient,
	getVaultDepositorAddressSync,
} from '@drift-labs/vaults-sdk';
import { COMMON_UI_UTILS } from '@drift/common';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ToastContent } from 'react-toastify';
import invariant from 'tiny-invariant';
import { StoreApi } from 'zustand';

import { TransactionErrorHandler } from '@/utils/TransactionErrorHandler';
import NOTIFICATION_UTILS, { ToastWithMessage } from '@/utils/notifications';
import { redeemPeriodToString } from '@/utils/utils';

import Env, {
	ARBITRARY_WALLET,
	CIRCUIT_TXN_COMPUTE_UNITS_LIMIT_ESTIMATE,
	SPOT_MARKETS_LOOKUP,
} from '@/constants/environment';

const createAppActions = (
	getCommon: StoreApi<CommonDriftStore>['getState'],
	_setCommon: (x: (s: CommonDriftStore) => void) => void,
	get: StoreApi<AppStoreState>['getState'],
	set: (x: (s: AppStoreState) => void) => void,
	getPriorityFeeToUse: PriorityFeeStore['getPriorityFeeToUse']
) => {
	const getTxParams = (
		computeUnits = CIRCUIT_TXN_COMPUTE_UNITS_LIMIT_ESTIMATE
	): TxParams => {
		const { computeUnitsPrice } = getPriorityFeeToUse(computeUnits);

		console.log(
			`Using compute unit price ${computeUnitsPrice} for tx with ${computeUnits} compute units. Estimated priority fee = ${
				(computeUnitsPrice * computeUnits) / 10 ** 6 / LAMPORTS_PER_SOL
			} SOL`
		);

		return {
			cuPriceMicroLamports: computeUnitsPrice,
			cuLimit: computeUnits,
		};
	};

	const setupVaultClient = () => {
		const state = getCommon();

		invariant(state.connection, 'No connection');
		invariant(state.driftClient.client, 'No drift client');

		const vaultClient = getVaultClient(
			state.connection,
			ARBITRARY_WALLET,
			state.driftClient.client
		);

		set((s) => {
			s.vaultClient = vaultClient;
		});
	};

	/**
	 * Gets on-chain data of the given vault address + pnl snapshot & deposit history
	 * @param vaultAddress The address of the vault
	 */
	const fetchVault = async (vaultAddress: PublicKey) => {
		const state = getCommon();

		invariant(state.connection, 'No connection');
		invariant(state.driftClient.client, 'No drift client');

		// fetch vault on-chain data first
		const [
			{ vaultDriftClient, vaultDriftUser, vaultDriftUserAccount },
			{ vaultSubscriber, vaultAccount },
		] = await Promise.all([
			setupVaultDriftClient(vaultAddress),
			initVaultSubscriber(vaultAddress),
		]);

		// optimistically set vault state without fetching snapshot data first
		const currentVaultState = get().vaults[vaultAddress.toString()];
		const newVaultState = {
			vaultDriftClient,
			vaultDriftUser,
			vaultDriftUserAccount,
			vaultAccount: vaultSubscriber,
			vaultAccountData: vaultAccount,
			isVaultDepositorDataLoaded: false,
			eventRecords: {
				records: [],
				isLoaded: false,
			},
			accountSummary: {
				openPositions: [],
				balances: [],
				openOrders: [],
			},
			vaultStats: currentVaultState?.vaultStats ?? DEFAULT_VAULT_STATS,
		};

		set((s) => {
			if (!currentVaultState) {
				s.vaults[vaultAddress.toString()] = newVaultState;
			} else {
				s.vaults[vaultAddress.toString()] = {
					...currentVaultState,
					...newVaultState,
				};
			}
		});
	};

	const setupVaultDriftClient = async (vaultPubKey: PublicKey) => {
		const commonState = getCommon();
		const accountLoader = commonState.bulkAccountLoader;

		invariant(commonState.connection, 'No connection');
		invariant(accountLoader, 'No account loader');

		// Create Vault's DriftClient
		const newWallet = COMMON_UI_UTILS.createThrowawayIWallet(vaultPubKey);

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
		const userAccounts =
			await vaultDriftClient.getUserAccountsForAuthority(vaultPubKey);

		if (!userAccounts || userAccounts.length === 0) {
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
				if (s.vaults[vaultPubKey.toString()]) {
					s.vaults[vaultPubKey.toString()]!.vaultDriftUserAccount = userAccount;
				}
			});
		});

		return { vaultDriftClient, vaultDriftUser, vaultDriftUserAccount };
	};

	const initVaultSubscriber = async (vaultAddress: PublicKey) => {
		const connection = getCommon().connection;
		const accountLoader = getCommon().bulkAccountLoader;

		invariant(connection, 'No connection');
		invariant(accountLoader, 'No account loader');

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
		const accountLoader = getCommon().bulkAccountLoader;

		if (!authority || !connection || !accountLoader) return;

		const vaultDepositorAddress = getVaultDepositorAddressSync(
			VAULT_PROGRAM_ID,
			vaultAddress,
			authority
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

		let vaultDepositorAccountData: VaultDepositor;
		try {
			vaultDepositorAccountData = vaultDepositorAccount.getData();
		} catch (e) {
			// an error is thrown only if user is not a vault depositor
			await vaultDepositorAccount.unsubscribe();
			set((s) => {
				s.vaults[vaultAddress.toString()]!.eventRecords.isLoaded = true;
				s.vaults[vaultAddress.toString()]!.eventRecords.records = [];
				s.vaults[vaultAddress.toString()]!.vaultDepositorAccount = undefined;
				s.vaults[vaultAddress.toString()]!.vaultDepositorAccountData =
					undefined;
				s.vaults[vaultAddress.toString()]!.isVaultDepositorDataLoaded = true;
			});
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
			s.vaults[vaultAddress.toString()]!.isVaultDepositorDataLoaded = true;
		});
	};

	const fetchVaultDepositorEvents = async (vaultPubKey: PublicKey) => {
		const connection = getCommon().connection;
		const currentRecords =
			get().vaults[vaultPubKey.toString()]?.eventRecords?.records ?? [];
		const mostRecentTx = currentRecords?.[0]?.txSig;
		const vaultClient = get().vaultClient;
		const vaultDepositorPubKey =
			get().vaults[vaultPubKey.toString()]?.vaultDepositorAccountData?.pubkey;

		if (!vaultPubKey || !vaultDepositorPubKey) return;

		invariant(connection, 'No connection');
		invariant(vaultClient, 'No vault client');

		const response = await fetchLogs(
			connection,
			vaultDepositorPubKey,
			'confirmed',
			undefined,
			mostRecentTx
		);

		if (!response) {
			set((s) => {
				s.vaults[vaultPubKey.toString()]!.eventRecords = {
					records: currentRecords,
					isLoaded: true,
				};
			});
			return;
		}

		// @ts-ignore
		const logParser = new LogParser(vaultClient.program);
		const records: WrappedEvents = [];

		response.transactionLogs.forEach((log) => {
			const events = logParser.parseEventsFromLogs(log);
			events.forEach((event) => {
				if (event.eventType === 'VaultDepositorRecord') {
					records.push(event);
				}
			});
		});

		// we want the most recent events first
		records.reverse();

		set((s) => {
			s.vaults[vaultPubKey.toString()]!.eventRecords = {
				records: [...records, ...currentRecords],
				isLoaded: true,
			};
		});
	};

	const depositVault = async (vaultAddress: PublicKey, amount: BN) => {
		try {
			const vaultInfo = get().getVaultAccountData(vaultAddress);
			const vaultDepositor = get().getVaultDepositorAccountData(vaultAddress);
			const connection = getCommon().connection;

			invariant(connection, 'No connection');
			invariant(vaultInfo, 'No vault info in deposit');

			const spotMarketConfig = SPOT_MARKETS_LOOKUP[vaultInfo?.spotMarketIndex];

			if (!vaultDepositor && vaultInfo?.permissioned) {
				NOTIFICATION_UTILS.toast.error(
					'You do not have permission to deposit to this vault.'
				);
				return '';
			}

			const vaultClient = get().vaultClient;
			invariant(vaultClient, 'No vault client');

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
				tx = await vaultClient.deposit(
					vaultDepositorPubkey,
					amount,
					{
						authority,
						vault: vaultAddress,
					},
					getTxParams()
				);

				await connection.confirmTransaction(tx, 'finalized');
				await initVaultDepositorSubscriber(vaultAddress, authority);
			} else {
				tx = await vaultClient.deposit(
					vaultDepositor.pubkey,
					amount,
					undefined,
					getTxParams()
				);
			}

			await handleSentTxn(
				tx,
				`You have successfully deposited ${BigNum.from(
					amount,
					spotMarketConfig.precisionExp
				).prettyPrint()} ${spotMarketConfig.symbol}`
			);

			return tx;
		} catch (err) {
			TransactionErrorHandler.handle(err);
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

			invariant(vaultClient, 'No vault client');
			invariant(vaultDepositor, 'No vault depositor');

			const tx = await vaultClient.requestWithdraw(
				vaultDepositor.pubkey,
				percentage,
				WithdrawUnit.SHARES_PERCENT,
				getTxParams()
			);

			await handleSentTxn(
				tx,
				<ToastWithMessage
					title="Withdrawal Requested"
					message={`You may make your withdrawal in ${redeemPeriodToString(
						vaultAccountData?.redeemPeriod.toNumber()
					)}`}
				/>
			);

			return tx;
		} catch (err) {
			TransactionErrorHandler.handle(err);
		}
	};

	const cancelRequestWithdraw = async (vaultAddress: PublicKey) => {
		try {
			const vaultClient = get().vaultClient;
			const vaultDepositor = get().getVaultDepositorAccountData(vaultAddress);

			invariant(vaultClient, 'No vault client');
			invariant(vaultDepositor, 'No vault depositor');

			const tx = await vaultClient.cancelRequestWithdraw(
				vaultDepositor.pubkey,
				getTxParams()
			);

			await handleSentTxn(
				tx,
				'You have successfully cancelled your withdrawal request'
			);

			return tx;
		} catch (err) {
			TransactionErrorHandler.handle(err);
		}
	};

	const executeVaultWithdrawal = async (
		vaultAddress: PublicKey,
		simulateTransaction: boolean
	) => {
		try {
			const vaultClient = get().vaultClient;
			const vaultDepositor = get().getVaultDepositorAccountData(vaultAddress);

			invariant(vaultClient, 'No vault client');
			invariant(vaultDepositor, 'No vault depositor');

			const tx = await vaultClient.withdraw(vaultDepositor.pubkey, {
				simulateTransaction,
				...getTxParams(),
			});

			await handleSentTxn(tx, 'You have successfully withdrew your funds.');

			return tx;
		} catch (err) {
			TransactionErrorHandler.handle(err);
		}
	};

	const initVaultLiquidation = async (vaultAddress: PublicKey) => {
		const vaultClient = get().vaultClient;
		const vaultDepositor = get().getVaultDepositorAccountData(vaultAddress);

		invariant(vaultClient, 'No vault client');
		invariant(vaultDepositor, 'No vault depositor');

		const tx = await vaultClient
			.liquidate(vaultDepositor.pubkey, getTxParams())
			.catch((err: Error) => TransactionErrorHandler.handle(err));

		return tx;
	};

	/**
	 * Checks if the given tx is confirmed, and if so, shows a success toast.
	 * Used when `skipPreflight` is true. This allows a failed txn to still be sent
	 * to the blockchain, allowing for easy on-chain debugging.
	 */
	const handleSentTxn = async (
		tx: string,
		successMessage: ToastContent<unknown>
	) => {
		const connection = getCommon().connection;
		const driftClient = getCommon().driftClient;

		invariant(connection, 'No connection');

		const latestBlockhash = await connection.getLatestBlockhash(
			driftClient.client?.opts?.commitment ?? 'confirmed'
		);
		const confirmedTx = await connection.confirmTransaction({
			signature: tx,
			...latestBlockhash,
		});
		if (confirmedTx.value.err) {
			const error = new Error(confirmedTx.value.err.toString());
			if ((confirmedTx.value.err as any).InstructionError?.[1].Custom) {
				// @ts-ignore
				error.code = (confirmedTx.value.err as any).InstructionError?.[1]
					.Custom;
			}
			throw error;
		}

		NOTIFICATION_UTILS.toast.success(successMessage);
	};

	return {
		setupVaultClient,
		fetchVault,
		initVaultDepositorSubscriber,
		fetchVaultDepositorEvents,
		depositVault,
		requestVaultWithdrawal,
		cancelRequestWithdraw,
		executeVaultWithdrawal,
		initVaultLiquidation,
	};
};

export default createAppActions;
