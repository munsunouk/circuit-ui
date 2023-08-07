'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useWindowSize } from 'react-use';
import { twMerge } from 'tailwind-merge';

import { encodeVaultName } from '@/utils/utils';

import { sourceCodePro, syne } from '@/constants/fonts';
import { UiVaultConfig } from '@/constants/vaults';

import Badge from '../elements/Badge';
import Button from '../elements/Button';
import { Lock } from '../icons';
import Particles from './Particles';

function VaultStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col text-center">
			<span>{label}</span>
			<span
				className={twMerge(
					sourceCodePro.className,
					'transition-all duration-300 md:text-3xl group-hover:md:text-2xl text-xl group-hover:text-lg'
				)}
			>
				{value}
			</span>
		</div>
	);
}

const DUMMY_VAULTS_STATS: VaultStats = {
	thirtyDayReturn: '32.76%',
	tvl: '$33.37',
	capacity: 90.7,
};

interface VaultStats {
	thirtyDayReturn: string;
	tvl: string;
	capacity: number;
}

function VaultStats({ thirtyDayReturn, tvl, capacity }: VaultStats) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	return (
		<div className="flex flex-col w-full gap-4">
			<div className="flex justify-between w-full">
				<VaultStat label={'30D Return'} value={thirtyDayReturn} />
				<VaultStat label={'TVL'} value={tvl} />
				<VaultStat label={'Capacity'} value="99.7%" />
			</div>
			<div className="h-2 border">
				<div
					style={{
						width: isMounted && capacity > 0 ? `${capacity}%` : '0%',
					}}
					className={twMerge(
						'h-full blue-white-gradient-background transition-[width] duration-2000',
						capacity !== 100 && 'border-r'
					)}
				/>
			</div>
		</div>
	);
}

interface VaultPreviewCardProps {
	vault: UiVaultConfig;
}

export default function VaultPreviewCard({ vault }: VaultPreviewCardProps) {
	const [isHover, setIsHover] = useState(false);
	const { width } = useWindowSize();

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
		<Link
			href={`/vault/${encodeVaultName(vault.name)}`}
			className="relative flex flex-col flex-1 w-full border cursor-pointer border-container-border group"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/** Background image (separated to allow isolation of the brightness feature) */}
			<div
				className="absolute inset-0 z-10 transition-all duration-300 group-hover:brightness-125"
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
			<div className="absolute inset-x-0 top-0 transition-all duration-300 bottom-40 blue-radial-gradient-background group-hover:brightness-200 brightness-0" />

			<div
				className="relative z-20 flex flex-col isolate grow"
				style={{ marginTop: `${topSectionHeight}px` }}
			>
				{/** Background blur + grayscale (separated to allow isolation of inner content from grayscale ) */}
				<div className="absolute inset-0 backdrop-blur" />
				<div className="flex flex-col items-center gap-4 px-4 py-4 text-center md:px-16 md:py-10 isolate grow">
					<div className="flex flex-col items-center gap-2">
						<span className={twMerge(syne.className, 'text-4xl font-bold')}>
							{vault.name}
						</span>
						<div className="flex items-center gap-2">
							{vault.permissioned && (
								<Badge>
									<div className="flex items-center justify-center gap-1 whitespace-nowrap">
										<Lock />
										<span>Whitelist Only</span>
									</div>
								</Badge>
							)}
							<span>{vault.description}</span>
						</div>
					</div>
					<div className="w-full grow flex flex-col items-center justify-end h-[136px]">
						{vault?.comingSoon && (
							<span
								className={twMerge(
									sourceCodePro.className,
									'text-3xl radial-gradient-text'
								)}
							>
								Coming Soon
							</span>
						)}
						{!vault?.comingSoon && (
							<div className="flex flex-col items-center justify-end w-full">
								<VaultStats {...DUMMY_VAULTS_STATS} />
								<div className="overflow-hidden transition-all duration-300 group-hover:mt-5 w-full group-hover:h-[32px] h-0">
									<Button className={twMerge('py-1 w-full')}>Open Vault</Button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</Link>
	);
}
