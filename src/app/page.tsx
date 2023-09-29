'use client';

import { twMerge } from 'tailwind-merge';

import VaultPreviewCard from '@/components/home/VaultPreviewCard';
import VaultTvl from '@/components/home/VaultsTvl';

import { syne } from '@/constants/fonts';
import { VAULTS } from '@/constants/vaults';

export default function HomePage() {
	const renderVaults = () => {
		return VAULTS.map((vault) => {
			return <VaultPreviewCard key={vault.name} vault={vault} />;
		});
	};
	return (
		<div className="flex flex-col items-center gap-8 max-w-[1392px]">
			<div className="mt-10 mb-4 md:mt-32 md:mb-16 flex flex-col text-center items-center max-w-[400px] md:max-w-[640px] overflow-hidden gap-3">
				<span
					className={twMerge(
						syne.className,
						'text-4xl md:text-6xl font-bold gradient-vault-name'
					)}
				>
					Vaults
				</span>
				<span className="md:text-2xl">
					Multiply your yields with delta-neutral market making and liquidity
					provision strategies
				</span>
				<VaultTvl />
			</div>

			<div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
				{renderVaults()}
			</div>
		</div>
	);
}
