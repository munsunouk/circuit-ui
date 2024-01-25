import {
	BN,
	BigNum,
	PRICE_PRECISION,
	PRICE_PRECISION_EXP,
	PublicKey,
	QUOTE_PRECISION_EXP,
} from '@drift-labs/sdk';
import { VaultAccount } from '@drift-labs/vaults-sdk';
import { USDC_SPOT_MARKET_INDEX } from '@drift/common';
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
import {
	SerializedVaultSnapshot,
	vault_snapshots,
} from '../../../../../database/schema';
import { setupClients } from '../../../../../utils';

const { driftClient, vaultClient, accountLoader, connection } = setupClients();

const getVaultDataForSnapshot = async (
	vaultPubKey: PublicKey,
	pythClient: PythHttpClient
): Promise<Omit<SerializedVaultSnapshot, 'id'>> => {
	const vault = new VaultAccount(
		vaultClient.program,
		vaultPubKey,
		accountLoader,
		'polling'
	);

	await vault.subscribe();

	const vaultAccountData = vault.getData();
	const slot = vault.accountSubscriber.getAccountAndSlot().slot;
	const vaultTotalQuoteValue = await vaultClient.calculateVaultEquity({
		address: vaultPubKey,
	});

	let oraclePrice: BN;

	if (vaultAccountData.spotMarketIndex === USDC_SPOT_MARKET_INDEX) {
		oraclePrice = PRICE_PRECISION; // $1
	} else {
		const pythData = await pythClient.getData();
		const symbol =
			MARKET_INDEX_TO_PYTH_SYMBOL_MAP[vaultAccountData.spotMarketIndex];
		invariant(
			symbol,
			'Pyth symbol not found for market index ' +
				vaultAccountData.spotMarketIndex
		);
		const priceData = pythData.productPrice.get(symbol);
		invariant(priceData, 'Pyth price data not found for symbol ' + symbol);
		oraclePrice = BigNum.fromPrint(
			priceData.price?.toString() ?? '',
			PRICE_PRECISION_EXP
		).val;
	}

	const vaultTotalBaseValue = BigNum.from(
		vaultTotalQuoteValue,
		QUOTE_PRECISION_EXP
	)
		.shift(PRICE_PRECISION_EXP)
		.div(BigNum.from(oraclePrice, PRICE_PRECISION_EXP))
		.shiftTo(
			SPOT_MARKETS_LOOKUP[vaultAccountData.spotMarketIndex].precisionExp
		);

	const serializedData = {
		ts: dayjs().unix().toString(),
		slot,
		oraclePrice: oraclePrice.toString(),
		totalAccountQuoteValue: vaultTotalQuoteValue.toString(),
		totalAccountBaseValue: vaultTotalBaseValue.toString(),
		vault: vaultPubKey.toString(),
		userShares: vaultAccountData.userShares.toString(),
		totalShares: vaultAccountData.totalShares.toString(),
		netDeposits: vaultAccountData.netDeposits.toString(),
		totalDeposits: vaultAccountData.totalDeposits.toString(),
		totalWithdraws: vaultAccountData.totalWithdraws.toString(),
		totalWithdrawRequested: vaultAccountData.totalWithdrawRequested.toString(),
		managerNetDeposits: vaultAccountData.managerNetDeposits.toString(),
		managerTotalDeposits: vaultAccountData.managerTotalDeposits.toString(),
		managerTotalWithdraws: vaultAccountData.managerTotalWithdraws.toString(),
		managerTotalProfitShare:
			vaultAccountData.managerTotalProfitShare.toString(),
		managerTotalFee: vaultAccountData.managerTotalFee.toString(),
	};

	return serializedData;
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

	const vaultsSnapshotsData = await Promise.all(
		VAULTS.filter((vault) => !!vault.pubkeyString).map((vault) =>
			getVaultDataForSnapshot(new PublicKey(vault.pubkeyString!), pythClient)
		)
	);

	await db.insert(vault_snapshots).values(vaultsSnapshotsData);

	return new Response('ok', {
		status: 200,
	});
}
