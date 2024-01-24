import { BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import { decodeName } from '@drift-labs/vaults-sdk';
import { USDC_SPOT_MARKET_INDEX } from '@drift/common';
import { twMerge } from 'tailwind-merge';

import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';
import { useCurrentVaultStats } from '@/hooks/useVaultStats';

import { displayAssetValue } from '@/utils/utils';

import { SPOT_MARKETS_LOOKUP } from '@/constants/environment';
import { sourceCodePro, syne } from '@/constants/fonts';
import { VAULTS } from '@/constants/vaults';

import Badge from '../elements/Badge';
import { Tooltip } from '../elements/Tooltip';
import { Lock } from '../icons';

const StatsBox = ({
	label,
	value,
	position,
	tooltip,
}: {
	label: string;
	value: string;
	position: 'left' | 'right';
	tooltip?: {
		id: string;
		content: React.ReactNode;
	};
}) => {
	return (
		<div
			className={twMerge(
				'md:min-w-[200px] flex flex-col flex-1',
				position === 'left' ? 'items-end' : 'items-start'
			)}
		>
			<div className="flex flex-col gap-1 text-center">
				<span
					className={twMerge(
						sourceCodePro.className,
						'text-xl sm:text-2xl md:text-4xl font-medium text-text-emphasis'
					)}
					data-tooltip-id={tooltip?.id}
				>
					{value}
				</span>
				{tooltip && (
					<Tooltip id={tooltip.id}>
						<span className="text-xl">{tooltip.content}</span>
					</Tooltip>
				)}
				<span className="text-sm md:text-xl">{label}</span>
			</div>
		</div>
	);
};

export default function VaultHero() {
	const vaultAccountData = useCurrentVaultAccountData();
	const vaultStats = useCurrentVaultStats();

	const uiVaultConfig = VAULTS.find(
		(v) => v.pubkeyString === vaultAccountData?.pubkey.toString()
	);
	const depositMarketIndex = vaultAccountData?.spotMarketIndex ?? 0;
	const basePrecisionExp = SPOT_MARKETS_LOOKUP[depositMarketIndex].precisionExp;

	const name = decodeName(vaultAccountData?.name ?? []);
	const tvlBaseValue = vaultStats.totalAccountBaseValue;
	const tvlQuoteValue = vaultStats.totalAccountQuoteValue;
	const maxCapacity = vaultAccountData?.maxTokens;

	const isUsdcMarket = depositMarketIndex === USDC_SPOT_MARKET_INDEX;

	return (
		<div
			className="relative flex flex-col items-center w-full pb-10 bg-no-repeat"
			style={{
				backgroundImage: `url(${
					uiVaultConfig?.previewBackdropUrl ?? '/backdrops/marble-backdrop.png'
				})`,
				backgroundSize: '100%',
				backgroundPosition: 'top center',
			}}
		>
			<div className="absolute w-full h-full bg-gradient-to-t from-black to-[#00000070]" />
			<div className="absolute left-0 w-40 h-full bg-gradient-to-r from-black to-transparent" />
			<div className="absolute right-0 w-40 h-full bg-gradient-to-l from-black to-transparent" />
			<div className="z-10 flex flex-col items-center gap-3 mt-20 mb-16 text-center md:mt-40 md:mb-32">
				<span
					className={twMerge(
						syne.className,
						'text-4xl md:text-6xl font-bold gradient-vault-name'
					)}
				>
					{name}
				</span>
				<span className="font-light leading-none md:text-2xl">
					{uiVaultConfig?.description}
				</span>
				{uiVaultConfig?.permissioned && (
					<span>
						<Badge>
							<div className="flex items-center justify-center gap-1 whitespace-nowrap">
								<Lock />
								<span>Whitelist Only</span>
							</div>
						</Badge>
					</span>
				)}
			</div>
			<div className="z-10 flex items-center justify-center w-full gap-5 md:gap-11">
				<StatsBox
					label="Total Value Locked"
					value={displayAssetValue(
						BigNum.from(tvlBaseValue, basePrecisionExp),
						depositMarketIndex,
						false,
						2
					)}
					position="left"
					tooltip={
						isUsdcMarket
							? undefined
							: {
									id: 'tvl-tooltip',
									content: (
										<span className={twMerge(sourceCodePro.className)}>
											{BigNum.from(
												tvlQuoteValue,
												QUOTE_PRECISION_EXP
											).toNotional()}
										</span>
									),
								}
					}
				/>
				<div className="h-12 border-r border-container-border" />
				<StatsBox
					label="Max Capacity"
					value={displayAssetValue(
						BigNum.from(maxCapacity, basePrecisionExp),
						depositMarketIndex,
						false,
						2
					)}
					position="right"
				/>
			</div>
		</div>
	);
}
