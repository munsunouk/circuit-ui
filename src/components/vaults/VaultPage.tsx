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

import FadeInDiv from '../elements/FadeInDiv';
import Loading from '../elements/Loading';
import DevFunctions from './DevFunctions';

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
					'flex flex-col items-center w-full px-2',
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
						'flex justify-between w-full gap-8 mt-8 md:mt-16 flex-col md:flex-row items-center md:items-start'
					)}
					fadeCondition={!isLoading}
				>
					<div className="md:max-w-[580px] w-full [&>div]:p-1">
						{renderLeftPanel()}
					</div>
					<div className="flex flex-col gap-7 max-w-[456px] min-w-[340px]">
						<DepositWithdrawForm setVaultTab={setSelectedTab} />
						<WhiteGloveDetails />
						{devSwitchIsOn && <DevFunctions />}
					</div>
				</FadeInDiv>
			</div>
		</div>
	);
}
