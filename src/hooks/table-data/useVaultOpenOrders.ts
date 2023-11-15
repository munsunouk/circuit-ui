import { useCommonDriftStore, useDriftClientIsReady } from '@drift-labs/react';
import { BN, PublicKey, isVariant } from '@drift-labs/sdk';
import { Serializer, UISerializableOrder } from '@drift/common';
import { useEffect, useState } from 'react';

import useAppStore from '../useAppStore';

export type UISerializableOrderWithOraclePrice = UISerializableOrder & {
	oraclePrice: BN;
};

export const useVaultOpenOrders = (vaultAddress: PublicKey | undefined) => {
	const driftClient = useCommonDriftStore((s) => s.driftClient.client);
	const isDriftClientReady = useDriftClientIsReady();
	const vaultDriftUser = useAppStore((s) => s.getVaultDriftUser(vaultAddress));
	const vaultDriftUserAccount = useAppStore((s) =>
		s.getVaultDriftUserAccount(vaultAddress)
	);

	const [openOrders, setOpenOrders] = useState<
		UISerializableOrderWithOraclePrice[]
	>([]);

	useEffect(() => {
		if (
			!vaultDriftUser ||
			!vaultDriftUserAccount ||
			!driftClient ||
			!isDriftClientReady
		)
			return;

		const currentOrders = vaultDriftUserAccount?.orders
			.filter((order) => !order.baseAssetAmount.isZero())
			.map((order) => Serializer.Deserialize.UIOrder(order))
			.map((order) => {
				const oraclePriceData = isVariant(order.marketType, 'perp')
					? driftClient.getOracleDataForPerpMarket(order.marketIndex)
					: driftClient.getOracleDataForSpotMarket(order.marketIndex);

				return { ...order, oraclePrice: oraclePriceData.price };
			})
			.sort((orderA, orderB) => orderB.userOrderId - orderA.userOrderId);

		setOpenOrders(currentOrders);
	}, [
		vaultDriftUser,
		vaultDriftUserAccount?.orders,
		driftClient,
		isDriftClientReady,
	]);

	return openOrders;
};
