import { twMerge } from 'tailwind-merge';

export enum VaultTab {
	VaultPerformance,
	UserPerformance,
	Overview,
}

const VAULT_TABS = [
	{
		label: 'Vault Performance',
		tab: VaultTab.VaultPerformance,
	},
	{
		label: 'Your Performance',
		tab: VaultTab.UserPerformance,
	},
	{
		label: 'Overview',
		tab: VaultTab.Overview,
	},
];

export default function VaultTabs({
	selectedTab,
	setSelectedTab,
}: {
	selectedTab: VaultTab;
	setSelectedTab: (tab: VaultTab) => void;
}) {
	return (
		<div className="flex mt-20 border divide-x rounded-sm border-container-border divide-container-border">
			{VAULT_TABS.map((tab) => (
				<div
					key={tab.tab}
					className={twMerge(
						'w-[200px] text-center text-xl py-4 cursor-pointer hover:opacity-80 bg-transparent transition duration-300',
						selectedTab === tab.tab &&
							'bg-container-bg-selected text-text-selected'
					)}
					onClick={() => setSelectedTab(tab.tab)}
				>
					{tab.label}
				</div>
			))}
		</div>
	);
}
