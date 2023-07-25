import { BN, BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import { decodeName } from '@drift-labs/vaults-sdk';
import { twMerge } from 'tailwind-merge';

import useCurrentVault from '@/hooks/useCurrentVault';

import { sourceCodePro, syne } from '@/constants/fonts';

const StatsBox = ({ label, value }: { label: string; value: string }) => {
	return (
		<div className="min-w-[300px] flex flex-col items-center gap-1">
			<span
				className={twMerge(
					sourceCodePro.className,
					'text-4xl font-medium text-text-emphasis'
				)}
			>
				{value}
			</span>
			<span className="text-xl">{label}</span>
		</div>
	);
};

export default function VaultHero() {
	const vault = useCurrentVault();

	const name = decodeName(vault?.info.name ?? []);
	const tvl = vault?.stats.netUsdValue ?? new BN(0);
	const maxCapacity = vault?.info.maxTokens;

	return (
		<div className="flex flex-col items-center">
			<div className="flex flex-col items-center gap-3 my-40">
				<span
					className={twMerge(
						syne.className,
						'text-6xl font-bold gradient-vault-name'
					)}
				>
					{name}
				</span>
				<span className="text-2xl font-light leading-none">
					Delta-neutral market making and liquidity provision strategy
				</span>
			</div>
			<div className="flex items-center gap-11">
				<StatsBox
					label="Total Value Locked"
					value={BigNum.from(tvl, QUOTE_PRECISION_EXP).toNotional()}
				/>
				<div className="h-12 border-r border-container-border" />
				<StatsBox
					label="Max Capacity"
					value={BigNum.from(maxCapacity, QUOTE_PRECISION_EXP).toNotional()}
				/>
			</div>
		</div>
	);
}
