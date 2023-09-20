import {
	SerializedDepositHistory,
	SerializedPerformanceHistory,
} from '@/types';
import { BigNum, QUOTE_PRECISION_EXP, ZERO } from '@drift-labs/sdk';
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
	if (eventRecords.length === 0) return 0;

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

export const getSimpleHistoricalApy = (
	netDeposits: number,
	totalAccountValue: number,
	startTs: number
) => {
	const days = (dayjs().unix() - startTs) / 60 / 60 / 24;
	const apy = ((totalAccountValue - netDeposits) / netDeposits) * (365 / days);
	return Math.max(apy, -1);
};

/**
 * https://en.wikipedia.org/wiki/Modified_Dietz_method
 * @param currentVaultEquity
 * @param vaultDeposits
 * @returns weighted APY calc using the Modified Dietz method
 */
export const getModifiedDietzApy = (
	currentVaultEquity: number,
	vaultDeposits: SerializedDepositHistory[]
): number => {
	if (vaultDeposits.length === 0) {
		return -1;
	}

	const startingMarketValue = 0;
	const endingMarkeValue = currentVaultEquity;
	const firstDepositTs = parseInt(vaultDeposits[vaultDeposits.length - 1].ts);
	const lastDepositTs = parseInt(vaultDeposits[0].ts);
	const nowTs = Date.now() / 1000;
	if (nowTs < firstDepositTs) {
		console.error('nowTs < firstDepositTs');
		return -1;
	}
	if (lastDepositTs < firstDepositTs) {
		console.error('lastDepositTs < firstDepositTs');
		return -1;
	}
	const totalDuration = nowTs - firstDepositTs;

	let totalNetFlow = 0;
	let weightedNetFlow = 0;
	vaultDeposits.forEach((deposit) => {
		let depositAmount = BigNum.from(
			deposit.amount,
			QUOTE_PRECISION_EXP
		).toNum();
		if (deposit.direction === 'withdraw') {
			depositAmount *= -1;
		}
		totalNetFlow += depositAmount;
		const depositAge = parseInt(deposit.ts) - firstDepositTs;
		const depositWeight = (totalDuration - depositAge) / totalDuration;
		if (depositWeight < 0) {
			console.error('depositWeight < 0');
			return -1;
		}
		weightedNetFlow += depositWeight * depositAmount;
	}, 0);

	const modifiedDietzReturns =
		(endingMarkeValue - startingMarketValue - totalNetFlow) /
		(startingMarketValue + weightedNetFlow);
	const annualized =
		Math.pow(1 + modifiedDietzReturns, (86400 * 365) / totalDuration) - 1;

	return annualized;
};
