import {
	BASE_PRECISION_EXP,
	BigNum,
	PRICE_PRECISION_EXP,
	ZERO,
} from '@drift-labs/sdk';
import { COMMON_UI_UTILS, OpenPosition } from '@drift/common';
import { createColumnHelper } from '@tanstack/react-table';
import { twMerge } from 'tailwind-merge';

import Table from '@/components/elements/Table';

import { useVaultOpenPerpPositions } from '@/hooks/table-data/useVaultOpenPerpPositions';
import usePathToVaultPubKey from '@/hooks/usePathToVaultName';

import { VaultDataTableBase } from './VaultDataTableBase';

const columnHelper = createColumnHelper<OpenPosition>();

const columns = [
	columnHelper.accessor(
		(position) => {
			return (
				<Table.MarketCell
					marketName={position.marketSymbol}
					direction={position.direction}
					className="w-[100px]"
				/>
			);
		},
		{
			header: 'Market',
			cell: (info) => info.getValue(),
		}
	),
	columnHelper.accessor(
		(row) =>
			`${BigNum.from(
				row.baseSize.abs(),
				BASE_PRECISION_EXP
			).prettyPrint()} ${COMMON_UI_UTILS.getBaseAssetSymbol(row.marketSymbol)}`,
		{
			header: 'Size',
			cell: (info) => (
				<Table.NumericValue className="w-[140px]">
					{info.getValue()}
				</Table.NumericValue>
			),
		}
	),
	columnHelper.accessor(
		(row) => (
			<div className="flex flex-col">
				<span>${BigNum.from(row.entryPrice, PRICE_PRECISION_EXP).toNum()}</span>
				{/* <span className="text-[13px] text-text-secondary"> // TODO: implement dlobStore and priceStore
					${BigNum.from(row.entryPrice, PRICE_PRECISION_EXP).toNum()}
				</span> */}
			</div>
		),
		{
			header: 'Entry',
			cell: (info) => (
				<Table.NumericValue className="w-[120px]">
					{info.getValue()}
				</Table.NumericValue>
			),
		}
	),
	columnHelper.accessor(
		(row) => (
			<div
				className={twMerge(
					row.pnl.lt(ZERO)
						? 'text-text-negative-red'
						: 'text-text-positive-green'
				)}
			>
				{row.pnl.lt(ZERO) ? '-' : ''}$
				{BigNum.from(row.pnl, PRICE_PRECISION_EXP).abs().prettyPrint()}
				<div className="text-[13px]">
					{COMMON_UI_UTILS.calculatePnlPctFromPosition(
						row.pnl,
						row.quoteEntryAmount
					).toFixed(3)}
					%
				</div>
			</div>
		),
		{
			header: 'P&L',
			cell: (info) => (
				<Table.NumericValue className="w-[160px]">
					{info.getValue()}
				</Table.NumericValue>
			),
		}
	),
	columnHelper.accessor('liqPrice', {
		header: 'Liq. Price',
		cell: (info) => {
			const liqPrice = BigNum.from(info.getValue(), PRICE_PRECISION_EXP);

			return (
				<Table.NumericValue className="w-[140px]">
					{liqPrice.lteZero() ? 'None' : `$${liqPrice.prettyPrint()}`}
				</Table.NumericValue>
			);
		},
	}),
];

export const OpenPositionsTable = () => {
	const vaultPubKey = usePathToVaultPubKey();
	const openPositions = useVaultOpenPerpPositions(vaultPubKey);

	return <VaultDataTableBase data={openPositions} columns={columns} />;
};
