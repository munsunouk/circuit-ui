import { useOraclePriceStore } from '@drift-labs/react';
import { PublicKey, User, UserAccount } from '@drift-labs/sdk';
import { MarketId } from '@drift/common';
import { useEffect } from 'react';

import { useVaultBalances } from '@/hooks/table-data/useVaultBalances';
import { useVaultOpenOrders } from '@/hooks/table-data/useVaultOpenOrders';
import { useVaultOpenPerpPositions } from '@/hooks/table-data/useVaultOpenPerpPositions';
import { useVault } from '@/hooks/useVault';

import useAppStore, { UIVault } from './useAppStore';

const useSyncOpenPositions = (vaultPubKey: PublicKey | undefined) => {
	const openPositions = useVaultOpenPerpPositions(vaultPubKey);
	const setAppStore = useAppStore((s) => s.set);

	const { getMarketPriceData } = useOraclePriceStore();

	useEffect(() => {
		mapAndSetPositionSWithIndexPrice();
	}, [openPositions]);

	const setOpenPositionsWithIndexPrice = (
		positionsWithIndexPrice: UIVault['accountSummary']['openPositions']
	) => {
		if (!vaultPubKey) return;

		setAppStore((s) => {
			if (!s.vaults[vaultPubKey.toString()]) return;

			s.vaults[vaultPubKey.toString()]!.accountSummary.openPositions =
				positionsWithIndexPrice;
		});
	};

	const mapAndSetPositionSWithIndexPrice = () => {
		const newPositionsWithIndexPrice = openPositions.map((position) => ({
			...position,
			indexPrice: getMarketPriceData(
				MarketId.createPerpMarket(position.marketIndex)
			).priceData.price,
		}));

		setOpenPositionsWithIndexPrice(newPositionsWithIndexPrice);
	};
};

const useSyncVaultBalances = (
	vaultPubKey: PublicKey | undefined,
	vaultDriftUserAccount: UserAccount | undefined,
	vaultDriftUser: User | undefined
) => {
	const setAppStore = useAppStore((s) => s.set);

	const vaultBalances = useVaultBalances(vaultDriftUserAccount, vaultDriftUser);

	useEffect(() => {
		if (!vaultPubKey) return;

		setAppStore((s) => {
			if (!s.vaults[vaultPubKey.toString()]) return;

			s.vaults[vaultPubKey.toString()]!.accountSummary.balances = vaultBalances;
		});
	}, [vaultBalances, vaultPubKey]);
};

const useSyncOpenOrders = (vaultPubKey: PublicKey | undefined) => {
	const setAppStore = useAppStore((s) => s.set);

	const vaultOpenOrders = useVaultOpenOrders(vaultPubKey);

	useEffect(() => {
		if (!vaultPubKey) return;

		setAppStore((s) => {
			if (!s.vaults[vaultPubKey.toString()]) return;

			s.vaults[vaultPubKey.toString()]!.accountSummary.openOrders =
				vaultOpenOrders;
		});
	}, [vaultPubKey, vaultOpenOrders]);
};

export const useSyncAccountSummary = (vaultPubKey: PublicKey | undefined) => {
	const vault = useVault(vaultPubKey);

	useSyncOpenPositions(vaultPubKey);
	useSyncOpenOrders(vaultPubKey);
	useSyncVaultBalances(
		vaultPubKey,
		vault?.vaultDriftUserAccount,
		vault?.vaultDriftUser
	);
};
