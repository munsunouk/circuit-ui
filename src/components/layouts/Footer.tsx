'use client';

import useAppStore from '@/stores/app/useAppStore';
import { useCurrentRpc, useCurrentRpcLatency } from '@drift-labs/react';
import Link from 'next/link';

import { getRpcLatencyColor } from '@/utils/utils';

export default function Footer() {
	const setAppStore = useAppStore((s) => s.set);
	const [currentRpc] = useCurrentRpc();
	const currentRpcLatency = useCurrentRpcLatency();

	const rpcLatencyColor = getRpcLatencyColor(currentRpcLatency?.avg);

	const openRpcSwitcherModal = () => {
		setAppStore((s) => {
			s.modals.showRpcSwitcherModal = true;
		});
	};

	return (
		<div className="fixed bottom-0 inset-x-0 flex [&>div]:flex-1 [&>div]:text-center [&>div]:text-sm bg-black py-1 px-4 z-50 whitespace-nowrap">
			<div className="hidden md:block">Circuit Trading</div>
			<div
				className="flex items-center gap-2 cursor-pointer md:justify-center hover:opacity-80"
				onClick={openRpcSwitcherModal}
			>
				<div className={`w-2 h-2 rounded-full ${rpcLatencyColor}`} />
				<div>
					{currentRpc.label} ({currentRpcLatency?.avg || 0} ms)
				</div>
			</div>
			<div className="flex items-center justify-end gap-2 md:justify-center">
				<Link
					className="transition cursor-pointer hover:opacity-80"
					href="https://docs.circuit.trade/"
					target="_blank"
					rel="noopener noreferrer"
				>
					Docs
				</Link>
				<span className="h-2 border-r border-container-border-light" />
				<Link
					className="transition cursor-pointer hover:opacity-80"
					href="https://medium.com/@circuittrading_"
					target="_blank"
					rel="noopener noreferrer"
				>
					Blog
				</Link>
				<span className="h-2 border-r border-container-border-light" />
				<Link
					className="transition cursor-pointer hover:opacity-80"
					href="https://docs.circuit.trade/misc/terms-and-conditions"
					target="_blank"
					rel="noopener noreferrer"
				>
					Terms & Conditions
				</Link>
			</div>
		</div>
	);
}
