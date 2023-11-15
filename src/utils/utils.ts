import { MarketType, isVariant } from '@drift-labs/sdk';
import { HistoryResolution, UIMarket } from '@drift/common';
import dayjs from 'dayjs';
import invariant from 'tiny-invariant';

import {
	CURRENT_PERP_MARKETS,
	CURRENT_SPOT_MARKETS,
} from '@/constants/environment';

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

export const getMarket = (
	marketIndex: number,
	marketType: MarketType
): UIMarket => {
	const markets = isVariant(marketType, 'perp')
		? CURRENT_PERP_MARKETS
		: CURRENT_SPOT_MARKETS;
	const market = (markets as any[]).find(
		(market) => market.marketIndex === marketIndex
	);

	invariant(
		market,
		`Market not found for marketIndex ${marketIndex} of market type: ${marketType}}`
	);

	return { marketType, market };
};
