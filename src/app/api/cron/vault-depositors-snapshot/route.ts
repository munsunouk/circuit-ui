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
import { VAULTS } from '@/constants/vaults';

import { db } from '../../../../../database/connect';
import { vault_depositor_snapshots } from '../../../../../database/schema';
import { setupClients } from '../../../../../utils';

const { driftClient, vaultClient, connection } = setupClients();

const getVaultDepositorDataForSnapshot = async (
	vaultPubKey: PublicKey,
	pythClient: PythHttpClient,
	numOfAttempts = 0
): Promise<void> => {
	/**
	 * Load vault depositors
	 */
	let vaultDepositors: Array<ProgramAccount<VaultDepositor>>;
	let vaultAccount: {
		vault: Vault;
		slot: number;
	};
	let oraclePrice: BN;
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
			`Error fetching vault depositor snapshot data (for vault ${vaultPubKey.toBase58()})`,
			err
		);

		if (numOfAttempts >= 2) {
			console.log('Max attempts reached, skipping vault');
			throw err;
		}

		console.log('Retrying getVaultDepositorDataForSnapshot in 5 seconds');

		await new Promise((resolve) => setTimeout(resolve, 5000));
		return getVaultDepositorDataForSnapshot(
			vaultPubKey,
			pythClient,
			++numOfAttempts
		);
	}

	try {
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
					vault: vaultPubKey.toString(),
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

		await db
			.insert(vault_depositor_snapshots)
			.values(serializedVaultDepositors);
	} catch (err) {
		console.error(
			'Error serializing vault depositor data and inserting to db',
			err
		);

		if (numOfAttempts >= 2) {
			console.log('Max attempts reached, skipping vault');
			throw err;
		}

		console.log('Retrying getVaultDepositorDataForSnapshot in 5 seconds');

		await new Promise((resolve) => setTimeout(resolve, 5000));
		return getVaultDepositorDataForSnapshot(
			vaultPubKey,
			pythClient,
			++numOfAttempts
		);
	}
};

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get('authorization');
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response('Unauthorized', {
			status: 401,
		});
	}

	await driftClient.subscribe();

	const pythClient = new PythHttpClient(connection, PYTH_PROGRAM_ID);

	await Promise.all(
		VAULTS.filter((vault) => !!vault.pubkeyString).map((vault) =>
			getVaultDepositorDataForSnapshot(
				new PublicKey(vault.pubkeyString!),
				pythClient
			)
		)
	);

	return new Response('ok', {
		status: 200,
	});
}
