import usePathToVaultPubKey from '@/hooks/usePathToVaultName';

import { getUiVaultConfig } from '@/utils/vaults';

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
	const vaultPublicKey = usePathToVaultPubKey();
	const uiVaultConfig = getUiVaultConfig(vaultPublicKey);

	const filteredTabs = VAULT_TABS.filter((tab) => {
		return !(!uiVaultConfig?.vaultOverview && tab.tab === VaultTab.Overview);
	});

	return (
		<ButtonTabs
			tabs={filteredTabs.map((tab) => ({
				key: tab.label,
				label: tab.label,
				selected: selectedTab === tab.tab,
				onSelect: () => setSelectedTab(tab.tab),
			}))}
			className="w-full mt-10 md:mt-10 max-w-[690px]"
			tabClassName="flex-1 md:w-[200px] text-xs md:text-xl first:rounded-l-sm last:rounded-r-sm"
		/>
	);
}
