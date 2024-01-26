import {
	BN,
	BigNum,
	NINE,
	PRICE_PRECISION_EXP,
	PublicKey,
	SIX,
	ZERO,
} from '@drift-labs/sdk';
import { EnvironmentConstants } from '@drift/common';
import axios from 'axios';
import { desc, eq } from 'drizzle-orm';
import fs from 'fs';

import { db } from '../../database/connect';
import {
	SerializedVaultDepositorRecord,
	SerializedVaultSnapshot,
	vault_depositor_records,
	vault_snapshots,
} from '../../database/schema';
import { setupClients } from '../../utils';
import {
	PTYH_HISTORICAL_API_RATE_LIMIT,
	consoleLog,
	getHistoricalPriceFromPyth,
} from './utils';

/**
 * Steps to produce vault snapshots:
 *
 * 1. Fetch vault depositor records from database (see getVaultDepositorRecordsForVault)
 * 2. Fetch vault drift user snapshots from drift history server (see fetchAndWriteVaultDriftUserSnapshots)
 * 3. Map vault drift user snapshots to vault snapshots (see mapVaultDriftUserSnapshotsToVaultSnapshots)
 * 4. Insert vault snapshots to database (see insertMappedVaultSnapshotsToDb)
 */

type VaultSnapshotImportantDetails = {
	userShares: string; // cannot accurately account
	totalShares: string; // cannot accurately account

	slot: number;
	netDeposits: string;
	totalDeposits: string;
	totalWithdraws: string;
	managerNetDeposits: string;
	managerTotalDeposits: string;
	managerTotalWithdraws: string;
};

const { connection } = setupClients();

const VAULTS = {
	supercharger: {
		pubkey: new PublicKey('GXyE3Snk3pPYX4Nz9QRVBrnBfbJRTAQYxuy5DRdnebAn'),
		user: new PublicKey('BRksHqLiq2gvQw1XxsZq6DXZjD3GB5a9J63tUBgd6QS9'),
		manager: new PublicKey('GT3RSBy5nS2ACpT3LCkycHWm9CVJCSuqErAgf4sE33Qu'),
		marketIndex: 0,
		precisionExp: SIX,
		latestSnapshot: {
			id: 29,
			ts: '1706194821',
			slot: 244042296,
			oraclePrice: '1000000',
			totalAccountQuoteValue: '8163574009727',
			totalAccountBaseValue: '8163574009727',
			vault: 'F3no8aqNZRSkxvMEARC4feHJfvvrST2ZrHzr2NBVyJUr',
			userShares: '7156121552943',
			totalShares: '7223143979668',
			netDeposits: '7857207648810',
			totalDeposits: '7858341199063',
			totalWithdraws: '1133550253',
			totalWithdrawRequested: '171192258634',
			managerNetDeposits: '10000000000',
			managerTotalDeposits: '10000000000',
			managerTotalWithdraws: '0',
			managerTotalProfitShare: '61819800551',
			managerTotalFee: '0',
		},
	},
	turbocharger: {
		pubkey: new PublicKey('F3no8aqNZRSkxvMEARC4feHJfvvrST2ZrHzr2NBVyJUr'),
		user: new PublicKey('2aMcirYcF9W8aTFem6qe8QtvfQ22SLY6KUe6yUQbqfHk'),
		manager: new PublicKey('GT3RSBy5nS2ACpT3LCkycHWm9CVJCSuqErAgf4sE33Qu'),
		marketIndex: 0,
		precisionExp: SIX,
		latestSnapshot: {
			id: 29,
			ts: '1706194821',
			slot: 244042296,
			oraclePrice: '1000000',
			totalAccountQuoteValue: '8163574009727',
			totalAccountBaseValue: '8163574009727',
			vault: 'F3no8aqNZRSkxvMEARC4feHJfvvrST2ZrHzr2NBVyJUr',
			userShares: '7156121552943',
			totalShares: '7223143979668',
			netDeposits: '7857207648810',
			totalDeposits: '7858341199063',
			totalWithdraws: '1133550253',
			totalWithdrawRequested: '171192258634',
			managerNetDeposits: '10000000000',
			managerTotalDeposits: '10000000000',
			managerTotalWithdraws: '0',
			managerTotalProfitShare: '61819800551',
			managerTotalFee: '0',
		},
	},
	jito: {
		pubkey: new PublicKey('ACmnVY5gf1z9UGhzBgnr2bf3h2ZwXW2EDW1w8RC9cQk4'),
		user: new PublicKey('FPMWfMBQp81PkMEBSyaVwadzesfkTkYFbegaaoGBcpPB'),
		manager: new PublicKey('GT3RSBy5nS2ACpT3LCkycHWm9CVJCSuqErAgf4sE33Qu'),
		marketIndex: 6,
		precisionExp: NINE,
		latestSnapshot: {
			id: 27,
			ts: '1706191223',
			slot: 244033565,
			oraclePrice: '94383481',
			totalAccountQuoteValue: '12664345781',
			totalAccountBaseValue: '134179685000',
			vault: 'ACmnVY5gf1z9UGhzBgnr2bf3h2ZwXW2EDW1w8RC9cQk4',
			userShares: '1999701448',
			totalShares: '131027815121',
			netDeposits: '131200536134',
			totalDeposits: '131200536134',
			totalWithdraws: '0',
			totalWithdrawRequested: '0',
			managerNetDeposits: '129200536134',
			managerTotalDeposits: '129200536134',
			managerTotalWithdraws: '0',
			managerTotalProfitShare: '70686',
			managerTotalFee: '0',
		},
	},
};

const getVaultDepositorRecordsForVault = async (vaultPubKey: PublicKey) => {
	const vaultDepositorRecords = await db
		.select()
		.from(vault_depositor_records)
		.where(eq(vault_depositor_records.vault, vaultPubKey.toString()));

	fs.writeFileSync(
		__dirname + `/${vaultPubKey.toString()}-vault-depositor-records.json`,
		JSON.stringify(vaultDepositorRecords, null, 2)
	);
};

// getVaultDepositorRecordsForVault(VAULTS.supercharger.pubkey);

const readVaultDepositorRecordsForVault = (
	vaultPubKey: PublicKey
): SerializedVaultDepositorRecord[] => {
	const vaultDepositorRecords = JSON.parse(
		fs.readFileSync(
			__dirname + `/${vaultPubKey.toString()}-vault-depositor-records.json`,
			'utf-8'
		)
	);

	return vaultDepositorRecords;
};

const getLatestVaultSnapshot = async (vaultPubKey: PublicKey) => {
	const vaultSnapshots = await db
		.select()
		.from(vault_snapshots)
		.where(eq(vault_snapshots.vault, vaultPubKey.toString()))
		.orderBy(desc(vault_snapshots.slot))
		.limit(1);
	console.log(
		'🚀 ~ getLatestVaultSnapshot ~ vaultSnapshots:',
		vaultSnapshots[0]
	);

	return vaultSnapshots[0];
};

const getFinalStateFromVaultDepositorRecords = (
	records: SerializedVaultDepositorRecord[],
	vaultManager: string | PublicKey,
	lastSnapshotTs: number
): VaultSnapshotImportantDetails => {
	const finalState = records
		.filter((record) => +record.ts <= lastSnapshotTs)
		.reduce(
			(state, record) => {
				const isManager = record.depositorAuthority === vaultManager.toString();
				state.slot = record.slot;

				if (record.action === 'deposit') {
					const vaultSharesAdded = new BN(record.vaultSharesAfter).sub(
						new BN(record.vaultSharesBefore)
					);
					state.totalShares = state.totalShares.add(vaultSharesAdded);
					state.netDeposits = state.netDeposits.add(new BN(record.amount));
					state.totalDeposits = state.totalDeposits.add(new BN(record.amount));

					if (isManager) {
						state.managerNetDeposits = state.managerNetDeposits.add(
							new BN(record.amount)
						);
						state.managerTotalDeposits = state.managerTotalDeposits.add(
							new BN(record.amount)
						);
					} else {
						state.userShares = state.userShares.add(vaultSharesAdded);
					}
				} else if (record.action === 'withdraw') {
					const vaultSharesRemoved = new BN(record.vaultSharesBefore).sub(
						new BN(record.vaultSharesAfter)
					);
					state.totalShares = state.totalShares.sub(vaultSharesRemoved);
					state.netDeposits = state.netDeposits.sub(new BN(record.amount));
					state.totalWithdraws = state.totalWithdraws.add(
						new BN(record.amount)
					);
					if (isManager) {
						state.managerNetDeposits = state.managerNetDeposits.sub(
							new BN(record.amount)
						);
						state.managerTotalWithdraws = state.managerTotalWithdraws.add(
							new BN(record.amount)
						);
					} else {
						state.userShares = state.userShares.sub(vaultSharesRemoved);
					}
				} else {
					// do nothing
					// consoleLog('Encountered ' + record.action, ' action');
				}

				return state;
			},
			{
				slot: 0,
				userShares: ZERO,
				totalShares: ZERO,
				netDeposits: ZERO,
				totalDeposits: ZERO,
				totalWithdraws: ZERO,
				managerNetDeposits: ZERO,
				managerTotalDeposits: ZERO,
				managerTotalWithdraws: ZERO,
			}
		);

	return {
		slot: finalState.slot,
		userShares: finalState.userShares.toString(),
		totalShares: finalState.totalShares.toString(),
		netDeposits: finalState.netDeposits.toString(),
		totalDeposits: finalState.totalDeposits.toString(),
		totalWithdraws: finalState.totalWithdraws.toString(),
		managerNetDeposits: finalState.managerNetDeposits.toString(),
		managerTotalDeposits: finalState.managerTotalDeposits.toString(),
		managerTotalWithdraws: finalState.managerTotalWithdraws.toString(),
	};
};

const compareVaultDetails = (
	derived: VaultSnapshotImportantDetails,
	snapshot: VaultSnapshotImportantDetails
) => {
	// Require knowledge of applyProfitShare instructions to get correct number of shares at specific point in time
	consoleLog(
		`userShares -- ${
			derived.userShares === snapshot.userShares ? '✅' : '❌'
		} -- derived: ${derived.userShares} vs snapshot: ${snapshot.userShares}`
	);
	// Require knowledge of applyProfitShare instructions to get correct number of shares at specific point in time
	consoleLog(
		`totalShares -- ${
			derived.totalShares === snapshot.totalShares ? '✅' : '❌'
		} -- derived: ${derived.totalShares} vs snapshot: ${snapshot.totalShares}`
	);
	consoleLog(
		`netDeposits -- ${
			derived.netDeposits === snapshot.netDeposits ? '✅' : '❌'
		} -- derived: ${derived.netDeposits} vs snapshot: ${snapshot.netDeposits}`
	);
	consoleLog(
		`totalDeposits -- ${
			derived.totalDeposits === snapshot.totalDeposits ? '✅' : '❌'
		} -- derived: ${derived.totalDeposits} vs snapshot: ${
			snapshot.totalDeposits
		}`
	);
	consoleLog(
		`totalWithdraws -- ${
			derived.totalWithdraws === snapshot.totalWithdraws ? '✅' : '❌'
		} -- derived: ${derived.totalWithdraws} vs snapshot: ${
			snapshot.totalWithdraws
		}`
	);
	consoleLog(
		`managerNetDeposits -- ${
			derived.managerNetDeposits === snapshot.managerNetDeposits ? '✅' : '❌'
		} -- derived: ${derived.managerNetDeposits} vs snapshot: ${
			snapshot.managerNetDeposits
		}`
	);
	consoleLog(
		`managerTotalDeposits -- ${
			derived.managerTotalDeposits === snapshot.managerTotalDeposits
				? '✅'
				: '❌'
		} -- derived: ${derived.managerTotalDeposits} vs snapshot: ${
			snapshot.managerTotalDeposits
		}`
	);
	consoleLog(
		`managerTotalWithdraws -- ${
			derived.managerTotalWithdraws === snapshot.managerTotalWithdraws
				? '✅'
				: '❌'
		} -- derived: ${derived.managerTotalWithdraws} vs snapshot: ${
			snapshot.managerTotalWithdraws
		}`
	);
};

const fetchAndWriteVaultDriftUserSnapshots = async (
	vaultUserPubKeyString: string
) => {
	const response = await axios.get(
		`${EnvironmentConstants.historyServerUrl.mainnet}/dailyAllTimeUserSnapshots/?userPubKeys=${vaultUserPubKeyString}&pageIndex=0&pageSize=1000`
	);

	const vaultDriftUserSnapshots = response.data.data[0];

	fs.writeFileSync(
		__dirname + `/${vaultUserPubKeyString}-drift-user-snapshots.json`,
		JSON.stringify(vaultDriftUserSnapshots, null, 2)
	);
};

// fetchAndWriteVaultDriftUserSnapshots(VAULTS.supercharger.user.toString());

const readVaultDriftUserSnapshots = (vaultUserPubKeyString: string): any[] => {
	const vaultDriftUserSnapshots = JSON.parse(
		fs.readFileSync(
			__dirname + `/${vaultUserPubKeyString}-drift-user-snapshots.json`,
			'utf-8'
		)
	);

	return vaultDriftUserSnapshots;
};

const mapVaultDriftUserSnapshotsToVaultSnapshots = async (
	vaultDriftUserSnapshots: {
		epochTs: number;
		totalAccountValue: number;
		allTimeTotalPnl: number;
		allTimeTotalPnlPct: number;
	}[],
	vaultDepositorRecords: SerializedVaultDepositorRecord[],
	vault: string,
	marketIndex: number,
	basePrecisionExp: BN
): Promise<Omit<SerializedVaultSnapshot, 'id'>[]> => {
	const vaultSnapshots: Omit<SerializedVaultSnapshot, 'id'>[] = [];
	const RATE_LIMIT_REQUEST_BUFFER = 3;
	const AVERAGE_SLOT_TIME_MS = 415;
	let rateLimitMarker = 0;

	for (const driftSnapshot of vaultDriftUserSnapshots) {
		const vaultStateAtDriftSnapshot = getFinalStateFromVaultDepositorRecords(
			vaultDepositorRecords,
			VAULTS.jito.manager,
			driftSnapshot.epochTs
		);

		if (
			rateLimitMarker > 0 &&
			rateLimitMarker %
				(PTYH_HISTORICAL_API_RATE_LIMIT - RATE_LIMIT_REQUEST_BUFFER) ===
				0
		) {
			consoleLog('sleeping for 60 seconds to avoid rate limit');
			await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
		}

		const oraclePrice = await getHistoricalPriceFromPyth(
			driftSnapshot.epochTs,
			marketIndex
		);
		const totalAccountBaseValue = BigNum.from(
			new BN(driftSnapshot.totalAccountValue),
			PRICE_PRECISION_EXP
		)
			.shift(PRICE_PRECISION_EXP)
			.div(oraclePrice)
			.shiftTo(basePrecisionExp);
		const currentSlot = await connection.getSlot();
		const estimatedSlot =
			currentSlot -
			Math.round(
				(Date.now() - driftSnapshot.epochTs * 1000) / AVERAGE_SLOT_TIME_MS
			);

		vaultSnapshots.push({
			ts: driftSnapshot.epochTs.toString(),
			slot: estimatedSlot,
			oraclePrice: oraclePrice.toString(),
			totalAccountQuoteValue: driftSnapshot.totalAccountValue.toString(),
			totalAccountBaseValue: totalAccountBaseValue.toString(),
			vault: vault,
			userShares: '0', // cannot accurately account
			totalShares: '0', // cannot accurately account
			netDeposits: vaultStateAtDriftSnapshot.netDeposits,
			totalDeposits: vaultStateAtDriftSnapshot.totalDeposits,
			totalWithdraws: vaultStateAtDriftSnapshot.totalWithdraws,
			totalWithdrawRequested: '0', // cannot accurately account
			managerNetDeposits: vaultStateAtDriftSnapshot.managerNetDeposits,
			managerTotalDeposits: vaultStateAtDriftSnapshot.managerTotalDeposits,
			managerTotalWithdraws: vaultStateAtDriftSnapshot.managerTotalWithdraws,
			managerTotalProfitShare: '0', // cannot accurately account
			managerTotalFee: '0', // cannot accurately account
		});

		rateLimitMarker++;
	}

	return vaultSnapshots;
};

const writeMappedVaultSnapshots = async () => {
	const vault = VAULTS.supercharger;

	const vaultDepositorRecords = readVaultDepositorRecordsForVault(vault.pubkey);
	const vaultDriftUserSnapshots = readVaultDriftUserSnapshots(
		vault.user.toString()
	);

	const vaultSnapshots = await mapVaultDriftUserSnapshotsToVaultSnapshots(
		vaultDriftUserSnapshots,
		vaultDepositorRecords,
		vault.pubkey.toString(),
		vault.marketIndex,
		vault.precisionExp
	);

	consoleLog('num of vault snapshots: ' + vaultSnapshots.length);

	fs.writeFileSync(
		__dirname + `/${vault.pubkey.toString()}-vault-snapshots.json`,
		JSON.stringify(vaultSnapshots, null, 2)
	);
};

// writeMappedVaultSnapshots();

const insertMappedVaultSnapshotsToDb = async () => {
	const vault = VAULTS.turbocharger;

	const vaultSnapshots = JSON.parse(
		fs.readFileSync(
			__dirname + `/${vault.pubkey.toString()}-vault-snapshots.json`,
			'utf-8'
		)
	);

	await db.insert(vault_snapshots).values(vaultSnapshots);
};

// insertMappedVaultSnapshotsToDb();
