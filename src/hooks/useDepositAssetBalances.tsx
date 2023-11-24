import { useEffect } from 'react';
import { singletonHook } from 'react-singleton-hook';

import { JITOSOL_MARKET, USDC_MARKET } from '@/constants/environment';

import useAppStore from '../stores/app/useAppStore';
import useSPLTokenBalance from './useSPLTokenBalance';

function useDepositAssetsBalances() {
	const usdcBalance = useSPLTokenBalance(USDC_MARKET.mint);
	const jitoSolBalance = useSPLTokenBalance(JITOSOL_MARKET.mint);

	const setStore = useAppStore((s) => s.set);

	useEffect(() => {
		setStore((s) => {
			s.balances[USDC_MARKET.symbol] = usdcBalance;
			s.balances[JITOSOL_MARKET.symbol] = jitoSolBalance;
		});
	}, [usdcBalance]);
}

export default singletonHook(undefined, useDepositAssetsBalances);
