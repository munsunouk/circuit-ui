import { UserBalance } from '@/types';
import { UIMarket } from '@drift/common';
import { createColumnHelper } from '@tanstack/react-table';

import Table from '@/components/elements/Table';

import { useCurrentVault } from '@/hooks/useVault';

import { SPOT_MARKETS_LOOKUP } from '@/constants/environment';

import { VaultDataTableBase } from './VaultDataTableBase';

const columnHelper = createColumnHelper<UserBalance>();

const columns = [
	columnHelper.accessor(
		(balance) => {
			const fullMarketName = UIMarket.createSpotMarket(
				balance.marketIndex
			).marketName;
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
				SPOT_MARKETS_LOOKUP[row.marketIndex].symbol
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
	const vaultBalances = useCurrentVault()?.accountSummary.balances ?? [];

	return (
		<VaultDataTableBase
			data={vaultBalances}
			columns={columns}
			stickyFirstColumn
		/>
	);
};
