'use client';

import { useState } from 'react';

import VaultHero from '@/components/vaults/VaultHero';
import VaultTabs, { VaultTab } from '@/components/vaults/VaultTabs';

export default function PrivateVaultPage() {
	const [selectedTab, setSelectedTab] = useState<VaultTab>(
		VaultTab.VaultPerformance
	);

	return (
		<div className="flex flex-col items-center">
			<VaultHero />
			<VaultTabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
		</div>
	);
}
