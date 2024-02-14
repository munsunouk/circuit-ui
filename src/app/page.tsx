'use client';

import { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

import VaultDepositorSummary from '@/components/home/VaultDepositorSummary';
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

	useEffect(() => {
		// used for tracking mouse position; relevant to CSS
		window.addEventListener('mousemove', (e) => {
			document.body.style.setProperty('--mx', `${e.clientX}`);
			document.body.style.setProperty('--my', `${e.clientY}`);
		});
	}, []);

	return (
		<div className="flex flex-col items-center gap-8 max-w-[1392px]">
			<div className="flex flex-col items-center gap-3 mt-10 mb-2 overflow-hidden text-center md:mt-32 md:mb-2">
				<span
					className={twMerge(
						syne.className,
						'text-4xl md:text-6xl font-bold gradient-vault-name'
					)}
				>
					Vaults
				</span>
				<span className="md:text-2xl max-w-[400px] md:max-w-[640px]">
					Multiply your yields with delta-neutral market making and liquidity
					provision strategies
				</span>
				<VaultTvl />

				<VaultDepositorSummary />
			</div>

			<div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
				{renderVaults()}
			</div>
		</div>
	);
}
