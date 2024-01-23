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

import { useCurrentVault } from '@/hooks/useVault';

import { VaultDataTableBase } from './VaultDataTableBase';

const columnHelper = createColumnHelper<
	OpenPosition & { indexPrice: number }
>();

const columns = [
	columnHelper.accessor(
		(position) => {
			return (
				<Table.MarketCell
					marketName={position.marketSymbol}
					direction={position.direction}
					className="w-[120px]"
				/>
			);
		},
		{
			header: 'Market',
			cell: (info) => info.getValue(),
		}
	),
	columnHelper.accessor(
		(row) => (
			<div className="flex flex-col w-[140px]">
				<Table.NumericValue>
					{`${BigNum.from(row.baseSize.abs(), BASE_PRECISION_EXP).prettyPrint(
						true
					)} ${COMMON_UI_UTILS.getBaseAssetSymbol(row.marketSymbol)}`}
				</Table.NumericValue>
				<Table.NumericValue className="text-[13px]">
					{BigNum.from(row.baseSize.abs(), BASE_PRECISION_EXP)
						.mul(
							BigNum.fromPrint(row.indexPrice.toString(), PRICE_PRECISION_EXP)
						)
						.shiftTo(PRICE_PRECISION_EXP)
						.toNotional()}
				</Table.NumericValue>
			</div>
		),
		{
			header: 'Size',
			cell: (info) => info.getValue(),
		}
	),
	columnHelper.accessor(
		(row) => (
			<div className="flex flex-col">
				<span>
					${BigNum.from(row.entryPrice, PRICE_PRECISION_EXP).prettyPrint()}
				</span>
				<span className="text-[13px] text-text-secondary">
					{BigNum.fromPrint(
						row.indexPrice.toString(),
						PRICE_PRECISION_EXP
					).toNotional()}
				</span>
			</div>
		),
		{
			header: 'Entry/Index',
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
					row.pnlVsMark.lt(ZERO)
						? 'text-text-negative-red'
						: 'text-text-success-green'
				)}
			>
				{row.pnlVsMark.lt(ZERO) ? '-' : ''}$
				{BigNum.from(row.pnlVsMark, PRICE_PRECISION_EXP).abs().prettyPrint()}
				<div className="text-[13px]">
					{COMMON_UI_UTILS.calculatePnlPctFromPosition(
						row.pnlVsMark,
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
	const openPositionsWithIndexPrice =
		useCurrentVault()?.accountSummary.openPositions ?? [];

	return (
		<VaultDataTableBase
			data={openPositionsWithIndexPrice}
			columns={columns}
			stickyFirstColumn
		/>
	);
};
