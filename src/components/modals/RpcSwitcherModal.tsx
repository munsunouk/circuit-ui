import {
	DEVNET_RPCS,
	MAINNET_RPCS,
	useAllRpcLatencies,
	useCurrentRpc,
	useCurrentRpcLatency,
} from '@drift-labs/react';
import { getResponseTime } from '@drift/common';
import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import useAppStore from '@/hooks/useAppStore';

import NOTIFICATION_UTILS from '@/utils/notifications';
import { getRpcLatencyColor } from '@/utils/utils';

import Env from '@/constants/environment';

import Button from '../elements/Button';
import Input from '../elements/Input';
import { Modal } from './Modal';

const CUSTOM_LABEL = 'Custom';

const RpcOption = ({
	onClick,
	label,
	latency,
	selected,
}: {
	onClick: () => void;
	label: string;
	latency: number;
	selected: boolean;
}) => {
	const rpcLatencyColor = getRpcLatencyColor(latency);

	return (
		<Button
			onClick={onClick}
			className={twMerge(
				'flex justify-between p-4 min-w-[360px]',
				selected &&
					'bg-container-bg-selected border-container-border-selected text-text-selected'
			)}
			secondary
		>
			<div>{label}</div>
			<div className="flex items-center justify-center gap-2">
				<span>{latency} ms</span>
				<div className={`w-2 h-2 ${rpcLatencyColor} rounded-full`} />
			</div>
		</Button>
	);
};

export default function RpcSwitcherModal() {
	const setAppStore = useAppStore((s) => s.set);
	const [currentRpc, setCurrentRpc] = useCurrentRpc();
	const allRpcLatencies = useAllRpcLatencies();
	const currentRpcLatency = useCurrentRpcLatency();

	const [selectedRpcLabel, setSelectedRpcLabel] = useState<string>('');
	const [customRpcValue, setCustomRpcValue] = useState('');

	useEffect(() => {
		currentRpc && setSelectedRpcLabel(currentRpc.label);
		currentRpc?.label === CUSTOM_LABEL && setCustomRpcValue(currentRpc.value);
	}, [currentRpc]);

	const rpcOptions =
		Env.driftEnv === 'mainnet-beta' ? MAINNET_RPCS : DEVNET_RPCS;

	const handleOnClose = () => {
		setAppStore((s) => {
			s.modals.showRpcSwitcherModal = false;
		});
	};

	const handleSave = async () => {
		if (
			!selectedRpcLabel ||
			(selectedRpcLabel === CUSTOM_LABEL && !customRpcValue)
		) {
			NOTIFICATION_UTILS.toast.error('Please select a valid RPC');
			return;
		}

		let rpcToUse = rpcOptions.find((rpc) => rpc.label === selectedRpcLabel);
		rpcToUse = rpcToUse
			? rpcToUse
			: {
					label: CUSTOM_LABEL,
					value: customRpcValue,
					allowAdditionalConnection: false,
			  };

		const responseTime = await getResponseTime(rpcToUse.value);

		if (responseTime < 1) {
			NOTIFICATION_UTILS.toast.error(
				'The RPC you have selected is currently unavailable. Please try another RPC.'
			);
			return;
		}

		setCurrentRpc(rpcToUse);
		handleOnClose();
		NOTIFICATION_UTILS.toast.success('Successfully changed RPC');
	};

	return (
		<Modal onClose={handleOnClose} header="Select RPC">
			<div className="flex flex-col gap-2">
				{rpcOptions.map((rpc) => {
					return (
						<RpcOption
							key={rpc.label}
							onClick={() => setSelectedRpcLabel(rpc.label)}
							label={rpc.label}
							latency={allRpcLatencies[rpc.label]?.avg ?? 0}
							selected={selectedRpcLabel === rpc.label}
						/>
					);
				})}
				<RpcOption
					onClick={() => setSelectedRpcLabel(CUSTOM_LABEL)}
					label="Custom RPC"
					latency={
						currentRpc.label === CUSTOM_LABEL ? currentRpcLatency?.avg : 0
					}
					selected={selectedRpcLabel === CUSTOM_LABEL}
				/>

				<Input
					className=""
					value={customRpcValue}
					onChange={(e) => setCustomRpcValue(e.target.value)}
				/>

				<Button onClick={handleSave} className="py-3">
					Save
				</Button>
			</div>
		</Modal>
	);
}
