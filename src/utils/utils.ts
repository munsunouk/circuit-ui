import { HistoricalPrice } from '@/stores/assetPriceHistory/useAssetPriceHistoryStore';
import { SerializedPerformanceHistory } from '@/types';
import { BN, BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import { Vault } from '@drift-labs/vaults-sdk';
import {
	HistoryResolution,
	UISerializableDepositRecord,
	USDC_SPOT_MARKET_INDEX,
} from '@drift/common';
import dayjs from 'dayjs';

import { SPOT_MARKETS_LOOKUP } from '@/constants/environment';

export const redeemPeriodToString = (seconds = 0) => {
	const totalHours = Math.floor(seconds / 60 / 60);
	const days = Math.floor(totalHours / 24);
	const hours = totalHours % 24;

	let mins = 0;

	if (seconds % (60 * 60) !== 0) {
		mins = Math.floor((seconds % (60 * 60)) / 60);
	}

	if (totalHours < 1) {
		return `${mins} mins`;
	} else if (totalHours < 24) {
		return `${totalHours} hours${mins > 0 ? ` ${mins} mins` : ''}`;
	} else {
		return `${days} days${hours > 0 ? ` ${hours} hours` : ''}${
			mins > 0 ? ` ${mins} mins` : ''
		}`;
	}
};

export const getRpcLatencyColor = (latency: number | undefined) => {
	return !latency || latency < 0
		? 'bg-container-border-light'
		: latency < 250
			? 'bg-success-green-border'
			: latency < 500
				? 'bg-warning-yellow-border'
				: 'bg-error-red-border';
};

// replace space with '-', and uri encode vault name
export const encodeVaultName = (name: string) => {
	return encodeURIComponent(name.toLowerCase().replace(/\s/g, '-'));
};

export const normalizeDate = (
	unixTs: number,
	resolution?: HistoryResolution
) => {
	if (
		resolution === HistoryResolution.MONTH ||
		resolution === HistoryResolution.ALL ||
		!resolution
	) {
		// closest start of day
		return dayjs.unix(unixTs).startOf('day').unix();
	}

	// closest 12 hour
	if (resolution === HistoryResolution.WEEK) {
		return dayjs(
			dayjs.unix(unixTs).format('MM/DD/YYYY HH:00'),
			'MM/DD/YYYY HH:00'
		).unix();
	}

	// closest hour
	return dayjs.unix(unixTs).startOf('hour').unix();
};

export function shortenPubkey(pubkey: string | undefined, length = 4) {
	if (!pubkey) return '';
	return `${pubkey.slice(0, length)}...${pubkey.slice(44 - length, 44)}`;
}

export function displayAssetValue(
	value: BigNum,
	marketIndex: number,
	toTradePrecision = false,
	toFixed?: number
) {
	if (marketIndex === USDC_SPOT_MARKET_INDEX) {
		return value.toNotional();
	} else {
		return `${
			toTradePrecision
				? value.toTradePrecision()
				: toFixed === undefined
					? value.toNum()
					: value.toNum().toFixed(toFixed)
		} ${SPOT_MARKETS_LOOKUP[marketIndex].symbol}`;
	}
}

export function getAssetPriceFromClosestTs(
	assetPriceHistory: HistoricalPrice[],
	targetTs: number
) {
	// use binary search to find the closest timestamp and return the price
	let start = 0;
	let end = assetPriceHistory.length - 1;
	let closest = assetPriceHistory[0];

	while (start <= end) {
		let mid = Math.floor((start + end) / 2);
		let midPrice = assetPriceHistory[mid];

		if (
			Math.abs(targetTs - closest.timestamp) >
			Math.abs(targetTs - midPrice.timestamp)
		) {
			closest = midPrice;
		}

		if (midPrice.timestamp < targetTs) {
			start = mid + 1;
		} else if (midPrice.timestamp > targetTs) {
			end = mid - 1;
		} else {
			break;
		}
	}

	return closest ?? { timestamp: 0, price: 1 }; // prevent dividing price by 0
}

export function getBasePnlHistoryFromVaultDeposits(
	vault: Vault,
	depositsHistory: UISerializableDepositRecord[],
	quotePnlHistory: Pick<
		SerializedPerformanceHistory,
		'epochTs' | 'totalAccountValue'
	>[],
	assetPriceHistory: HistoricalPrice[]
) {
	const basePrecisionExp =
		SPOT_MARKETS_LOOKUP[vault.spotMarketIndex].precisionExp;
	let currentNetDeposit = BigNum.zero(basePrecisionExp);

	// calculate net deposits history
	let netDepositsHistory = depositsHistory.map((deposit) => {
		currentNetDeposit = !!deposit.direction.deposit
			? currentNetDeposit.add(deposit.amount)
			: currentNetDeposit.sub(deposit.amount);
		return {
			ts: deposit.ts.toNumber(),
			netDeposit: currentNetDeposit,
		};
	});

	const basePnlHistory = [];

	for (let quotePnl of quotePnlHistory) {
		// find nearest net deposit before pnl snapshot epochTs
		let nearestNetDeposit = netDepositsHistory[0];
		let nearestNetDepositIndex;
		for (
			nearestNetDepositIndex = 0;
			nearestNetDepositIndex < netDepositsHistory.length;
			nearestNetDepositIndex++
		) {
			const netDeposit = netDepositsHistory[nearestNetDepositIndex];
			if (netDeposit.ts <= quotePnl.epochTs) {
				nearestNetDeposit = netDeposit;
			} else {
				break;
			}
		}

		// base pnl = (totalAccountValue / assetPriceOfTheDay) - netDeposit
		const assetPriceOfTheDay = getAssetPriceFromClosestTs(
			assetPriceHistory,
			quotePnl.epochTs
		);
		const totalAccountBaseValueBigNum = BigNum.from(
			quotePnl.totalAccountValue / assetPriceOfTheDay.price,
			QUOTE_PRECISION_EXP
		).shiftTo(basePrecisionExp);
		const basePnl = totalAccountBaseValueBigNum
			.sub(nearestNetDeposit.netDeposit)
			.mul(new BN(10).pow(basePrecisionExp));

		basePnlHistory.push({
			epochTs: quotePnl.epochTs,
			pnl: basePnl.toNum(),
		});

		// remove net deposits that are before the current epochTs
		netDepositsHistory = netDepositsHistory.slice(nearestNetDepositIndex - 1);
	}

	return basePnlHistory;
}
