import { twMerge } from 'tailwind-merge';

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
				${value}
			</span>
			<span className="text-xl">{label}</span>
		</div>
	);
};

export default function VaultHero() {
	return (
		<div className="flex flex-col items-center">
			<div className="flex flex-col items-center gap-3 my-40">
				<span
					className={twMerge(
						syne.className,
						'text-6xl font-bold gradient-vault-name'
					)}
				>
					Supercharger Vault
				</span>
				<span className="text-2xl font-light leading-none">
					Delta-neutral market making and liquidity provision strategy
				</span>
			</div>
			<div className="flex items-center gap-11">
				<StatsBox label="Total Value Locked" value="3,908,758.97" />
				<div className="h-12 border-r border-container-border" />
				<StatsBox label="Max Capacity" value="4,863,718.00" />
			</div>
		</div>
	);
}
