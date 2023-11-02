'use client';

import { BN, BigNum, QUOTE_PRECISION_EXP, ZERO } from '@drift-labs/sdk';
import Skeleton from 'react-loading-skeleton';
import { twMerge } from 'tailwind-merge';

import useAppStore from '@/hooks/useAppStore';

import { sourceCodePro } from '@/constants/fonts';
import { VAULTS } from '@/constants/vaults';

export default function VaultTvl() {
	const allVaults = useAppStore((s) => s.vaults);
	const numOfUiVaults = VAULTS.reduce(
		(sum, vault) => sum + (vault.pubkeyString ? 1 : 0),
		0
	);

	const isLoading = numOfUiVaults !== Object.keys(allVaults).length;

	const combinedTvl = Object.values(allVaults).reduce((sum, vault) => {
		const collateral = vault?.vaultDriftUser.getNetSpotMarketValue() ?? ZERO;
		const unrealizedPNL = vault?.vaultDriftUser.getUnrealizedPNL() ?? ZERO;
		let netUsdValue = collateral.add(unrealizedPNL);

		return sum.add(netUsdValue);
	}, new BN(0));

	return (
		<div className="flex flex-col gap-1 mt-10 text-center">
			{isLoading ? (
				<Skeleton height={36} />
			) : (
				<span
					className={twMerge(
						sourceCodePro.className,
						'text-xl md:text-4xl font-medium text-text-emphasis'
					)}
				>
					{BigNum.from(combinedTvl, QUOTE_PRECISION_EXP).toNotional()}
				</span>
			)}
			<span className="text-sm md:text-lg">Total Value Locked</span>
		</div>
	);
}
