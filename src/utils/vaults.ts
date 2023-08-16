import { SerializedPerformanceHistory } from '@/types';
import { ZERO } from '@drift-labs/sdk';
import { VaultDepositorAction, WrappedEvents } from '@drift-labs/vaults-sdk';
import { matchEnum } from '@drift/common';
import { PublicKey } from '@solana/web3.js';
import dayjs from 'dayjs';

import { VAULTS } from '@/constants/vaults';

import { normalizeDate } from './utils';

export const getUiVaultConfig = (
	vaultPubkey: PublicKey | string | undefined
) => {
	if (!vaultPubkey) return undefined;

	const vaultConfig = VAULTS.find(
		(v) => v.pubkeyString === vaultPubkey.toString()
	);

	return vaultConfig;
};

export const getMaxDailyDrawdown = (
	history: Pick<SerializedPerformanceHistory, 'totalAccountValue'>[]
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

export const getHistoricalApy = (
	netDeposits: number,
	totalAccountValue: number,
	startTs: number
) => {
	const days = (dayjs().unix() - startTs) / 60 / 60 / 24;
	const apy = ((totalAccountValue - netDeposits) / netDeposits) * (365 / days);
	return Math.max(apy, -1);
};
