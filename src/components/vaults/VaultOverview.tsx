import { PERCENTAGE_PRECISION } from '@drift-labs/sdk';
import { twMerge } from 'tailwind-merge';

import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';

import { redeemPeriodToString } from '@/utils/utils';

import {
	FEES_PLACEHOLDER,
	OverviewSection,
	PERIOD_PLACEHOLDER,
	VAULTS,
} from '@/constants/vaults';

import SectionHeader from '../SectionHeader';
import FadeInDiv from '../elements/FadeInDiv';

type Placeholders = typeof FEES_PLACEHOLDER | typeof PERIOD_PLACEHOLDER;

type PlaceholdersReplacements = {
	[key in Placeholders]: string;
};

const Section = ({
	section,
	index,
	placeholdersReplacements,
}: {
	section: OverviewSection;
	index: number;
	placeholdersReplacements: PlaceholdersReplacements;
}) => {
	const placeholders = Object.keys(placeholdersReplacements);

	return (
		<FadeInDiv delay={index * 100} className="flex flex-col w-full gap-4">
			<SectionHeader>{section.title}</SectionHeader>
			<div className="flex flex-col w-full gap-6">
				{section.paragraphs.map((paragraph, index) => (
					<div key={index} className="flex flex-col">
						{paragraph.title && (
							<span className="mb-1 font-semibold text-text-semi-emphasis">
								{paragraph.title}
							</span>
						)}
						<span className={twMerge(paragraph.className)}>
							{paragraph.isDynamic
								? paragraph.text.map((t) =>
										placeholders.includes(t)
											? placeholdersReplacements[t as Placeholders]
											: t
								  )
								: paragraph.text}
						</span>
					</div>
				))}
			</div>
		</FadeInDiv>
	);
};

export default function VaultOverview() {
	const vaultAccountData = useCurrentVaultAccountData();
	const uiVaultConfig = VAULTS.find(
		(vault) => vault.pubkeyString === vaultAccountData?.pubkey.toBase58()
	);

	const profitShareFee =
		(vaultAccountData?.profitShare ?? 0) / PERCENTAGE_PRECISION.toNumber();
	const withdrawalWaitingPeriod = redeemPeriodToString(
		vaultAccountData?.redeemPeriod.toNumber()
	);

	const placeholdersReplacements: PlaceholdersReplacements = {
		[FEES_PLACEHOLDER]: profitShareFee.toString(),
		[PERIOD_PLACEHOLDER]: withdrawalWaitingPeriod,
	};

	return (
		<div className="flex flex-col w-full gap-8 md:gap-16">
			{uiVaultConfig?.vaultOverview?.map((section, index) => (
				<Section
					key={index}
					section={section}
					index={index}
					placeholdersReplacements={placeholdersReplacements}
				/>
			))}
		</div>
	);
}
