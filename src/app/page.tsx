'use client';

import Image from 'next/image';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import DepositWithdrawForm from '@/components/vaults/DepositWithdrawForm';
import VaultHero from '@/components/vaults/VaultHero';
import VaultOverview from '@/components/vaults/VaultOverview';
import VaultPerformance from '@/components/vaults/VaultPerformance';
import VaultTabs, { VaultTab } from '@/components/vaults/VaultTabs';
import WhiteGloveDetails from '@/components/vaults/WhiteGloveDetails';
import YourPerformance from '@/components/vaults/YourPerformance';

import useCurrentVaultAccount from '@/hooks/useCurrentVaultAccount';

export default function PrivateVaultPage() {
	const [selectedTab, setSelectedTab] = useState<VaultTab>(
		VaultTab.VaultPerformance
	);
	const vault = useCurrentVaultAccount();

	const isLoading = !vault;

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
		<div className={'flex flex-col items-center w-full'}>
			{isLoading && (
				<div className="flex flex-col items-center justify-center w-full h-[80vh] gap-4">
					<div className="animate-pulse">
						<Image
							src="/circuits-icon.svg"
							alt="Circuits Icon"
							width="60"
							height="66"
						/>
					</div>
					<div className="loading">
						Loading Vault<span>.</span>
						<span>.</span>
						<span>.</span>
					</div>
				</div>
			)}
			<div
				className={twMerge(
					'flex flex-col items-center w-full',
					isLoading ? 'h-0 overflow-hidden' : 'h-auto'
				)}
			>
				<div
					className={twMerge(
						'flex flex-col items-center transition-opacity duration-300',
						isLoading ? 'opacity-0' : 'opacity-100'
					)}
				>
					<VaultHero />
					<VaultTabs
						selectedTab={selectedTab}
						setSelectedTab={setSelectedTab}
					/>
				</div>
				<div
					className={twMerge(
						'flex justify-between w-full gap-10 md:gap-16 mt-16 lg:gap-[130px] transition-opacity duration-300 delay-200',
						isLoading ? 'opacity-0' : 'opacity-100'
					)}
				>
					<div className="max-w-[580px] w-full [&>div]:p-1">
						{renderLeftPanel()}
					</div>
					<div className="flex flex-col gap-7 max-w-[456px] min-w-[340px]">
						<DepositWithdrawForm />
						<WhiteGloveDetails />
					</div>
				</div>
			</div>
		</div>
	);
}
