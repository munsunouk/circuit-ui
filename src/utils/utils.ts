import { BigNum, SpotMarketConfig } from '@drift-labs/sdk';
import { HistoryResolution, USDC_SPOT_MARKET_INDEX } from '@drift/common';
import dayjs from 'dayjs';
import { ReadonlyURLSearchParams } from 'next/navigation';

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
	assetPriceHistory: { timestamp: number }[],
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

export function hexToHue(hex: string) {
	let r = parseInt(hex.slice(1, 3), 16) / 255,
		g = parseInt(hex.slice(3, 5), 16) / 255,
		b = parseInt(hex.slice(5, 7), 16) / 255;

	let max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	let h,
		s,
		l = (max + min) / 2;

	if (max === min) {
		h = s = 0; // achromatic
	} else {
		let d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
			default:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}

	return h * 360; // Return hue in degrees
}

export function removeQueryParam(
	pathname: string,
	searchParams: ReadonlyURLSearchParams,
	key: string
) {
	const regex = new RegExp(`${key}=[^&]*&?`);
	const updatedSearch = searchParams.toString().replace(regex, '');
	const href =
		pathname + `${updatedSearch.length > 0 ? '?' : ''}` + updatedSearch;

	window.history.replaceState({}, '', href);
}

export const handleOnValueChangeCurried =
	(setAmount: (amount: string) => void, spotMarketConfig: SpotMarketConfig) =>
	(newAmount: string) => {
		if (isNaN(+newAmount)) return;

		if (newAmount === '') {
			setAmount('');
			return;
		}

		const lastChar = newAmount[newAmount.length - 1];

		// if last char of string is a decimal point, don't format
		if (lastChar === '.') {
			setAmount(newAmount);
			return;
		}

		if (lastChar === '0') {
			// if last char of string is a zero in the decimal places, cut it off if it exceeds precision
			const numOfDigitsAfterDecimal = newAmount.split('.')[1]?.length ?? 0;
			if (numOfDigitsAfterDecimal > spotMarketConfig.precisionExp.toNumber()) {
				setAmount(newAmount.slice(0, -1));
			} else {
				setAmount(newAmount);
			}
			return;
		}

		const formattedAmount = Number(
			(+newAmount).toFixed(spotMarketConfig.precisionExp.toNumber())
		);
		setAmount(formattedAmount.toString());
	};
