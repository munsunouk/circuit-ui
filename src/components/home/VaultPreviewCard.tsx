'use client';

import useAppStore from '@/stores/app/useAppStore';
import { UiVaultConfig } from '@/types';
import { useCommonDriftStore } from '@drift-labs/react';
import { BN, BigNum } from '@drift-labs/sdk';
import { USDC_SPOT_MARKET_INDEX } from '@drift/common';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { useWindowSize } from 'react-use';
import { twMerge } from 'tailwind-merge';

import { useAppActions } from '@/hooks/useAppActions';
import useVaultApyAndCumReturns from '@/hooks/useVaultApyAndCumReturns';
import { useVaultStats } from '@/hooks/useVaultStats';

import { encodeVaultName, hexToHue } from '@/utils/utils';
import { getUiVaultConfig } from '@/utils/vaults';

import { BREAKPOINTS } from '@/constants/breakpoints';
import { USDC_MARKET } from '@/constants/environment';
import { sourceCodePro, syne } from '@/constants/fonts';

import Badge from '../elements/Badge';
import Button from '../elements/Button';
import MarketIcon from '../elements/MarketIcon';
import { Lock } from '../icons';
import Particles from './Particles';

function VaultStat({
	label,
	value,
	loading,
}: {
	label: string;
	value: string;
	loading: boolean;
}) {
	return (
		<div className="flex justify-between w-full text-center lg:flex-col lg:w-auto lg:justify-center">
			<span>{label}</span>
			{loading ? (
				<Skeleton />
			) : (
				<span
					className={twMerge(
						sourceCodePro.className,
						'md:transition-all lg:text-2xl group-hover:lg:text-2xl text-base'
					)}
				>
					{value}
				</span>
			)}
		</div>
	);
}

interface VaultStatsProps {
	apy: string;
	tvl: string;
	userBalance?: string;
	capacity: number;
	loading: boolean;
	assetLabel: string;
	isApyLoading: boolean;
}

function VaultStats({
	apy,
	tvl,
	capacity,
	loading,
	userBalance,
	assetLabel,
	isApyLoading,
}: VaultStatsProps) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	return (
		<div className="flex flex-col w-full gap-4">
			<div className="flex flex-col justify-between w-full lg:flex-row">
				<VaultStat label={'APY'} value={apy} loading={isApyLoading} />
				{!!userBalance && (
					<VaultStat
						label={`Your Balance${assetLabel ? ` (${assetLabel})` : ''}`}
						value={`${assetLabel ? '' : '$'}${userBalance}`}
						loading={loading}
					/>
				)}
				<VaultStat
					label={`TVL${assetLabel ? ` (${assetLabel})` : ''}`}
					value={`${assetLabel ? '' : '$'}${tvl}`}
					loading={loading}
				/>
				<VaultStat
					label={`Capacity`}
					value={`${capacity.toFixed(2)}%`}
					loading={loading}
				/>
			</div>
			<div className="h-2 border">
				<div
					style={{
						width: isMounted && capacity > 0 ? `${capacity}%` : '0%',
					}}
					className={twMerge(
						'h-full blue-white-gradient-background md:duration-1000',
						capacity !== 100 && 'border-r'
					)}
				/>
			</div>
		</div>
	);
}

const CardContainer = ({
	children,
	comingSoon,
	handleMouseEnter,
	handleMouseLeave,
	vaultName,
	hue,
}: {
	children: React.ReactNode;
	comingSoon: boolean;
	handleMouseEnter: () => void;
	handleMouseLeave: () => void;
	vaultName: string;
	hue: number;
}) => {
	const isLargeAndAbove = useWindowSize().width >= 1024;

	if (comingSoon) {
		return (
			<div
				className={twMerge(
					'relative flex flex-col flex-1 w-full border cursor-pointer border-container-border group',
					isLargeAndAbove && ' card-hover-border-glow'
				)}
				onMouseEnter={isLargeAndAbove ? handleMouseEnter : undefined}
				onMouseLeave={isLargeAndAbove ? handleMouseLeave : undefined}
				// @ts-ignore
				style={{ '--hue': hue }}
			>
				{children}
			</div>
		);
	}

	return (
		<Link
			href={`/vault/${encodeVaultName(vaultName)}`}
			className={twMerge(
				'relative flex flex-col flex-1 w-full border cursor-pointer border-container-border group',
				isLargeAndAbove && ' card-hover-border-glow'
			)}
			onMouseEnter={isLargeAndAbove ? handleMouseEnter : undefined}
			onMouseLeave={isLargeAndAbove ? handleMouseLeave : undefined}
			// @ts-ignore
			style={{ '--hue': hue }}
		>
			{children}
		</Link>
	);
};

interface VaultPreviewCardProps {
	vault: UiVaultConfig;
}

export default function VaultPreviewCard({ vault }: VaultPreviewCardProps) {
	const { width } = useWindowSize();
	const [connection, authority] = useCommonDriftStore((s) => [
		s.connection,
		s.authority,
	]);
	const appActions = useAppActions();
	const isBelowLarge = useWindowSize().width < 1024;

	const vaultPubkey = useMemo(
		() => (vault.pubkeyString ? new PublicKey(vault.pubkeyString) : undefined),
		[vault.pubkeyString]
	);
	const vaultDepositorStats = useAppStore((s) =>
		s.getVaultDepositorStats(vaultPubkey)
	);
	const vaultAccountData = useAppStore((s) =>
		s.getVaultAccountData(vaultPubkey)
	);
	const vaultStats = useVaultStats(vaultPubkey);

	const uiVaultConfig = getUiVaultConfig(vaultPubkey);
	const spotMarketConfig = uiVaultConfig?.market ?? USDC_MARKET;

	const [isHover, setIsHover] = useState(false);

	const tvl = vaultStats.totalAccountBaseValue;
	const maxCapacity = vaultAccountData?.maxTokens ?? new BN(1);
	const capacityPct = Math.min(
		(tvl.toNumber() / maxCapacity.toNumber()) * 100,
		100
	);
	const { apy, isLoading: isApyLoading } = useVaultApyAndCumReturns(
		vaultAccountData?.pubkey.toString(),
		vaultAccountData?.user.toString(),
		spotMarketConfig.marketIndex
	);

	const { balanceBase } = vaultDepositorStats;

	const balanceBaseString = balanceBase.toMillified();

	// UI variables
	const assetLabel =
		spotMarketConfig.marketIndex === USDC_SPOT_MARKET_INDEX
			? ''
			: spotMarketConfig.symbol;
	const comingSoon = !vault.pubkeyString || !!uiVaultConfig?.comingSoon;

	// fetch vault account data
	useEffect(() => {
		if (vaultPubkey && connection) {
			appActions.fetchVault(vaultPubkey);
		}
	}, [vault.pubkeyString, connection]);

	// fetch vault depositor account data
	useEffect(() => {
		if (vaultPubkey && authority && vaultAccountData) {
			appActions.initVaultDepositorSubscriber(vaultPubkey, authority);
		}
	}, [vaultPubkey, authority, !!vaultAccountData]);

	const topSectionHeight = calculateTopSectionHeight();

	const handleMouseEnter = () => {
		setIsHover(true);
	};

	const handleMouseLeave = () => {
		setIsHover(false);
	};

	function calculateTopSectionHeight() {
		const maxHeight = 120;
		let viewportWidth;

		if (width < BREAKPOINTS.md) {
			viewportWidth = 20;
		} else {
			viewportWidth = 10;
		}

		return Math.round(Math.min((viewportWidth * width) / 100, maxHeight));
	}

	return (
		<CardContainer
			comingSoon={comingSoon}
			handleMouseEnter={handleMouseEnter}
			handleMouseLeave={handleMouseLeave}
			vaultName={vault.name}
			hue={hexToHue(vault.backdropParticlesColor)}
		>
			{/** Background image (separated to allow isolation of the brightness feature) */}
			<div
				className="absolute inset-0 z-10 md:transition-all group-hover:brightness-125"
				style={{
					backgroundImage: `url(${vault.previewBackdropUrl})`,
					backgroundSize: 'cover',
				}}
			/>
			{/** Particles on hover */}
			<div className="absolute z-50 flex justify-center w-full">
				<div
					className="w-[80%]"
					style={{
						height: `${topSectionHeight}px`,
					}}
				>
					{isHover && !isBelowLarge && (
						<Particles color={vault.backdropParticlesColor} />
					)}
				</div>
			</div>
			{/** Radial background on hover */}
			<div className="absolute inset-x-0 top-0 md:transition-all bottom-40 blue-radial-gradient-background group-hover:brightness-200 brightness-0" />

			{/** Main Content */}
			<div
				className="relative z-20 flex flex-col isolate grow"
				style={{ marginTop: `${topSectionHeight}px` }}
			>
				{/** Background blur + grayscale (separated to allow isolation of inner content from grayscale ) */}
				<div className="absolute inset-0 backdrop-blur" />
				<div className="flex flex-col items-center gap-4 px-4 py-4 text-center lg:px-8 lg:pb-10 lg:pt-8 isolate grow">
					<div className="flex flex-col items-center w-full gap-2">
						<span className={twMerge(syne.className, 'text-4xl font-bold')}>
							{vault.name}
						</span>
						<div className="flex flex-col items-center w-full gap-2">
							<div className="flex items-center">
								<span>Deposit: </span>
								<span>
									{' '}
									<MarketIcon
										key={spotMarketConfig.symbol}
										marketName={spotMarketConfig.symbol}
										className="ml-1"
									/>
								</span>

								<div className="h-4 w-[1px] bg-white mx-2"></div>

								<span>Trading: </span>
								{uiVaultConfig?.assetsOperatedOn && (
									<div className="flex gap-1">
										{uiVaultConfig?.assetsOperatedOn?.map((asset) => {
											return (
												<MarketIcon
													key={asset.market.symbol}
													marketName={asset.market?.symbol}
													className="ml-1"
												/>
											);
										})}
									</div>
								)}
							</div>

							{vault.permissioned && (
								<Badge>
									<div className="flex items-center justify-center gap-1 whitespace-nowrap">
										<Lock />
										<span>Whitelist Only</span>
									</div>
								</Badge>
							)}
						</div>
					</div>
					<div className="w-full grow flex flex-col items-center justify-end lg:h-[136px]">
						{comingSoon ? (
							<span
								className={twMerge(
									sourceCodePro.className,
									'text-3xl radial-gradient-text pb-4 lg:pb-0'
								)}
							>
								Coming Soon
							</span>
						) : (
							<div className="flex flex-col items-center justify-end w-full">
								<VaultStats
									apy={`${
										uiVaultConfig?.temporaryApy
											? uiVaultConfig?.temporaryApy
											: apy.toFixed(2)
									}%`}
									tvl={BigNum.from(
										tvl,
										spotMarketConfig.precisionExp
									).toMillified()}
									capacity={capacityPct}
									loading={!vaultStats.isLoaded}
									isApyLoading={isApyLoading}
									userBalance={
										balanceBase.eqZero() ? undefined : balanceBaseString
									}
									assetLabel={assetLabel}
								/>
								<div className="overflow-hidden lg:transition-all lg:group-hover:mt-5 w-full lg:group-hover:h-[32px] lg:h-0 mt-2">
									<Button className={twMerge('py-1 w-full')}>Open Vault</Button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</CardContainer>
	);
}
