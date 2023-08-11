import { SerializedPerformanceHistory } from '@/types';
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
	fetchLogs,
	getMarketsAndOraclesForSubscription,
} from '@drift-labs/sdk';
import {
	LogParser,
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
import {
	COMMON_UI_UTILS,
	HistoryResolution,
	UISerializableAccountSnapshot,
	UISnapshotHistory,
} from '@drift/common';
import { Commitment } from '@solana/web3.js';
import axios from 'axios';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import invariant from 'tiny-invariant';
import { StoreApi } from 'zustand';

import { AppStoreState } from '@/hooks/useAppStore';

import NOTIFICATION_UTILS, { ToastWithMessage } from '@/utils/notifications';
import { normalizeDate, redeemPeriodToString } from '@/utils/utils';

import Env, { ARBITRARY_WALLET } from '@/constants/environment';
import { VAULTS } from '@/constants/vaults';

dayjs.extend(isSameOrAfter);

const POLLING_FREQUENCY_MS = 1000;
const DEFAULT_COMMITMENT_LEVEL: Commitment = 'confirmed';

const createAppActions = (
	getCommon: StoreApi<CommonDriftStore>['getState'],
	_setCommon: (x: (s: CommonDriftStore) => void) => void,
	get: StoreApi<AppStoreState>['getState'],
	set: (x: (s: AppStoreState) => void) => void
) => {
	const setupVaultClient = () => {
		const state = getCommon();

		if (!state.connection || !state.driftClient.client) {
			throw new Error('No connection');
		}

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
	 * Gets on-chain data of the given vault address
	 * @param vaultAddress The address of the vault
	 */
	const fetchVault = async (vaultAddress: PublicKey) => {
		const state = getCommon();

		if (!state.connection || !state.driftClient.client) {
			throw new Error('No connection');
		}

		const [
			{ vaultDriftClient, vaultDriftUser, vaultDriftUserAccount },
			{ vaultSubscriber, vaultAccount },
		] = await Promise.all([
			setupVaultDriftClient(vaultAddress),
			initVaultSubscriber(vaultAddress),
		]);

		const vaultSnapshots = await fetchVaultSnapshots(vaultAccount.user);
		const combinedSnapshotsHistories = combineVaultHistories(
			vaultAddress.toString(),
			vaultSnapshots
		);
		const currentVaultState = get().vaults[vaultAddress.toString()];
		const updatedVaultState = {
			vaultDriftClient,
			vaultDriftUser,
			vaultDriftUserAccount,
			vaultAccount: vaultSubscriber,
			vaultAccountData: vaultAccount,
			pnlHistory: combinedSnapshotsHistories,
		};

		set((s) => {
			if (!currentVaultState) {
				s.vaults[vaultAddress.toString()] = updatedVaultState;
			} else {
				s.vaults[vaultAddress.toString()] = {
					...currentVaultState,
					...updatedVaultState,
				};
			}
		});
	};

	const fetchVaultSnapshots = async (userAccount: PublicKey) => {
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

	const combineVaultHistories = (
		vaultAddress: string,
		snapshot: UISnapshotHistory
	) => {
		const uiVaultConfig = VAULTS.find(
			(vault) => vault.pubkeyString === vaultAddress
		);
		const pastVaultHistory = uiVaultConfig?.pastPerformanceHistory ?? [];
		const formattedPastHistory = pastVaultHistory.map((history) => ({
			...history,
			totalAccountValue: history.totalAccountValue.toNum(),
			allTimeTotalPnl: history.allTimeTotalPnl.toNum(),
		}));

		const formattedSnapshotHistory = {
			[HistoryResolution.DAY]: combineVaultHistoriesForResolution(
				formattedPastHistory,
				snapshot[HistoryResolution.DAY],
				HistoryResolution.DAY,
				dayjs().subtract(2, 'day').startOf('day')
			),
			[HistoryResolution.WEEK]: combineVaultHistoriesForResolution(
				formattedPastHistory,
				snapshot[HistoryResolution.WEEK],
				HistoryResolution.WEEK,
				dayjs().subtract(1, 'week').startOf('day')
			),
			[HistoryResolution.MONTH]: combineVaultHistoriesForResolution(
				formattedPastHistory,
				snapshot[HistoryResolution.MONTH],
				HistoryResolution.MONTH,
				dayjs().subtract(1, 'month').startOf('day')
			),
			[HistoryResolution.ALL]: combineVaultHistoriesForResolution(
				formattedPastHistory,
				snapshot[HistoryResolution.ALL],
				HistoryResolution.ALL,
				dayjs.unix(0)
			),
			dailyAllTimePnls: snapshot.dailyAllTimePnls,
		};

		return formattedSnapshotHistory;
	};

	// Combines a vault's past history with snapshot history.
	// If there is overlap in data, e.g. both histories have a snapshot on 2021-08-01,
	// it will sum the values of both histories (on the assumption that funds is being
	// flowed from an old vault to a new vault)
	const combineVaultHistoriesForResolution = (
		pastHistory: SerializedPerformanceHistory[],
		snapshotHistory: UISerializableAccountSnapshot[],
		resolution: HistoryResolution,
		firstDate: dayjs.Dayjs
	) => {
		const lastPointInPastHistory = pastHistory[pastHistory.length - 1] ?? {
			totalAccountValue: 0,
			allTimeTotalPnl: 0,
			epochTs: 0,
		};
		let firstOverlappingPointIndex = -1;

		const formattedSnapshotHistory = snapshotHistory
			// if data overlap, add point in past history that corresponds to the date of data point
			// if data don't overlap, add last point in past history to data point
			.map((snapshot) => {
				const currentDate = normalizeDate(snapshot.epochTs);
				const overlappingPastHistoryDataPointIndex = pastHistory.findIndex(
					(history) => history.epochTs === currentDate
				);

				if (overlappingPastHistoryDataPointIndex >= 0) {
					const overlappingPastHistoryDataPoint =
						pastHistory[overlappingPastHistoryDataPointIndex];
					if (firstOverlappingPointIndex === -1) {
						firstOverlappingPointIndex = overlappingPastHistoryDataPointIndex;
					}

					return {
						epochTs: normalizeDate(snapshot.epochTs, resolution),
						totalAccountValue:
							+snapshot.totalAccountValue +
							overlappingPastHistoryDataPoint.totalAccountValue,
						allTimeTotalPnl:
							overlappingPastHistoryDataPoint.allTimeTotalPnl +
							+snapshot.allTimeTotalPnl,
					};
				} else {
					return {
						epochTs: normalizeDate(snapshot.epochTs, resolution),
						// allow for data continuation from past history
						totalAccountValue:
							+snapshot.totalAccountValue +
							lastPointInPastHistory.totalAccountValue,
						allTimeTotalPnl:
							+snapshot.allTimeTotalPnl +
							lastPointInPastHistory.allTimeTotalPnl,
					};
				}
			});

		const combinedHistory = pastHistory
			.slice(0, firstOverlappingPointIndex)
			.concat(formattedSnapshotHistory);
		const withinResolutionHistory = combinedHistory.filter((point) =>
			dayjs.unix(point.epochTs).isSameOrAfter(firstDate)
		);

		return withinResolutionHistory;
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
	};
};

export default createAppActions;
