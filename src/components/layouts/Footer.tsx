'use client';

import { useCurrentRpc, useCurrentRpcLatency } from '@drift-labs/react';

import useAppStore from '@/hooks/useAppStore';

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
		<div className="fixed bottom-0 inset-x-0 flex [&>div]:flex-1 [&>div]:text-center [&>div]:text-sm bg-black py-1 px-4">
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
				<span className="transition duration-300 cursor-pointer hover:opacity-80">
					Docs
				</span>
				<span className="h-2 border-r border-container-border-light" />
				<span className="transition duration-300 cursor-pointer hover:opacity-80">
					Terms & Conditions
				</span>
			</div>
		</div>
	);
}
