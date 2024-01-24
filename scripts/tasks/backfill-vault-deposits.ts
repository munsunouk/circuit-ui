import {
	BN,
	BigNum,
	DepositRecord,
	LogParser as DriftLogParser,
	PRICE_PRECISION_EXP,
	PublicKey,
	SpotMarkets,
	ZERO,
	fetchLogs,
} from '@drift-labs/sdk';
import {
	VaultDepositorAction,
	LogParser as VaultsLogParser,
	WrappedEvent,
} from '@drift-labs/vaults-sdk';
import { ENUM_UTILS } from '@drift/common';
import dayjs from 'dayjs';
import { desc, eq } from 'drizzle-orm';
import invariant from 'tiny-invariant';

import { db } from '../../database/connect';
import {
	SerializedVaultDepositorRecord,
	vault_depositor_records,
} from '../../database/schema/vault-depositor-records';
import { setupClients } from '../../utils';
import {
	MAX_TXNS_BUFFER,
	MAX_TXNS_PER_REQUEST,
	consoleLog,
	getHistoricalPriceFromPyth,
} from './utils';

type VaultDepositorRecordWithPrices = WrappedEvent<'VaultDepositorRecord'> & {
	assetPrice: BN;
	notionalValue: BN;
};

const { driftClient, vaultClient, connection } = setupClients();
// @ts-ignore
const vaultsLogParser = new VaultsLogParser(vaultClient.program);
const driftLogParser = new DriftLogParser(driftClient.program);

const VAULTS_TO_BACKFILL = [
	new PublicKey('ACmnVY5gf1z9UGhzBgnr2bf3h2ZwXW2EDW1w8RC9cQk4'), // jitosol basis vault
	new PublicKey('GXyE3Snk3pPYX4Nz9QRVBrnBfbJRTAQYxuy5DRdnebAn'), // supercharger vault
	new PublicKey('F3no8aqNZRSkxvMEARC4feHJfvvrST2ZrHzr2NBVyJUr'), // turbocharger vault
];

const getSpotMarketConfig = (spotMarketIndex: number) => {
	const spotMarket = SpotMarkets['mainnet-beta'].find(
		(market) => market.marketIndex === spotMarketIndex
	);

	if (!spotMarket)
		throw new Error(
			'Spot market not found for market index ' + spotMarketIndex
		);

	return spotMarket;
};

const reconcileVaultAndDriftEvents = (
	vaultDepositorRecordEvent: WrappedEvent<'VaultDepositorRecord'>,
	depositRecordEvent: DepositRecord
): VaultDepositorRecordWithPrices => {
	const oraclePrice = depositRecordEvent.oraclePrice;
	const amount = depositRecordEvent.amount;
	const notionalValue = amount
		.mul(oraclePrice)
		.div(
			getSpotMarketConfig(vaultDepositorRecordEvent.spotMarketIndex).precision
		);

	const recordWithPrices = {
		...vaultDepositorRecordEvent,
		amount, // amount from DepositRecord is the source of truth, because amount is 0 for VaultDepositorRecord when the vault manager deposits
		assetPrice: oraclePrice,
		notionalValue,
	};

	return recordWithPrices;
};

const handleReconciliationOnOracleStaleError = async (
	vaultDepositorRecordEvent: WrappedEvent<'VaultDepositorRecord'>,
	logs: string[]
) => {
	const regex = /\buser_withdraw_amount:\s*(\d+)/g;
	const logContainingAmount = logs.find((log) => regex.test(log));
	invariant(
		logContainingAmount,
		'Cannot find amount in logs for tx: ' + vaultDepositorRecordEvent.txSig
	);

	const amount = logContainingAmount.split('user_withdraw_amount: ')[1];
	invariant(
		amount !== null,
		'Cannot find amount in logs for tx: ' + vaultDepositorRecordEvent.txSig
	);
	invariant(
		/^\d+$/.test(amount),
		'Extracted amount is not a number: ' +
			amount +
			' tx: ' +
			vaultDepositorRecordEvent.txSig
	);

	const spotMarketConfig = getSpotMarketConfig(
		vaultDepositorRecordEvent.spotMarketIndex
	);
	const amountBigNum = BigNum.from(
		new BN(amount),
		spotMarketConfig.precisionExp
	);
	const oraclePriceBigNum = await getHistoricalPriceFromPyth(
		+vaultDepositorRecordEvent.ts,
		vaultDepositorRecordEvent.spotMarketIndex
	);
	const notionalValue = amountBigNum
		.mul(oraclePriceBigNum)
		.shiftTo(PRICE_PRECISION_EXP).val;

	const recordWithPrices = {
		...vaultDepositorRecordEvent,
		amount: amountBigNum.val,
		assetPrice: oraclePriceBigNum.val,
		notionalValue,
	};

	return recordWithPrices;
};

const recursivelyGetTransactions = async (
	pubkeyToFetch: PublicKey,
	records: VaultDepositorRecordWithPrices[] = [],
	beforeTx?: string,
	untilTx?: string
): Promise<VaultDepositorRecordWithPrices[]> => {
	try {
		const response = await fetchLogs(
			connection,
			pubkeyToFetch,
			'confirmed',
			beforeTx,
			untilTx
		);

		if (!response) {
			consoleLog('fetch logs response is null, ending transactions fetch');
			return records;
		}

		for (const log of response.transactionLogs) {
			const vaultsEvents = vaultsLogParser.parseEventsFromLogs(log);
			for (const vaultsEvent of vaultsEvents) {
				if (vaultsEvent.eventType === 'VaultDepositorRecord') {
					if (
						ENUM_UTILS.match(
							vaultsEvent.action,
							VaultDepositorAction.DEPOSIT
						) ||
						ENUM_UTILS.match(vaultsEvent.action, VaultDepositorAction.WITHDRAW)
					) {
						let driftEvents: ReturnType<
							typeof driftLogParser.parseEventsFromLogs
						> = [];

						try {
							driftEvents = driftLogParser.parseEventsFromLogs(log);
						} catch (err) {
							const rawLogs = log.logs;
							const isOracleStaleError = rawLogs.some((log) =>
								log.includes('Invalid Oracle: Stale')
							);

							if (isOracleStaleError) {
								const recordWithPrices =
									await handleReconciliationOnOracleStaleError(
										vaultsEvent,
										rawLogs
									);

								records.push(recordWithPrices);
								continue;
							}

							console.error(err);
						}
						const driftDepositEvent = driftEvents.find(
							(event) => event.eventType === 'DepositRecord'
						);

						if (!driftDepositEvent)
							throw new Error(
								"Cannot find Drift 'DepositRecord' event for tx: " +
									vaultsEvent.txSig
							);

						const recordWithPrices = reconcileVaultAndDriftEvents(
							vaultsEvent,
							driftDepositEvent as DepositRecord
						);
						records.push(recordWithPrices);
					} else {
						// other actions like withdraw request, cancel withdraw request, fee payment, etc
						records.push({
							...vaultsEvent,
							assetPrice: ZERO,
							notionalValue: ZERO,
						});
					}
				}
			}
		}

		if (
			!response ||
			response.transactionLogs.length === 0 ||
			response.transactionLogs.length <
				MAX_TXNS_PER_REQUEST - MAX_TXNS_BUFFER || // sometimes the response is less than the max txns per request even though there are old txns, so we add a buffer
			response.earliestTx === response.mostRecentTx
		) {
			consoleLog('fetch ended with num of records:', records.length);
			return records;
		} else {
			consoleLog('response continued with num of records:', records.length);
			return recursivelyGetTransactions(
				pubkeyToFetch,
				records,
				response.earliestTx
			);
		}
	} catch (err) {
		console.error(err);

		return records;
	}
};

const serializeVaultDepositorRecord = (
	record: VaultDepositorRecordWithPrices
): Omit<SerializedVaultDepositorRecord, 'id'> => {
	return {
		ts: record.ts.toString(),
		txSig: record.txSig,
		slot: record.slot,
		vault: record.vault.toString(),
		action: ENUM_UTILS.toStr(record.action),
		amount: record.amount.toString(),
		spotMarketIndex: record.spotMarketIndex,
		vaultSharesBefore: record.vaultSharesBefore.toString(),
		vaultSharesAfter: record.vaultSharesAfter.toString(),
		depositorAuthority: record.depositorAuthority.toString(),
		vaultEquityBefore: record.vaultEquityBefore.toString(),
		userVaultSharesBefore: record.userVaultSharesBefore.toString(),
		totalVaultSharesBefore: record.totalVaultSharesBefore.toString(),
		userVaultSharesAfter: record.userVaultSharesAfter.toString(),
		totalVaultSharesAfter: record.totalVaultSharesAfter.toString(),
		profitShare: record.profitShare.toString(),
		managementFee: record.managementFee.toString(),
		managementFeeShares: record.managementFeeShares.toString(),
		assetPrice: record.assetPrice.toString(),
		notionalValue: record.notionalValue.toString(),
	};
};

/**
 * Backfills the vault deposit records in the database for a given vault.
 * It fetches the latest transaction signature and timestamp for the vault from the database,
 * retrieves all vault depositor records after the latest transaction,
 * and then inserts these records into the database.
 */
const backfillVaultDeposits = async (vaultPubKey: PublicKey) => {
	console.log('\n');
	consoleLog('backfilling vault: ' + vaultPubKey.toString());

	const latestTxSignatureResult = await db
		.select({
			txSig: vault_depositor_records.txSig,
			ts: vault_depositor_records.ts,
		})
		.from(vault_depositor_records)
		.where(eq(vault_depositor_records.vault, vaultPubKey.toString()))
		.orderBy(desc(vault_depositor_records.slot))
		.limit(1);
	const latestTxSignature = latestTxSignatureResult?.[0]?.txSig;
	const latestTs = latestTxSignatureResult?.[0]?.ts;
	consoleLog('latest tx signature:', latestTxSignature);
	consoleLog(
		'latest tx timestamp:',
		dayjs.unix(+latestTs).format('DD/MM/YYYY HH:mm:ss')
	);

	consoleLog('attempting to get all vault depositor records');
	const allVaultDepositorRecords = await recursivelyGetTransactions(
		vaultPubKey,
		[],
		undefined,
		latestTxSignature
	);

	if (!allVaultDepositorRecords || allVaultDepositorRecords.length === 0) {
		consoleLog('no records to insert. exiting script');
		return;
	}

	const serializedSortedVaultDepositorRecords = allVaultDepositorRecords.map(
		serializeVaultDepositorRecord
	);

	consoleLog('attempting db insert');
	await db
		.insert(vault_depositor_records)
		.values(serializedSortedVaultDepositorRecords);
	consoleLog('db insert complete');
};

export const backfillSupportedVaultsDeposits = async () => {
	for (const vaultPubKey of VAULTS_TO_BACKFILL) {
		await backfillVaultDeposits(vaultPubKey);
	}
};
