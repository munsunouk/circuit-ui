'use client';

import useAppStore from '@/stores/app/useAppStore';
import { useCurrentRpc, useCurrentRpcLatency } from '@drift-labs/react';
import Link from 'next/link';

import { useIsMobileSize } from '@/hooks/useIsMobileSize';

import { getRpcLatencyColor } from '@/utils/utils';

import { Disclaimers, Medium, PriorityFee, Terms } from '../icons';

export default function Footer() {
	const setAppStore = useAppStore((s) => s.set);
	const [currentRpc] = useCurrentRpc();
	const currentRpcLatency = useCurrentRpcLatency();
	const isMobile = useIsMobileSize();

	const rpcLatencyColor = getRpcLatencyColor(currentRpcLatency?.avg);

	const openRpcSwitcherModal = () => {
		setAppStore((s) => {
			s.modals.showRpcSwitcherModal = true;
		});
	};

	return (
		<div className="fixed inset-x-0 bottom-0 z-50 flex justify-center border-t bg-container-bg-secondary border-container-border">
			<div className="flex justify-between [&>div]:text-center [&>div]:text-sm py-1 whitespace-nowrap max-w-[1440px] w-full xl:px-[135px] px-3">
				<div className="flex items-center md:gap-10 flex-[2_2_0%] md:flex-auto">
					<div
						className="flex items-center flex-1 gap-2 cursor-pointer md:justify-center hover:opacity-80 md:flex-none"
						onClick={openRpcSwitcherModal}
					>
						<div className={`w-2 h-2 rounded-full ${rpcLatencyColor}`} />
						<div>
							{currentRpc.label} ({currentRpcLatency?.avg || 0} ms)
						</div>
					</div>

					<div className="flex items-center justify-center flex-1 md:flex-none">
						{isMobile ? (
							<PriorityFee fontSize={16} className="mr-1" />
						) : (
							'Priority Fees:'
						)}{' '}
						Dynamic
					</div>
				</div>
				<div className="flex items-center justify-end flex-1 gap-4 md:gap-2 md:flex-none">
					<Link
						className="transition cursor-pointer hover:opacity-80"
						href="https://docs.circuit.trade/"
						target="_blank"
						rel="noopener noreferrer"
					>
						{isMobile ? <Disclaimers fontSize={16} /> : 'Docs'}
					</Link>
					<span className="hidden h-2 border-r md:block border-container-border-light" />
					<Link
						className="transition cursor-pointer hover:opacity-80"
						href="https://medium.com/@circuittrading_"
						target="_blank"
						rel="noopener noreferrer"
					>
						{isMobile ? <Medium fontSize={16} /> : 'Blog'}
					</Link>
					<span className="hidden h-2 border-r md:block border-container-border-light" />
					<Link
						className="transition cursor-pointer hover:opacity-80"
						href="https://docs.circuit.trade/misc/terms-and-conditions"
						target="_blank"
						rel="noopener noreferrer"
					>
						{isMobile ? <Terms fontSize={16} /> : 'Terms & Conditions'}
					</Link>
				</div>
			</div>
		</div>
	);
}
