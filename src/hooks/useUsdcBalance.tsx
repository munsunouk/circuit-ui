import { useEffect } from 'react';
import { singletonHook } from 'react-singleton-hook';

import { USDC_MARKET } from '@/constants/environment';

import useAppStore from '../stores/app/useAppStore';
import useSPLTokenBalance from './useSPLTokenBalance';

function useUsdcBalance() {
	const balance = useSPLTokenBalance(USDC_MARKET.mint);
	const setStore = useAppStore((s) => s.set);

	useEffect(() => {
		setStore((s) => {
			s.balances.usdc = balance;
		});
	}, [balance]);
}

export default singletonHook(undefined, useUsdcBalance);
