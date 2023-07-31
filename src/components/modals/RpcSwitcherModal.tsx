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

import FadeInDiv from '../elements/FadeInDiv';
import Input from '../elements/Input';
import { Checkmark } from '../icons';
import { Modal } from './Modal';

const CUSTOM_LABEL = 'Custom';

const RpcOption = ({
	onClick,
	label,
	latency,
	selected,
	index,
}: {
	onClick: () => void;
	label: string;
	latency: number;
	selected: boolean;
	index: number;
}) => {
	const rpcLatencyColor = getRpcLatencyColor(latency);

	return (
		<FadeInDiv
			onClick={onClick}
			className="flex items-center gap-3 cursor-pointer hover:opacity-80"
			delay={(index + 1) * 100}
		>
			<div className="flex items-center justify-center w-4 h-4">
				{selected && <Checkmark className="w-4 h-4" />}
			</div>
			<div className="grow">{label}</div>
			<div className="flex items-center gap-2 min-w-[80px]">
				<div className={`w-2 h-2 ${rpcLatencyColor} rounded-full`} />
				<span>{latency} ms</span>
			</div>
		</FadeInDiv>
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
		handleSave();
	};

	const handleSave = async () => {
		if (selectedRpcLabel === currentRpc.label) return;

		const handleInvalidRpc = () => {
			NOTIFICATION_UTILS.toast.error('Please select a valid RPC');
			setAppStore((s) => {
				s.modals.showRpcSwitcherModal = true;
			});
		};

		if (
			!selectedRpcLabel ||
			(selectedRpcLabel === CUSTOM_LABEL && !customRpcValue)
		) {
			handleInvalidRpc();
			return;
		}

		const rpcToUse =
			selectedRpcLabel === CUSTOM_LABEL
				? {
						label: CUSTOM_LABEL,
						value: customRpcValue,
						allowAdditionalConnection: false,
				  }
				: rpcOptions.find((rpc) => rpc.label === selectedRpcLabel);

		if (!rpcToUse) {
			handleInvalidRpc();
			return;
		}

		const responseTime = await getResponseTime(rpcToUse.value);

		if (responseTime < 1) {
			NOTIFICATION_UTILS.toast.error(
				'The RPC you have selected is currently unavailable. Please try another RPC.'
			);
			return;
		}

		setCurrentRpc(rpcToUse);
		NOTIFICATION_UTILS.toast.success('Successfully changed RPC');
	};

	return (
		<Modal onClose={handleOnClose} header="Switch RPCs">
			<div className="flex flex-col gap-3 min-w-[300px]">
				{rpcOptions.map((rpc, index) => {
					return (
						<RpcOption
							key={rpc.label}
							onClick={() => setSelectedRpcLabel(rpc.label)}
							label={rpc.label}
							latency={allRpcLatencies[rpc.value]?.avg ?? 0}
							selected={selectedRpcLabel === rpc.label}
							index={index}
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
					index={rpcOptions.length}
				/>

				<FadeInDiv
					className={twMerge(
						'flex transition-[all] duration-300 overflow-hidden',
						selectedRpcLabel === CUSTOM_LABEL
							? 'h-[44px] mt-0 pb-1'
							: 'h-0 -mt-2 delay-300'
					)}
					delay={(rpcOptions.length + 2) * 100}
				>
					<div className="h-1 w-7" />
					<Input
						className={twMerge(
							'h-10 text-sm transition-opacity duration-300 px-3',
							selectedRpcLabel === CUSTOM_LABEL ? 'opacity-100' : 'opacity-0'
						)}
						placeholder="Enter RPC URL"
						value={customRpcValue}
						onChange={(e) => setCustomRpcValue(e.target.value)}
					/>
				</FadeInDiv>
			</div>
		</Modal>
	);
}
