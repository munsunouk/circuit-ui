import { HistoryResolution } from '@drift/common';
import dayjs from 'dayjs';

export const redeemPeriodToString = (seconds = 0) => {
	const hours = seconds / 60 / 60;
	if (hours < 24) {
		return `${hours} hours`;
	} else {
		return `${hours / 24} days ${hours % 24} hours`;
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
