'use client';

import { useCommonDriftStore } from '@drift-labs/react';
import { BN, BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { useWindowSize } from 'react-use';
import { twMerge } from 'tailwind-merge';

import { useAppActions } from '@/hooks/useAppActions';
import useAppStore from '@/hooks/useAppStore';
import { useVault } from '@/hooks/useVault';
import { useVaultStats } from '@/hooks/useVaultStats';

import { encodeVaultName } from '@/utils/utils';
import { getModifiedDietzApy } from '@/utils/vaults';

import { sourceCodePro, syne } from '@/constants/fonts';
import { UiVaultConfig } from '@/constants/vaults';

import Badge from '../elements/Badge';
import Button from '../elements/Button';
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
		<div className="flex flex-col text-center">
			<span>{label}</span>
			{loading ? (
				<Skeleton />
			) : (
				<span
					className={twMerge(
						sourceCodePro.className,
						'transition-all  md:text-2xl group-hover:md:text-2xl text-xl group-hover:text-lg'
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
}

function VaultStats({
	apy,
	tvl,
	capacity,
	loading,
	userBalance,
}: VaultStatsProps) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	return (
		<div className="flex flex-col w-full gap-4">
			<div className="flex justify-between w-full">
				<VaultStat label={'APY'} value={apy} loading={loading} />
				{!!userBalance && (
					<VaultStat
						label={'Your Balance'}
						value={`$${userBalance}`}
						loading={loading}
					/>
				)}
				<VaultStat label={'TVL'} value={`$${tvl}`} loading={loading} />
				<VaultStat
					label={'Capacity'}
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
						'h-full blue-white-gradient-background transition-[width] duration-1000',
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
}: {
	children: React.ReactNode;
	comingSoon: boolean;
	handleMouseEnter: () => void;
	handleMouseLeave: () => void;
	vaultName: string;
}) => {
	if (comingSoon) {
		return (
			<div
				className={
					'relative flex flex-col flex-1 w-full border cursor-pointer border-container-border group'
				}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
			>
				{children}
			</div>
		);
	}

	return (
		<Link
			href={`/vault/${encodeVaultName(vaultName)}`}
			className={
				'relative flex flex-col flex-1 w-full border cursor-pointer border-container-border group'
			}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
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

	const vaultPubkey = useMemo(
		() => (vault.pubkeyString ? new PublicKey(vault.pubkeyString) : undefined),
		[vault.pubkeyString]
	);
	const vaultStore = useVault(vaultPubkey);
	const [vaultAccountData, vaultDepositorAccountData] = useAppStore((s) => [
		s.getVaultAccountData(vaultPubkey),
		s.getVaultDepositorAccountData(vaultPubkey),
	]);

	const vaultStats = useVaultStats(vaultPubkey);
	const pnlHistory = vaultStore?.pnlHistory.dailyAllTimePnls ?? [];
	const firstPnl = pnlHistory[0];

	const [isHover, setIsHover] = useState(false);

	const tvl = vaultStats.totalAccountValue;
	const maxCapacity = vaultAccountData?.maxTokens ?? new BN(1);
	const capacityPct = Math.min(
		(tvl.toNumber() / maxCapacity.toNumber()) * 100,
		100
	);
	const historicalApy = getModifiedDietzApy(
		BigNum.from(vaultStats.totalAccountValue, QUOTE_PRECISION_EXP).toNum(),
		vaultStore?.vaultDeposits ?? []
	);

	// TODO: abstract this logic
	// User's vault share proportion
	const totalVaultShares = vaultAccountData?.totalShares.toNumber() ?? 0;
	const userVaultShares =
		vaultDepositorAccountData?.vaultShares.toNumber() ?? 0;
	const userSharesProportion = userVaultShares / (totalVaultShares ?? 1) || 0;

	// User's net deposits
	const vaultAccountBalance = vaultStats.totalAccountValue.toNumber();
	const userAccountBalanceProportion =
		vaultAccountBalance * userSharesProportion;
	const userAccountBalanceProportionBigNum = BigNum.from(
		userAccountBalanceProportion,
		QUOTE_PRECISION_EXP
	);
	const userAccountValueString =
		userAccountBalanceProportionBigNum.toMillified();

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

		if (width < 768) {
			viewportWidth = 20;
		} else {
			viewportWidth = 10;
		}

		return Math.round(Math.min((viewportWidth * width) / 100, maxHeight));
	}

	return (
		<CardContainer
			comingSoon={!vault.pubkeyString}
			handleMouseEnter={handleMouseEnter}
			handleMouseLeave={handleMouseLeave}
			vaultName={vault.name}
		>
			{/** Background image (separated to allow isolation of the brightness feature) */}
			<div
				className="absolute inset-0 z-10 transition-all group-hover:brightness-125"
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
					{isHover && <Particles color={vault.backdropParticlesColor} />}
				</div>
			</div>
			{/** Radial background on hover */}
			<div className="absolute inset-x-0 top-0 transition-all bottom-40 blue-radial-gradient-background group-hover:brightness-200 brightness-0" />

			{/** Main Content */}
			<div
				className="relative z-20 flex flex-col isolate grow"
				style={{ marginTop: `${topSectionHeight}px` }}
			>
				{/** Background blur + grayscale (separated to allow isolation of inner content from grayscale ) */}
				<div className="absolute inset-0 backdrop-blur" />
				<div className="flex flex-col items-center gap-4 px-4 py-4 text-center md:px-8 md:py-10 isolate grow">
					<div className="flex flex-col items-center gap-2">
						<span className={twMerge(syne.className, 'text-4xl font-bold')}>
							{vault.name}
						</span>
						<div className="flex flex-col items-center gap-2">
							<span>{vault.description}</span>
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
					<div className="w-full grow flex flex-col items-center justify-end h-[136px]">
						{!vault?.pubkeyString && (
							<span
								className={twMerge(
									sourceCodePro.className,
									'text-3xl radial-gradient-text'
								)}
							>
								Coming Soon
							</span>
						)}
						{!!vault?.pubkeyString && (
							<div className="flex flex-col items-center justify-end w-full">
								<VaultStats
									apy={`${(historicalApy * 100).toFixed(2)}%`}
									tvl={BigNum.from(tvl, QUOTE_PRECISION_EXP).toMillified()}
									capacity={capacityPct}
									loading={!vaultStats.isLoaded}
									userBalance={
										userAccountBalanceProportionBigNum.eqZero()
											? undefined
											: userAccountValueString
									}
								/>
								<div className="overflow-hidden transition-all group-hover:mt-5 w-full group-hover:h-[32px] h-0">
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
