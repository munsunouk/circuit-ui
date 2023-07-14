'use client';

import { useState } from 'react';

import DepositWithdrawForm from '@/components/vaults/DepositWithdrawForm';
import VaultHero from '@/components/vaults/VaultHero';
import VaultTabs, { VaultTab } from '@/components/vaults/VaultTabs';
import WhiteGloveDetails from '@/components/vaults/WhiteGloveDetails';

export default function PrivateVaultPage() {
	const [selectedTab, setSelectedTab] = useState<VaultTab>(
		VaultTab.VaultPerformance
	);

	return (
		<div className="flex flex-col items-center w-full">
			<VaultHero />
			<VaultTabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
			<div className="flex justify-between w-full mt-16">
				<div></div>
				<div className="flex flex-col gap-7 max-w-[456px] min-w-[340px]">
					<DepositWithdrawForm />
					<WhiteGloveDetails />
				</div>
			</div>
		</div>
	);
}
