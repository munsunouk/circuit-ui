import { useCommonDriftStore, useDevSwitchIsOn } from '@drift-labs/react';
import { BigNum, ZERO } from '@drift-labs/sdk';
import {
	EventType,
	VaultDepositorAction,
	WrappedEvent,
} from '@drift-labs/vaults-sdk';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useState } from 'react';
import React from 'react';
import { twMerge } from 'tailwind-merge';

import useAppStore from '@/hooks/useAppStore';
import { useCurrentVault } from '@/hooks/useVault';

import { OrderedSpotMarkets } from '@/constants/environment';
import { SOLANA_TXN_EXPLORER_URL } from '@/constants/misc';

import SectionHeader from '../SectionHeader';
import Button from '../elements/Button';
import FadeInDiv from '../elements/FadeInDiv';
import Loading from '../elements/Loading';
import { ExternalLink, PageArrow } from '../icons';

const PAGE_SIZE = 10;

function enumToStr(enumStr: Record<string, any>) {
	return Object.keys(enumStr ?? {})?.[0];
}

const getLabel = (record: WrappedEvent<EventType>) => {
	const spotMarket = OrderedSpotMarkets[record.spotMarketIndex];

	switch (enumToStr(record.action)) {
		case enumToStr(VaultDepositorAction.DEPOSIT):
			return `Deposited ${BigNum.from(
				record.amount,
				spotMarket.precisionExp
			).toNum()} ${spotMarket.symbol}`;
		case enumToStr(VaultDepositorAction.WITHDRAW):
			const isFullWithdrawal = record.vaultSharesAfter.eq(ZERO);

			return (
				<>
					<span>
						Withdrew{' '}
						{BigNum.from(record.amount, spotMarket.precisionExp).toNum()}{' '}
						{spotMarket.symbol}
					</span>
					<span className="opacity-60">
						{isFullWithdrawal ? ' [Full Withdrawal]' : ''}
					</span>
				</>
			);
		case enumToStr(VaultDepositorAction.CANCEL_WITHDRAW_REQUEST):
			return `Cancel withdrawal request`;
		case enumToStr(VaultDepositorAction.WITHDRAW_REQUEST):
			return `Request Withdrawal of ${BigNum.from(
				record.amount,
				spotMarket.precisionExp
			).toNum()} ${spotMarket.symbol}`;
		case enumToStr(VaultDepositorAction.FEE_PAYMENT):
			console.log('fee payment', record);
			return 'Fee Payment';
		default:
			return 'Unknown transaction';
	}
};

const TransactionRow = ({ record }: { record: WrappedEvent<EventType> }) => {
	const setAppStore = useAppStore((s) => s.set);
	const { devSwitchIsOn } = useDevSwitchIsOn();

	const openActionRecordModal = () => {
		setAppStore((s) => {
			s.modals.showActionRecordModal = {
				show: true,
				actionRecord: record,
			};
		});
	};

	return (
		<FadeInDiv
			className="flex justify-between w-full gap-1 text-base md:text-lg"
			delay={100}
		>
			<span>{getLabel(record)}</span>
			<span className="flex items-center gap-1">
				<Link
					className="flex items-center gap-1 transition-all cursor-pointer hover:opacity-60 shrink-0 whitespace-nowrap"
					href={`${SOLANA_TXN_EXPLORER_URL}/${record.txSig}`}
					target="_blank"
					rel="noopener noreferrer"
				>
					{dayjs.unix(record.ts.toNumber()).format('DD MMM YYYY')}
					<span>
						<ExternalLink className="w-3 h-3" />
					</span>
				</Link>
				{devSwitchIsOn && (
					<Button className="p-1 text-sm" onClick={openActionRecordModal}>
						View
					</Button>
				)}
			</span>
		</FadeInDiv>
	);
};

const PaginationButton = ({
	children,
	onClick,
	selected,
}: {
	children: React.ReactNode;
	onClick: () => void;
	selected: boolean;
}) => {
	return (
		<Button
			secondary
			className={twMerge(
				'px-2 py-1 md:px-3 border-container-border w-[40px] md:w-[44px]',
				selected && 'bg-container-bg-hover border-container-border-hover'
			)}
			innerClassName={twMerge(
				'text-text-default text-sm md:text-base group-hover:text-black transition-all',
				selected && 'text-black'
			)}
			onClick={onClick}
		>
			{children}
		</Button>
	);
};

function TransactionHistory() {
	const vault = useCurrentVault();
	const authority = useCommonDriftStore((s) => s.authority);
	const [pageIndex, setPageIndex] = useState(0);

	const eventRecords = vault?.eventRecords?.records ?? [];
	const displayedRecords = eventRecords.slice(
		pageIndex * PAGE_SIZE,
		(pageIndex + 1) * PAGE_SIZE
	);
	const lastPage = Math.ceil((eventRecords.length ?? 0) / PAGE_SIZE) - 1;
	const isLoading = !vault?.eventRecords?.isLoaded;

	const renderRecords = () => {
		if (!authority) return null;

		if (isLoading) return <Loading />;

		if (eventRecords.length === 0) {
			return (
				<div className="text-base md:text-lg text-left w-full">
					No transactions yet.
				</div>
			);
		}

		return displayedRecords.map((record) => {
			return <TransactionRow record={record} key={record.txSig} />;
		});
	};

	const renderPagination = () => {
		let one: number | undefined,
			two: number | undefined,
			three: number | undefined;

		if (eventRecords?.length === 0 || lastPage === 0) {
			return null;
		} else if (lastPage < 3) {
			one = 0;
			two = lastPage >= 1 ? 1 : undefined;
			three = lastPage >= 2 ? 2 : undefined;
		} else if (pageIndex === 0) {
			one = 0;
			two = 1;
			three = 2;
		} else if (pageIndex === lastPage) {
			one = lastPage - 2;
			two = lastPage - 1;
			three = lastPage;
		} else {
			one = pageIndex - 1;
			two = pageIndex;
			three = pageIndex + 1;
		}

		const showExtremes = lastPage > 3;

		return (
			<>
				{showExtremes && (
					<PaginationButton onClick={() => setPageIndex(0)} selected={false}>
						<PageArrow className="w-5 h-6 group-hover:[&>path]:fill-black [&>path]:transition-all" />
					</PaginationButton>
				)}
				{one !== undefined && (
					<PaginationButton
						onClick={() => setPageIndex(one!)}
						selected={pageIndex === one}
					>
						{one + 1}
					</PaginationButton>
				)}
				{two !== undefined && (
					<PaginationButton
						onClick={() => setPageIndex(two!)}
						selected={pageIndex === two}
					>
						{two + 1}
					</PaginationButton>
				)}
				{three !== undefined && (
					<PaginationButton
						onClick={() => setPageIndex(three!)}
						selected={pageIndex === three}
					>
						{three + 1}
					</PaginationButton>
				)}
				{showExtremes && (
					<PaginationButton
						onClick={() => setPageIndex(lastPage)}
						selected={false}
					>
						<PageArrow className="w-5 h-6 rotate-180 group-hover:[&>path]:fill-black [&>path]:transition-all" />
					</PaginationButton>
				)}
			</>
		);
	};

	return (
		<div className="flex flex-col gap-4">
			<SectionHeader>Transaction History</SectionHeader>
			<div
				className={twMerge(
					'flex flex-col gap-2 items-center w-full',
					lastPage !== 0 && 'min-h-[352px]'
				)}
			>
				{renderRecords()}
			</div>
			<div className="flex items-center justify-end gap-1 md:gap-2">
				{renderPagination()}
			</div>
		</div>
	);
}

export default React.memo(TransactionHistory);
