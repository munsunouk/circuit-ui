'use client';

import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { sourceCodePro, syne } from '@/constants/fonts';
import { UiVaultConfig } from '@/constants/vaults';

import Badge from '../elements/Badge';
import Button from '../elements/Button';
import { Lock } from '../icons';
import Particles from './Particles';

function VaultStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex text-center flex-col">
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
		<div className="w-full flex flex-col gap-4">
			<div className="flex w-full justify-between">
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
						'h-full blue-white-gradient-background transition-[width] duration-1000',
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

	const handleMouseEnter = () => {
		setIsHover(true);
	};

	const handleMouseLeave = () => {
		setIsHover(false);
	};

	return (
		<div
			className="relative flex-1 w-full flex flex-col border border-container-border cursor-pointer group"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/** Background image (separated to allow isolation of the brightness feature) */}
			<div
				className="absolute inset-0 group-hover:brightness-150 transition-all duration-300 z-10"
				style={{
					backgroundImage: `url(${vault.previewBackdropUrl})`,
					backgroundSize: 'cover',
				}}
			/>

			{/** Particles on hover */}
			<div className="absolute flex justify-center z-50 w-full">
				<div className="w-[80%]">
					{isHover && <Particles color={vault.backdropParticlesColor} />}
				</div>
			</div>

			{/** Radial background on hover */}
			<div className="absolute inset-x-0 top-0 bottom-40 blue-radial-gradient-background group-hover:brightness-200 brightness-0 transition-all duration-300" />

			<div className="relative isolate flex flex-col mt-[25%] grow z-20">
				{/** Background blur + grayscale (separated to allow isolation of inner content from grayscale ) */}
				<div className="absolute inset-0 grayscale backdrop-blur" />
				<div className="flex flex-col items-center text-center md:px-16 md:py-10 px-4 py-3 gap-6 isolate grow">
					<div className="flex flex-col items-center gap-2">
						<span className={twMerge(syne.className, 'text-4xl font-bold')}>
							{vault.name}
						</span>
						<div className="flex gap-2 items-center">
							{vault.permissioned && (
								<Badge>
									<div className="flex gap-1 items-center justify-center whitespace-nowrap">
										<Lock />
										<span>Whitelist Only</span>
									</div>
								</Badge>
							)}
							<span>{vault.description}</span>
						</div>
					</div>
					<div className="pb-8 w-full grow flex flex-col items-center justify-end">
						{vault?.comingSoon && (
							<span className={twMerge(sourceCodePro.className, 'text-3xl')}>
								Coming Soon
							</span>
						)}
						{!vault?.comingSoon && (
							<div className="flex flex-col w-full items-center h-[136px] justify-end">
								<VaultStats {...DUMMY_VAULTS_STATS} />
								<div className="overflow-hidden transition-all duration-300 group-hover:mt-5 w-full group-hover:h-[32px] h-0">
									<Button className={twMerge('py-1 w-full')}>Open Vault</Button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
