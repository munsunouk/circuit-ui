import { UserBalance } from '@/types';
import { useCommonDriftStore, useDriftClientIsReady } from '@drift-labs/react';
import {
	BigNum,
	PRICE_PRECISION_EXP,
	QUOTE_PRECISION_EXP,
	User,
	UserAccount,
	ZERO,
	getTokenAmount,
} from '@drift-labs/sdk';
import { useEffect, useState } from 'react';
import invariant from 'tiny-invariant';

import { OrderedSpotMarkets } from '@/constants/environment';

export const useVaultBalances = (
	vaultDriftUserAccount: UserAccount | undefined,
	vaultDriftUser: User | undefined
) => {
	const driftClientIsReady = useDriftClientIsReady();
	const driftClient = useCommonDriftStore((s) => s.driftClient.client);
	const [userBalances, setUserBalances] = useState<UserBalance[]>([]);

	useEffect(() => {
		if (
			!driftClientIsReady ||
			!driftClient ||
			!vaultDriftUserAccount ||
			!vaultDriftUser
		)
			return;

		const spotPositions = vaultDriftUserAccount.spotPositions;

		const userBalances = spotPositions
			.map((spotPosition) => {
				const spotMarketAccount = driftClient.getSpotMarketAccount(
					spotPosition.marketIndex
				);

				invariant(
					spotMarketAccount,
					`Spot market account not found for market index ${spotPosition.marketIndex}`
				);

				const assetPrecision =
					OrderedSpotMarkets[spotPosition.marketIndex].precisionExp;
				const baseBalance = BigNum.from(
					getTokenAmount(
						spotPosition.scaledBalance,
						spotMarketAccount,
						spotPosition.balanceType
					),
					assetPrecision
				).shiftTo(assetPrecision);

				const oraclePrice = BigNum.from(
					driftClient.getOracleDataForSpotMarket(spotPosition.marketIndex)
						.price,
					PRICE_PRECISION_EXP
				);
				const quoteValue = baseBalance
					.shiftTo(PRICE_PRECISION_EXP)
					.mul(oraclePrice)
					.shiftTo(QUOTE_PRECISION_EXP);

				let liquidationPrice = BigNum.from(
					vaultDriftUser.spotLiquidationPrice(spotPosition.marketIndex),
					PRICE_PRECISION_EXP
				);
				liquidationPrice = liquidationPrice.ltZero()
					? BigNum.from(ZERO)
					: liquidationPrice;

				return {
					baseBalance,
					oraclePrice,
					quoteValue,
					marketIndex: spotPosition.marketIndex,
					liquidationPrice,
				};
			})
			.filter((userBalance) => userBalance.baseBalance.gt(ZERO));

		setUserBalances(userBalances);
	}, [driftClient, driftClientIsReady, vaultDriftUserAccount]);

	return userBalances;
};
