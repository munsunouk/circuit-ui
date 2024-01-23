import { PublicKey, fetchLogs } from '@drift-labs/sdk';
import {
	LogParser,
	VaultDepositorRecord,
	WrappedEvents,
} from '@drift-labs/vaults-sdk';
import { ENUM_UTILS } from '@drift/common';

import { db } from '../../database/connect';
import { vault_depositor_records } from '../../database/schema/vault-depositor-records';
import { setupClients } from '../../utils';

const { vaultClient, connection } = setupClients();

const VAULT_TO_BACKFILL = new PublicKey(
	'F3no8aqNZRSkxvMEARC4feHJfvvrST2ZrHzr2NBVyJUr' // turbocharger
);

// @ts-ignore
const logParser = new LogParser(vaultClient.program);

const recursivelyGetTransactions = async (
	pubkeyToFetch: PublicKey,
	records: WrappedEvents = [],
	beforeTx?: string
): Promise<WrappedEvents> => {
	try {
		const response = await fetchLogs(
			connection,
			pubkeyToFetch,
			'confirmed',
			beforeTx
		);

		if (!response) {
			console.log('response is null');
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
			response.earliestTx === response.mostRecentTx
		) {
			console.log('response ended:', response);
			return records;
		} else {
			console.log('response continued with num of records:', records.length);
			return recursivelyGetTransactions(
				pubkeyToFetch,
				records,
				response.earliestTx
			);
		}
	} catch (err) {
		console.log('🚀 ~ err:', err);

		return records;
	}
};

const serializeVaultDepositorRecord = (record: VaultDepositorRecord) => {
	return {
		ts: record.ts.toString(),
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

const backfillVaultDeposits = async (vaultPubKeyString: PublicKey) => {
	// TODO: get the latest tx signature from the db, and pass it in as untilTx

	console.log('attempting to get all vault depositor records');
	const allVaultDepositorRecords =
		await recursivelyGetTransactions(vaultPubKeyString);
	console.log('got all vault depositor records');

	const sortedVaultDepositorRecords: VaultDepositorRecord[] =
		allVaultDepositorRecords.sort((a, b) => {
			return a.slot - b.slot;
		});

	const serializedSortedVaultDepositorRecords = sortedVaultDepositorRecords.map(
		serializeVaultDepositorRecord
	);

	console.log('attempting db insert');
	await db
		.insert(vault_depositor_records)
		.values(serializedSortedVaultDepositorRecords);
	console.log('db insert complete');
};

backfillVaultDeposits(VAULT_TO_BACKFILL);
