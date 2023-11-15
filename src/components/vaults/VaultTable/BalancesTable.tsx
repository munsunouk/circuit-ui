import { UserBalance } from '@/types';
import { MarketType } from '@drift-labs/sdk';
import { COMMON_UI_UTILS } from '@drift/common';
import { createColumnHelper } from '@tanstack/react-table';

import Table from '@/components/elements/Table';

import { useVaultBalances } from '@/hooks/table-data/useVaultBalances';
import { useCurrentVault } from '@/hooks/useVault';

import { getMarket } from '@/utils/utils';

import { OrderedSpotMarkets } from '@/constants/environment';

import { VaultDataTableBase } from './VaultDataTableBase';

const columnHelper = createColumnHelper<UserBalance>();

const columns = [
	columnHelper.accessor(
		(balance) => {
			const fullMarketName = COMMON_UI_UTILS.getFullMarketName(
				getMarket(balance.marketIndex, MarketType.SPOT)
			);

			return (
				<Table.AssetCell marketName={fullMarketName} className="w-[100px]" />
			);
		},
		{
			header: 'Market',
			cell: (info) => info.getValue(),
		}
	),
	columnHelper.accessor(
		(row) =>
			`${row.baseBalance.prettyPrint()} ${
				OrderedSpotMarkets[row.marketIndex].symbol
			}`,
		{
			id: 'baseBalance',
			header: () => 'Balance',
			cell: (info) => (
				<Table.NumericValue className="w-[215px]">
					{info.getValue()}
				</Table.NumericValue>
			),
		}
	),
	columnHelper.accessor('quoteValue', {
		header: () => 'Notional',
		cell: (info) => (
			<Table.NumericValue className="w-[190px]">
				${info.getValue().prettyPrint()}
			</Table.NumericValue>
		),
	}),
	columnHelper.accessor('liquidationPrice', {
		header: () => 'Liq. Price',
		cell: (info) => (
			<Table.NumericValue className="w-[140px]">
				{info.getValue().eqZero() ? '-' : `$${info.getValue().prettyPrint()}`}
			</Table.NumericValue>
		),
	}),
];

export const BalancesTable = () => {
	const vault = useCurrentVault();
	const vaultDriftUserAccount = vault?.vaultDriftUserAccount;
	const vaultDriftUser = vault?.vaultDriftUser;
	const vaultBalances = useVaultBalances(vaultDriftUserAccount, vaultDriftUser);

	return <VaultDataTableBase data={vaultBalances} columns={columns} />;
};
