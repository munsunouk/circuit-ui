import { COMMON_UI_UTILS } from '@drift/common';
import {
	ColumnDef,
	HeaderGroup,
	RowData,
	RowModel,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { sourceCodePro } from '@/constants/fonts';

import MarketIcon from './MarketIcon';

const TableHeader = <T extends RowData>({
	headerGroups,
	stickyFirstColumn,
	hasScrolledHorizontally,
}: {
	headerGroups: HeaderGroup<T>[];
	stickyFirstColumn?: boolean;
	hasScrolledHorizontally: boolean;
}) => {
	return (
		<thead>
			{headerGroups.map((headerGroup) => (
				<tr
					key={headerGroup.id}
					className="sticky top-0 border-b border-container-border"
				>
					{headerGroup.headers.map((header, index) => (
						<th
							key={header.id}
							className={twMerge(
								'px-2 py-1 text-left bg-gray-900',
								stickyFirstColumn && 'left-0 top-0 first:sticky'
							)}
						>
							{/** Need to create custom border because setting border to the <th> element itself doesn't work on scroll */}
							<div
								className={twMerge(
									'h-full w-[1px] absolute bg-container-border opacity-0 right-0 top-0 transition-opacity',
									stickyFirstColumn &&
										hasScrolledHorizontally &&
										index === 0 &&
										'opacity-100'
								)}
							/>
							{header.isPlaceholder
								? null
								: flexRender(
										header.column.columnDef.header,
										header.getContext()
									)}
						</th>
					))}
				</tr>
			))}
		</thead>
	);
};

const TableBody = <T extends RowData>({
	rowModel,
	stickyFirstColumn,
	hasScrolledHorizontally,
	hasScrolledVertically,
}: {
	rowModel: RowModel<T>;
	stickyFirstColumn?: boolean;
	hasScrolledHorizontally: boolean;
	hasScrolledVertically: boolean;
}) => {
	return (
		<tbody className="divide-y border-container-border divide-container-border">
			{rowModel.rows.map((row) => (
				<tr
					key={row.id}
					className={twMerge(
						!hasScrolledVertically &&
							'last:!border-b last:border-container-border' // for vanity; prevents the last row from having a border when the table is vertically scrollable
					)}
				>
					{row.getVisibleCells().map((cell, index) => (
						<td
							key={cell.id}
							className={twMerge(
								'p-2 bg-black',
								stickyFirstColumn && 'left-0 first:sticky'
							)}
						>
							{/** Need to create custom border because setting border to the <th> element itself doesn't work on scroll */}
							<span
								className={twMerge(
									'h-full w-[1px] absolute bg-container-border opacity-0 right-0 top-0 transition-opacity',
									stickyFirstColumn &&
										hasScrolledHorizontally &&
										index === 0 &&
										'opacity-100'
								)}
							/>
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
						</td>
					))}
				</tr>
			))}
		</tbody>
	);
};

const MarketCell = ({
	className,
	marketName,
	direction,
}: {
	className?: string;
	marketName: string;
	direction: 'short' | 'long' | 'buy' | 'sell';
}) => {
	const textColor =
		direction === 'long' || direction === 'buy'
			? 'text-text-success-green'
			: 'text-text-negative-red';

	return (
		<div className={twMerge('flex gap-2 items-center', className)}>
			<MarketIcon marketName={marketName} />
			<div>
				<div>{marketName}</div>
				<div className={twMerge(textColor, 'uppercase text-[13px] -mt-1')}>
					{direction}
				</div>
			</div>
		</div>
	);
};

const AssetCell = ({
	className,
	marketName,
}: {
	className?: string;
	marketName: string;
}) => {
	return (
		<div className={twMerge('flex gap-2 items-center', className)}>
			<MarketIcon marketName={marketName} />
			<div>{COMMON_UI_UTILS.getBaseAssetSymbol(marketName)}</div>
		</div>
	);
};

const NumericValue = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => {
	return (
		<div
			className={twMerge(
				sourceCodePro.className,
				className,
				'whitespace-nowrap'
			)}
		>
			{children}
		</div>
	);
};

export type TableProps<T> = {
	data: T[];
	columns: ColumnDef<T, any>[];
	className?: string;
	stickyFirstColumn?: boolean;
};

function Table<T extends RowData>({
	data,
	columns,
	className,
	stickyFirstColumn,
}: TableProps<T>) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	const [hasScrolledHorizontally, setHasScrolledHorizontally] = useState(false);
	const [hasScrolledVertically, setHasScrolledVertically] = useState(false);

	const scrollContainerRef = useRef<HTMLDivElement | null>(null);

	// handle scroll effect to toggle borders for sticky first column/last row
	useEffect(() => {
		if (!scrollContainerRef.current) return;

		const handleScroll = () => {
			if (!scrollContainerRef.current) return;

			setHasScrolledHorizontally(scrollContainerRef.current.scrollLeft > 0);
			setHasScrolledVertically(scrollContainerRef.current.scrollTop > 0);
		};

		scrollContainerRef.current.addEventListener('scroll', handleScroll);

		return () => {
			if (!scrollContainerRef.current) return;

			scrollContainerRef.current.removeEventListener('scroll', handleScroll);
		};
	}, [scrollContainerRef.current]);

	return (
		<div
			ref={scrollContainerRef}
			className={twMerge(
				'max-w-full overflow-auto border border-container-border thin-scroll relative',
				className
			)}
		>
			<table className="w-full">
				<TableBody<T>
					rowModel={table.getRowModel()}
					stickyFirstColumn={stickyFirstColumn}
					hasScrolledHorizontally={hasScrolledHorizontally}
					hasScrolledVertically={hasScrolledVertically}
				/>

				{/** Header needs to be after the Body component for the header column to freeze */}
				<TableHeader<T>
					headerGroups={table.getHeaderGroups()}
					stickyFirstColumn={stickyFirstColumn}
					hasScrolledHorizontally={hasScrolledHorizontally}
				/>
			</table>
		</div>
	);
}

Table.MarketCell = MarketCell;
Table.AssetCell = AssetCell;
Table.NumericValue = NumericValue;

export default Table;
