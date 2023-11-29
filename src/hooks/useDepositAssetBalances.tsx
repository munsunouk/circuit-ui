import { PublicKey } from '@drift-labs/sdk';
import { useEffect } from 'react';
import { singletonHook } from 'react-singleton-hook';

import { DEPOSIT_ASSET_MARKETS } from '@/constants/vaults';

import useAppStore from '../stores/app/useAppStore';
import useSPLTokenBalance from './useSPLTokenBalance';

const mints = DEPOSIT_ASSET_MARKETS.map((m) => m.mint);

const useUserSPLTokenBalances = (mint: PublicKey) => {
	return useSPLTokenBalance(mint);
};

function useDepositAssetsBalances() {
	const balances = mints.map(useUserSPLTokenBalances);

	const setStore = useAppStore((s) => s.set);

	useEffect(() => {
		setStore((s) => {
			balances.forEach((balance, index) => {
				const marketSymbol = DEPOSIT_ASSET_MARKETS[index].symbol;
				s.balances[marketSymbol] = balance;
			});
		});
	}, [balances]);
}

export default singletonHook(undefined, useDepositAssetsBalances);
