'use client';

import useAppStore from '@/stores/app/useAppStore';
import { BN, BigNum, QUOTE_PRECISION_EXP, ZERO } from '@drift-labs/sdk';
import { USDC_SPOT_MARKET_INDEX } from '@drift/common';
import Skeleton from 'react-loading-skeleton';
import { twMerge } from 'tailwind-merge';

import { getUiVaultConfig } from '@/utils/vaults';

import { sourceCodePro } from '@/constants/fonts';
import { VAULTS } from '@/constants/vaults';

import { Tooltip } from '../elements/Tooltip';
import Info from '../icons/Info';

const TOTAL_PNL_INFO_TOOLTIP_ID = 'total-pnl-info-tooltip';

/**
 * We only count USDC vaults for USD TVL.
 */
export default function VaultTvl() {
	const allVaults = useAppStore((s) => s.vaults);
	const numOfUsdcVaults = VAULTS.reduce(
		(sum, vault) =>
			sum +
			(vault.pubkeyString &&
			!vault.comingSoon &&
			vault.market.marketIndex === USDC_SPOT_MARKET_INDEX
				? 1
				: 0),
		0
	);

	const fetchedLiveVaults = Object.keys(allVaults)
		.filter((vaultPubKey) => {
			const uiVault = getUiVaultConfig(vaultPubKey);

			const isUsdcVault =
				uiVault?.market.marketIndex === USDC_SPOT_MARKET_INDEX;

			return uiVault && !uiVault.comingSoon && isUsdcVault;
		})
		.map((vaultPubKey) => allVaults[vaultPubKey]);

	const isLoading = numOfUsdcVaults !== fetchedLiveVaults.length;

	const combinedTvl = fetchedLiveVaults.reduce((sum, vault) => {
		const collateral = vault?.vaultDriftUser.getNetSpotMarketValue() ?? ZERO;
		const unrealizedPNL = vault?.vaultDriftUser.getUnrealizedPNL() ?? ZERO;
		let netUsdValue = collateral.add(unrealizedPNL);

		return sum.add(netUsdValue);
	}, new BN(0));

	const combinedPnl = fetchedLiveVaults.reduce((sum, vault) => {
		const unrealizedPNL = vault?.vaultDriftUser.getTotalAllTimePnl() ?? ZERO;
		return sum.add(unrealizedPNL);
	}, new BN(0));

	return (
		<div className="flex flex-col justify-center w-full gap-4 mt-10 sm:gap-12 sm:flex-row">
			<div className="flex flex-col flex-1 gap-1 text-center">
				{isLoading ? (
					<Skeleton height={36} />
				) : (
					<span
						className={twMerge(
							sourceCodePro.className,
							'text-2xl md:text-4xl font-medium text-text-emphasis'
						)}
					>
						{BigNum.from(combinedTvl, QUOTE_PRECISION_EXP).toNotional()}
					</span>
				)}
				<span className="text-sm md:text-lg">Total Value Locked</span>
			</div>
			<div className="flex flex-col flex-1 gap-1text-center">
				{isLoading ? (
					<Skeleton height={36} />
				) : (
					<span
						className={twMerge(
							sourceCodePro.className,
							'text-2xl md:text-4xl font-medium text-text-emphasis'
						)}
					>
						{BigNum.from(combinedPnl, QUOTE_PRECISION_EXP).toNotional()}
					</span>
				)}
				<span className="flex items-center justify-center w-full text-sm text-center md:text-lg">
					<span>Total P&amp;L</span>
					<Info
						data-tooltip-id={TOTAL_PNL_INFO_TOOLTIP_ID}
						className="ml-1 [&>path]:stroke-white w-4 h-4 cursor-help"
					/>
					<Tooltip id={TOTAL_PNL_INFO_TOOLTIP_ID}>
						<div className="max-w-[300px]">
							Total P&amp;L only includes vaults whose deposits are USDC-based.
						</div>
					</Tooltip>
				</span>
			</div>
		</div>
	);
}
