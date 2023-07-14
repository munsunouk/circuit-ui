'use client';

import { useState } from 'react';

import DepositWithdrawForm from '@/components/vaults/DepositWithdrawForm';
import VaultHero from '@/components/vaults/VaultHero';
import VaultOverview from '@/components/vaults/VaultOverview';
import VaultPerformance from '@/components/vaults/VaultPerformance';
import VaultTabs, { VaultTab } from '@/components/vaults/VaultTabs';
import WhiteGloveDetails from '@/components/vaults/WhiteGloveDetails';
import YourPerformance from '@/components/vaults/YourPerformance';

export default function PrivateVaultPage() {
	const [selectedTab, setSelectedTab] = useState<VaultTab>(
		VaultTab.VaultPerformance
	);

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
		<div className="flex flex-col items-center w-full">
			<VaultHero />
			<VaultTabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
			<div className="flex justify-between w-full gap-10 md:gap-16 mt-16 lg:gap-[130px]">
				<div className="max-w-[580px] w-full">{renderLeftPanel()}</div>
				<div className="flex flex-col gap-7 max-w-[456px] min-w-[340px]">
					<DepositWithdrawForm />
					<WhiteGloveDetails />
				</div>
			</div>
		</div>
	);
}
