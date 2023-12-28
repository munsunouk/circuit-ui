'use client';

import useFetchEventRecords from '@/stores/app/useFetchEventRecords';
import { useSyncAccountSummary } from '@/stores/app/useSyncAccountSummary';
import { useDevSwitchIsOn } from '@drift-labs/react';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import DepositWithdrawForm from '@/components/vaults/DepositWithdrawForm';
import VaultHero from '@/components/vaults/VaultHero';
import VaultOverview from '@/components/vaults/VaultOverview';
import VaultPerformance from '@/components/vaults/VaultPerformance';
import VaultTabs, { VaultTab } from '@/components/vaults/VaultTabs';
import WhiteGloveDetails from '@/components/vaults/WhiteGloveDetails';
import YourPerformance from '@/components/vaults/YourPerformance';

import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';
import usePathToVaultPubKey from '@/hooks/usePathToVaultName';

import SectionHeader from '../SectionHeader';
import Button from '../elements/Button';
import FadeInDiv from '../elements/FadeInDiv';
import Loading from '../elements/Loading';
import { ExternalLink } from '../icons';
import DevFunctions from './DevFunctions';
import { VaultTable } from './VaultTable/VaultTable';

export default function VaultPage() {
	const [selectedTab, setSelectedTab] = useState<VaultTab>(
		VaultTab.VaultPerformance
	);
	const vaultAccountData = useCurrentVaultAccountData();
	const currentVaultPubKey = usePathToVaultPubKey();
	const { devSwitchIsOn } = useDevSwitchIsOn();

	useFetchEventRecords(currentVaultPubKey);
	useSyncAccountSummary(currentVaultPubKey);

	const isLoading = !vaultAccountData;

	const renderLeftPanel = () => {
		switch (selectedTab) {
			case VaultTab.VaultPerformance:
			default:
				return <VaultPerformance />;
			case VaultTab.UserPerformance:
				return <YourPerformance />;
			case VaultTab.Overview:
				return <VaultOverview />;
		}
	};

	return (
		<div>
			{isLoading && (
				<div className="flex items-center justify-center w-full h-[80vh]">
					<Loading text="Loading Vault" />
				</div>
			)}
			<div
				className={twMerge(
					'flex flex-col items-center w-full sm:px-2',
					isLoading ? 'h-0 overflow-hidden' : 'h-auto'
				)}
			>
				<FadeInDiv
					className={'flex flex-col items-center w-full'}
					fadeCondition={!isLoading}
				>
					<VaultHero />
					<VaultTabs
						selectedTab={selectedTab}
						setSelectedTab={setSelectedTab}
					/>
				</FadeInDiv>
				<FadeInDiv
					delay={200}
					className={twMerge(
						'flex justify-between w-full gap-8 mt-8 md:mt-16 flex-col items-center md:items-start'
					)}
					fadeCondition={!isLoading}
				>
					<div className="flex flex-col items-center w-full gap-8 md:flex-row md:items-start">
						<div className="md:max-w-[580px] w-full [&>div]:p-1">
							{renderLeftPanel()}
						</div>
						<div className="flex justify-center grow">
							<div className="flex flex-col gap-7 max-w-[456px] min-w-[340px] items-center">
								<DepositWithdrawForm setVaultTab={setSelectedTab} />
								<WhiteGloveDetails />
								{devSwitchIsOn && <DevFunctions />}
							</div>
						</div>
					</div>

					{selectedTab === VaultTab.VaultPerformance && (
						<FadeInDiv delay={200} className="w-full max-w-full">
							<SectionHeader className="mb-4">Vault Details</SectionHeader>
							<VaultTable />
							<a
								href={`https://app.drift.trade/?authority=${vaultAccountData?.pubkey.toString()}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								<Button
									secondary
									Icon={() => <ExternalLink className="w-4 h-4" />}
									className="mt-4"
								>
									View Vault Activity on Drift
								</Button>
							</a>
						</FadeInDiv>
					)}
				</FadeInDiv>
			</div>
		</div>
	);
}
