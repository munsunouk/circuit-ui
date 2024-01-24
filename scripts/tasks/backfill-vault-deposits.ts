import { PublicKey, fetchLogs } from '@drift-labs/sdk';
import { LogParser, WrappedEvents } from '@drift-labs/vaults-sdk';
import { ENUM_UTILS } from '@drift/common';
import dayjs from 'dayjs';
import { desc, eq } from 'drizzle-orm';

import { db } from '../../database/connect';
import { vault_depositor_records } from '../../database/schema/vault-depositor-records';
import { setupClients } from '../../utils';
import { MAX_TXNS_PER_REQUEST, consoleLog } from './utils';

const { vaultClient, connection } = setupClients();
// @ts-ignore
const logParser = new LogParser(vaultClient.program);

const VAULTS_TO_BACKFILL = [
	new PublicKey('ACmnVY5gf1z9UGhzBgnr2bf3h2ZwXW2EDW1w8RC9cQk4'), // jitosol basis vault
	new PublicKey('GXyE3Snk3pPYX4Nz9QRVBrnBfbJRTAQYxuy5DRdnebAn'), // supercharger vault
	new PublicKey('F3no8aqNZRSkxvMEARC4feHJfvvrST2ZrHzr2NBVyJUr'), // turbocharger vault
];

const recursivelyGetTransactions = async (
	pubkeyToFetch: PublicKey,
	records: WrappedEvents = [],
	beforeTx?: string,
	untilTx?: string
): Promise<WrappedEvents> => {
	try {
		const response = await fetchLogs(
			connection,
			pubkeyToFetch,
			'confirmed',
			beforeTx,
			untilTx
		);

		if (!response) {
			consoleLog('fetch logs response is null');
			return records;
		}

		response.transactionLogs.forEach((log) => {
			const events = logParser.parseEventsFromLogs(log);
			events.forEach((event) => {
				if (event.eventType === 'VaultDepositorRecord') {
					records.push(event);
				}
			});
		});

		if (
			!response ||
			response.transactionLogs.length === 0 ||
			response.transactionLogs.length < MAX_TXNS_PER_REQUEST ||
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

const serializeVaultDepositorRecord = (record: WrappedEvents[0]) => {
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
	};
};

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
