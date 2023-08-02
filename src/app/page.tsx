import { twMerge } from 'tailwind-merge';

import FadeInDiv from '@/components/elements/FadeInDiv';
import VaultPreviewCard from '@/components/home/VaultPreviewCard';

import { syne } from '@/constants/fonts';
import { VAULTS } from '@/constants/vaults';

export default function HomePage() {
	const renderVaults = () => {
		return VAULTS.map((vault) => {
			return <VaultPreviewCard key={vault.pubkey.toString()} vault={vault} />;
		});
	};
	return (
		<div className="flex flex-col items-center gap-8 max-w-[1392px]">
			<FadeInDiv className="mt-10 mb-4 md:my-40 flex flex-col text-center items-center max-w-[400px] md:max-w-[640px] overflow-hidden gap-3">
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
			</FadeInDiv>

			<FadeInDiv
				className="grid md:grid-cols-2 grid-cols-1 md:gap-6 gap-3 w-full"
				delay={200}
			>
				{renderVaults()}
			</FadeInDiv>
		</div>
	);
}
