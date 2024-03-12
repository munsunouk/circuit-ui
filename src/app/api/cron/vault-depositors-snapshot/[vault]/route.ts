import { ProgramAccount } from '@coral-xyz/anchor';
import {
	BN,
	BigNum,
	PRICE_PRECISION_EXP,
	PublicKey,
	QUOTE_PRECISION_EXP,
} from '@drift-labs/sdk';
import { Vault, VaultDepositor } from '@drift-labs/vaults-sdk';
import { PythHttpClient } from '@pythnetwork/client';
import dayjs from 'dayjs';
import { NextRequest } from 'next/server';
import invariant from 'tiny-invariant';

import {
	MARKET_INDEX_TO_PYTH_SYMBOL_MAP,
	PYTH_PROGRAM_ID,
	SPOT_MARKETS_LOOKUP,
} from '@/constants/environment';

import { db } from '../../../../../../database/connect';
import { vault_depositor_snapshots } from '../../../../../../database/schema';
import { setupClients } from '../../../../../../utils';

const { driftClient, vaultClient, connection } = setupClients();

const getVaultDepositorDataForSnapshot = async (
	vaultPubKey: PublicKey,
	pythClient: PythHttpClient,
	numOfAttempts = 0
): Promise<void> => {
	/**
	 * Load vault depositors
	 */
	const vaultPubKeyStr = vaultPubKey.toBase58();
	let vaultDepositors: Array<ProgramAccount<VaultDepositor>> = [];
	let vaultAccount: {
		vault: Vault;
		slot: number;
	};
	let oraclePrice: BN;
	const startFetchVds = Date.now();
	try {
		vaultAccount = await vaultClient.getVaultAndSlot(vaultPubKey);
		vaultDepositors = await vaultClient.getAllVaultDepositors(vaultPubKey);

		const pythData = await pythClient.getData();
		const symbol =
			MARKET_INDEX_TO_PYTH_SYMBOL_MAP[vaultAccount.vault.spotMarketIndex];
		invariant(
			symbol,
			'Pyth symbol not found for market index ' +
				vaultAccount.vault.spotMarketIndex
		);
		const priceData = pythData.productPrice.get(symbol);
		invariant(priceData, 'Pyth price data not found for symbol ' + symbol);
		oraclePrice = BigNum.fromPrint(
			priceData.aggregate.price?.toString() ?? '',
			PRICE_PRECISION_EXP
		).val;
	} catch (err) {
		console.error(
			`[vault: ${vaultPubKeyStr}] Error fetching vault depositor snapshot data (for vault ${vaultPubKeyStr})`,
			err
		);

		if (numOfAttempts >= 2) {
			console.log(
				'[vault: ${vaultPubKeyStr}] Max attempts reached, skipping vault'
			);
			throw err;
		}

		console.log(
			'[vault: ${vaultPubKeyStr}] Retrying getVaultDepositorDataForSnapshot in 5 seconds'
		);

		await new Promise((resolve) => setTimeout(resolve, 5000));
		return getVaultDepositorDataForSnapshot(
			vaultPubKey,
			pythClient,
			++numOfAttempts
		);
	} finally {
		console.log(
			`[vault: ${vaultPubKeyStr}] Fetched ${
				vaultDepositors.length
			} depositors for ${vaultPubKeyStr} in ${Date.now() - startFetchVds}ms.`
		);
	}

	try {
		const startSerialized = Date.now();
		const vaultTotalQuoteValue = await vaultClient.calculateVaultEquity({
			vault: vaultAccount.vault,
		});
		const vaultTotalBaseValue = BigNum.from(
			vaultTotalQuoteValue,
			QUOTE_PRECISION_EXP
		)
			.shift(PRICE_PRECISION_EXP)
			.div(BigNum.from(oraclePrice, PRICE_PRECISION_EXP))
			.shiftTo(
				SPOT_MARKETS_LOOKUP[vaultAccount.vault.spotMarketIndex].precisionExp
			);

		const serializedVaultDepositors = vaultDepositors.map(
			(vd: ProgramAccount<VaultDepositor>) => {
				return {
					ts: dayjs().unix().toString(),
					slot: vaultAccount.slot,
					oraclePrice: oraclePrice.toString(),
					totalAccountQuoteValue: vaultTotalQuoteValue.toString(),
					totalAccountBaseValue: vaultTotalBaseValue.toString(),
					vault: vaultPubKeyStr,
					vaultDepositor: vd.publicKey.toString(),
					authority: vd.account.authority.toString(),
					vaultShares: vd.account.vaultShares.toString(),
					lastWithdrawRequestShares:
						vd.account.lastWithdrawRequest.shares.toString(),
					lastWithdrawRequestValue:
						vd.account.lastWithdrawRequest.value.toString(),
					lastWithdrawRequestTs: vd.account.lastWithdrawRequest.ts.toString(),
					lastValidTs: vd.account.lastValidTs.toString(),
					netDeposits: vd.account.netDeposits.toString(),
					totalDeposits: vd.account.totalDeposits.toString(),
					totalWithdraws: vd.account.totalWithdraws.toString(),
					cumulativeProfitShareAmount:
						vd.account.cumulativeProfitShareAmount.toString(),
					vaultSharesBase: vd.account.vaultSharesBase,
					profitShareFeePaid: vd.account.profitShareFeePaid.toString(),
				};
			}
		);

		console.log(
			`[vault: ${vaultPubKeyStr}] Serialized ${
				vaultDepositors.length
			} depositors for ${vaultPubKeyStr} in ${Date.now() - startSerialized}ms.`
		);

		const startInsert = Date.now();
		let totalInsertedRows = 0;
		let chunks = 0;
		for (let i = 0; i < serializedVaultDepositors.length; i += 500) {
			chunks++;
			try {
				const chunk = serializedVaultDepositors.slice(i, i + 500);
				const res = await db.insert(vault_depositor_snapshots).values(chunk);
				totalInsertedRows += res.rowCount;
			} catch (err) {
				console.error(
					`[vault: ${vaultPubKeyStr}] Error inserting chunk ${i} to ${
						i + 500
					} of ${
						serializedVaultDepositors.length
					} depositors for ${vaultPubKeyStr}`,
					err
				);
			}
		}
		console.log(
			`[vault: ${vaultPubKeyStr}] Inserted ${totalInsertedRows} rows for ${
				serializedVaultDepositors.length
			} depositors in ${Date.now() - startInsert}ms. Chunks: ${chunks}`
		);
	} catch (err) {
		console.error(
			'[vault: ${vaultPubKeyStr}] Error serializing vault depositor data and inserting to db',
			err
		);

		if (numOfAttempts >= 2) {
			console.log(
				'[vault: ${vaultPubKeyStr}] Max attempts reached, skipping vault'
			);
			throw err;
		}

		console.log(
			'[vault: ${vaultPubKeyStr}] Retrying getVaultDepositorDataForSnapshot in 1 seconds'
		);

		await new Promise((resolve) => setTimeout(resolve, 1000));
		return getVaultDepositorDataForSnapshot(
			vaultPubKey,
			pythClient,
			++numOfAttempts
		);
	}
};

export async function GET(
	request: NextRequest,
	{ params }: { params: { vault: string } }
) {
	const vault = params.vault;
	const authHeader = request.headers.get('authorization');
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response('Unauthorized', {
			status: 401,
		});
	}

	await driftClient.subscribe();

	const pythClient = new PythHttpClient(connection, PYTH_PROGRAM_ID);

	const startSnapshot = Date.now();
	try {
		getVaultDepositorDataForSnapshot(new PublicKey(vault), pythClient);
		return new Response('ok', {
			status: 200,
		});
	} catch (err) {
		console.error(
			`[vault: ${vault}] Error performing vault depositor snapshot.`,
			err
		);
		return new Response('error', {
			status: 500,
		});
	} finally {
		console.log(
			`[vault: ${vault}] Performed vault depositor snapshot in ${
				Date.now() - startSnapshot
			}ms.`
		);
	}
}
