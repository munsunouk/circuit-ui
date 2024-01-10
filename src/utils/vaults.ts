import {
	SerializedDepositHistory,
	SerializedPerformanceHistory,
} from '@/types';
import { BigNum, PERCENTAGE_PRECISION, ZERO } from '@drift-labs/sdk';
import { VaultDepositorAction, WrappedEvents } from '@drift-labs/vaults-sdk';
import { matchEnum } from '@drift/common';
import { PublicKey } from '@solana/web3.js';
import dayjs from 'dayjs';

import { SPOT_MARKETS_LOOKUP } from '@/constants/environment';
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

/**
 * Used for calculating max daily drawdown from data with no reliable withdrawal history.
 * The calculation assumes that the user has not withdrawn any funds from the vault.
 */
export const getMaxDailyDrawdownFromAccValue = (
	history: { totalAccountValue: number }[]
) => {
	let maxDrawdown = 0;

	for (let i = 0; i < history.length - 1; i++) {
		const currentDayValue = history[i].totalAccountValue;
		const nextDayValue = history[i + 1].totalAccountValue;

		if (
			nextDayValue === undefined ||
			currentDayValue === undefined ||
			nextDayValue > currentDayValue
		)
			continue;

		const drawdown = (nextDayValue - currentDayValue) / (currentDayValue || 1);

		if (drawdown < maxDrawdown) maxDrawdown = drawdown;
	}

	return maxDrawdown;
};

export const getMaxDailyDrawdown = (
	history: { allTimeTotalPnl: number; totalAccountValue: number }[]
) => {
	let maxDrawdown = 0;

	for (let i = 0; i < history.length - 1; i++) {
		const currentDayAllTimeDayPnl = history[i].allTimeTotalPnl;
		const previousDayAllTimeDayPnl = history[i - 1]?.allTimeTotalPnl ?? 0;

		if (currentDayAllTimeDayPnl > previousDayAllTimeDayPnl) continue; // made profit for that day; no drawdown

		const currentDayPnl = currentDayAllTimeDayPnl - previousDayAllTimeDayPnl;
		const currentDayTotalAccValue = history[i].totalAccountValue;
		const drawdown = currentDayPnl / (currentDayTotalAccValue || 1);

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
				historyItem.epochTs <= period.endTs &&
				historyItem.totalAccountValue !== undefined
		);

		const periodMaxDrawdown = getMaxDailyDrawdown(periodHistory);

		if (periodMaxDrawdown < maxDrawdown) maxDrawdown = periodMaxDrawdown;
	});

	return maxDrawdown;
};

export const getSimpleHistoricalApy = (
	netDeposits: number,
	totalAccountValue: number,
	startTs: number,
	endTs?: number
) => {
	const days = ((endTs ?? dayjs().unix()) - startTs) / 60 / 60 / 24;
	const apy = ((totalAccountValue - netDeposits) / netDeposits) * (365 / days);
	return Math.max(apy, -1);
};

const DEFAULT_MODIFIED_DIETZ_RESULT = {
	apy: 0,
	returns: 0,
};

/**
 * https://en.wikipedia.org/wiki/Modified_Dietz_method
 * @param currentVaultEquity
 * @param vaultDeposits
 * @returns weighted APY calc using the Modified Dietz method
 */
export const calcModifiedDietz = (
	currentVaultEquity: number,
	vaultDeposits: SerializedDepositHistory[]
): { apy: number; returns: number } => {
	if (vaultDeposits.length === 0) {
		return DEFAULT_MODIFIED_DIETZ_RESULT;
	}

	const startingMarketValue = 0;
	const endingMarkeValue = currentVaultEquity;
	const firstDepositTs = parseInt(vaultDeposits[vaultDeposits.length - 1].ts);
	const lastDepositTs = parseInt(vaultDeposits[0].ts);
	const nowTs = Date.now() / 1000;
	if (nowTs < firstDepositTs) {
		console.error('nowTs < firstDepositTs');
		return DEFAULT_MODIFIED_DIETZ_RESULT;
	}
	if (lastDepositTs < firstDepositTs) {
		console.error('lastDepositTs < firstDepositTs');
		return DEFAULT_MODIFIED_DIETZ_RESULT;
	}
	const totalDuration = nowTs - firstDepositTs;

	let totalNetFlow = 0;
	let weightedNetFlow = 0;
	const precisionExp =
		SPOT_MARKETS_LOOKUP[vaultDeposits[0].marketIndex].precisionExp;
	vaultDeposits.forEach((deposit) => {
		let depositAmount = BigNum.from(deposit.amount, precisionExp).toNum();
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

	if (modifiedDietzReturns < 0) return DEFAULT_MODIFIED_DIETZ_RESULT;

	const annualized =
		Math.pow(1 + modifiedDietzReturns, (86400 * 365) / totalDuration) - 1;

	const positiveApy = Math.max(annualized, 0);
	return { apy: positiveApy, returns: modifiedDietzReturns };
};

// Calculation explanation: https://chat.openai.com/share/f6a3c630-f37b-428d-aaa2-dfeeca290da0
export const combineHistoricalApy = (
	historicalFundValues: {
		initial: BigNum;
		final: BigNum;
		numOfDays: number;
	},
	currentApy: {
		apy: number;
		numOfDays: number;
	}
) => {
	const historicalGrowthFactor =
		historicalFundValues.final
			.mul(PERCENTAGE_PRECISION)
			.div(historicalFundValues.initial)
			.toNum() / PERCENTAGE_PRECISION.toNumber();
	const currentGrowthFactor = Math.pow(
		1 + currentApy.apy,
		currentApy.numOfDays / 365
	);
	const combinedGrowthFactor = historicalGrowthFactor * currentGrowthFactor;
	const totalNumOfDays = historicalFundValues.numOfDays + currentApy.numOfDays;
	const totalNumOfYears = totalNumOfDays / 365;

	const combinedApy = Math.pow(combinedGrowthFactor, 1 / totalNumOfYears) - 1;

	return combinedApy;
};
