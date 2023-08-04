import { BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import { decodeName } from '@drift-labs/vaults-sdk';
import { twMerge } from 'tailwind-merge';

import useCurrentVaultAccount from '@/hooks/useCurrentVaultAccount';
import useCurrentVaultStats from '@/hooks/useCurrentVaultStats';

import { sourceCodePro, syne } from '@/constants/fonts';
import { VAULTS } from '@/constants/vaults';

const StatsBox = ({ label, value }: { label: string; value: string }) => {
	return (
		<div className="md:min-w-[300px] flex flex-col items-center gap-1 text-center flex-1">
			<span
				className={twMerge(
					sourceCodePro.className,
					'text-xl md:text-4xl font-medium text-text-emphasis'
				)}
			>
				{value}
			</span>
			<span className="text-sm md:text-xl">{label}</span>
		</div>
	);
};

export default function VaultHero() {
	const vaultAccount = useCurrentVaultAccount();
	const vaultStats = useCurrentVaultStats();

	const uiVaultConfig = VAULTS.find(
		(v) => v.pubkey.toString() === vaultAccount?.pubkey.toString()
	);

	const name = decodeName(vaultAccount?.name ?? []);
	const tvl = vaultStats.netUsdValue;
	const maxCapacity = vaultAccount?.maxTokens;

	return (
		<div
			className="flex flex-col items-center bg-no-repeat w-full pb-10 relative"
			style={{
				backgroundImage: `url(${
					uiVaultConfig?.previewBackdropUrl ?? '/backdrops/marble-backdrop.png'
				})`,
				backgroundSize: '100%',
				backgroundPosition: 'top center',
			}}
		>
			<div className="absolute w-full h-full bg-gradient-to-t from-black to-[#00000070]" />
			<div className="absolute w-10 h-full left-0 bg-gradient-to-r from-black to-transparent" />
			<div className="absolute w-10 h-full right-0 bg-gradient-to-l from-black to-transparent" />
			<div className="flex flex-col items-center gap-3 my-20 text-center md:my-40 z-10">
				<span
					className={twMerge(
						syne.className,
						'text-4xl md:text-6xl font-bold gradient-vault-name'
					)}
				>
					{name}
				</span>
				<span className="font-light leading-none md:text-2xl">
					Delta-neutral market making and liquidity provision strategy
				</span>
			</div>
			<div className="flex items-center w-full gap-5 md:gap-11 z-10">
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
