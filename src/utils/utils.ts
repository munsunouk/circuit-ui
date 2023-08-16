import { SerializedPerformanceHistory } from '@/types';
import { ZERO } from '@drift-labs/sdk';
import { VaultDepositorAction, WrappedEvents } from '@drift-labs/vaults-sdk';
import { HistoryResolution, matchEnum } from '@drift/common';
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

export const getMaxDailyDrawdown = (
	history: SerializedPerformanceHistory[]
) => {
	let maxDrawdown = 0;

	for (let i = 0; i < history.length - 1; i++) {
		const currentDayValue = history[i].totalAccountValue;
		const nextDayValue = history[i + 1].totalAccountValue;

		if (nextDayValue > currentDayValue) continue;

		const drawdown = (nextDayValue - currentDayValue) / (currentDayValue || 1);

		if (drawdown < maxDrawdown) maxDrawdown = drawdown;
	}

	return maxDrawdown;
};

/**
 * Find max daily drawdown in periods where the user has an active deposits.
 */
export const getUserMaxDailyDrawdown = (
	history: SerializedPerformanceHistory[],
	eventRecords: WrappedEvents
) => {
	const periodsOfActiveDeposits: { startTs: number; endTs: number }[] = [];
	let startOfCurrentPeriodTs = 0;
	const ascendingEventRecords = [...eventRecords].reverse();

	ascendingEventRecords.forEach((event) => {
		if (
			startOfCurrentPeriodTs === 0 &&
			matchEnum(event.action, VaultDepositorAction.DEPOSIT)
		) {
			startOfCurrentPeriodTs = event.ts.toNumber();
		}

		if (
			matchEnum(event.action, VaultDepositorAction.WITHDRAW) &&
			event.vaultSharesAfter.eq(ZERO)
		) {
			periodsOfActiveDeposits.push({
				startTs: startOfCurrentPeriodTs,
				endTs: event.ts.toNumber(),
			});
			startOfCurrentPeriodTs = 0;
		}
	});

	if (periodsOfActiveDeposits.length === 0) {
		periodsOfActiveDeposits.push({
			startTs: startOfCurrentPeriodTs,
			endTs: dayjs().unix(),
		});
	}

	let maxDrawdown = 0;
	periodsOfActiveDeposits.forEach((period) => {
		const periodHistory = history.filter(
			(historyItem) =>
				historyItem.epochTs >= normalizeDate(period.startTs) &&
				historyItem.epochTs <= period.endTs
		);

		const periodMaxDrawdown = getMaxDailyDrawdown(periodHistory);

		if (periodMaxDrawdown < maxDrawdown) maxDrawdown = periodMaxDrawdown;
	});

	return maxDrawdown;
};
