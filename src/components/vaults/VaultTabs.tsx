import ButtonTabs from '../elements/ButtonTabs';

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
		<ButtonTabs
			tabs={VAULT_TABS.map((tab) => ({
				label: tab.label,
				selected: selectedTab === tab.tab,
				onSelect: () => setSelectedTab(tab.tab),
			}))}
			className="w-full mt-10 md:mt-20"
			tabClassName="flex-1 md:w-[200px] text-xs md:text-xl first:rounded-l-sm last:rounded-r-sm"
		/>
	);
}
