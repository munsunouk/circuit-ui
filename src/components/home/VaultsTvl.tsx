'use client';

import { BN, BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import { twMerge } from 'tailwind-merge';

import useAppStore from '@/hooks/useAppStore';

import { sourceCodePro } from '@/constants/fonts';

export default function VaultTvl() {
	const allVaults = useAppStore((s) => s.vaults);

	const combinedTvl = Object.values(allVaults).reduce((sum, vault) => {
		const collateral = vault?.vaultDriftUser.getNetSpotMarketValue();
		const unrealizedPNL = vault?.vaultDriftUser.getUnrealizedPNL();
		const netUsdValue = collateral.add(unrealizedPNL);

		return sum.add(netUsdValue);
	}, new BN(0));

	return (
		<div className="flex flex-col gap-1 mt-10 text-center">
			<span
				className={twMerge(
					sourceCodePro.className,
					'text-xl md:text-4xl font-medium text-text-emphasis'
				)}
			>
				{BigNum.from(combinedTvl, QUOTE_PRECISION_EXP).toNotional()}
			</span>
			<span className="text-sm md:text-lg">Total Value Locked</span>
		</div>
	);
}
