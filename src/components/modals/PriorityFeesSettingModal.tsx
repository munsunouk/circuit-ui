import useAppStore from '@/stores/app/useAppStore';
import {
	FeeType,
	useImmediateInterval,
	useOraclePriceStore,
	usePriorityFeeStore,
	usePriorityFeeUserSettings,
} from '@drift-labs/react';
import { MarketId } from '@drift/common';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { handleOnValueChangeCurried } from '@/utils/utils';

import Env, {
	CIRCUIT_TXN_COMPUTE_UNITS_LIMIT_ESTIMATE,
	SOL_MARKET,
} from '@/constants/environment';

import Button from '../elements/Button';
import { CollateralInput } from '../elements/Input';
import { Modal } from './Modal';

const PRIORITY_FEES_OPTIONS: {
	label: string;
	subValue: string | undefined;
	value: FeeType;
}[] = [
	{
		label: 'Dynamic',
		subValue: undefined,
		value: 'dynamic',
	},
	{
		label: 'Boosted',
		subValue: '5x',
		value: 'boosted',
	},
	{
		label: 'Boosted',
		subValue: '10x',
		value: 'turbo',
	},
	{
		label: 'Custom',
		subValue: undefined,
		value: 'custom',
	},
];

const PriorityFeeOption = ({
	selected,
	onClick,
	label,
	subValue,
}: {
	selected: boolean;
	label: string;
	subValue?: React.ReactNode;
	onClick: () => void;
}) => {
	return (
		<div
			className={twMerge(
				'bg-container-bg-secondary flex flex-col gap-1 grow p-2 cursor-pointer border border-transparent h-[70px]',
				selected && 'border-container-border-selected'
			)}
			onClick={onClick}
		>
			<span>{label}</span>
			{subValue && <span className="text-text-tertiary">{subValue}</span>}
		</div>
	);
};

const SOL_MARKET_ID = MarketId.createSpotMarket(SOL_MARKET.marketIndex);

export default function PriorityFeesSettingModal() {
	const setAppStore = useAppStore((s) => s.set);
	const getPriorityFeeToUse = usePriorityFeeStore((s) => s.getPriorityFeeToUse);
	const { priorityFeeSettings, setPriorityFeeSettings } =
		usePriorityFeeUserSettings();
	const getMarketPriceData = useOraclePriceStore((s) => s.getMarketPriceData);

	const [selectedPriorityFeeOption, setSelectedPriorityFeeOption] = useState(
		priorityFeeSettings.userPriorityFeeType
	);
	const [baselineDynamicFee, setBaselineDynamicFee] = useState('');
	const [estimatedDynamicFee, setEstimatedDynamicFee] = useState('');
	const [maxFeeCap, setMaxFeeCap] = useState(
		priorityFeeSettings.userCustomMaxPriorityFeeCap.toString()
	);
	const [customPriorityFee, setCustomPriorityFee] = useState(
		priorityFeeSettings.userCustomPriorityFee?.toString() ?? ''
	);

	const isSaveButtonDisabled =
		selectedPriorityFeeOption === priorityFeeSettings.userPriorityFeeType &&
		maxFeeCap === priorityFeeSettings.userCustomMaxPriorityFeeCap.toString() &&
		customPriorityFee ===
			(priorityFeeSettings.userCustomPriorityFee?.toString() ?? '');

	useImmediateInterval(() => {
		setBaselineDynamicFee(
			getPriorityFeeToUse(
				CIRCUIT_TXN_COMPUTE_UNITS_LIMIT_ESTIMATE,
				'dynamic'
			).priorityFeeInSol.toString()
		);
		setEstimatedDynamicFee(
			getPriorityFeeToUse(
				CIRCUIT_TXN_COMPUTE_UNITS_LIMIT_ESTIMATE,
				selectedPriorityFeeOption
			).priorityFeeInSol.toString()
		);
	}, 1000);

	const onClose = () => {
		setAppStore((s) => {
			s.modals.showPriorityFeesSettingModal = false;
		});
	};

	const onSave = () => {
		setPriorityFeeSettings({
			userPriorityFeeType: selectedPriorityFeeOption,
			userCustomMaxPriorityFeeCap: +maxFeeCap,
			userCustomPriorityFee:
				selectedPriorityFeeOption === 'custom' ? +customPriorityFee : null,
		});

		onClose();
	};

	const handleMaxFeeCap = handleOnValueChangeCurried(setMaxFeeCap, SOL_MARKET);

	const handleCustomPriorityFee = (newValue: string) => {
		const numericNewValue = +newValue;

		if (isNaN(numericNewValue)) return;

		if (numericNewValue > Env.priorityFee.maxFeeInSol) return;

		handleOnValueChangeCurried(setCustomPriorityFee, SOL_MARKET)(newValue);
	};

	function getSolPrice() {
		const solPrice = getMarketPriceData(SOL_MARKET_ID)?.priceData.price ?? 0;
		return solPrice;
	}

	function getUsdPrice(solValue: number) {
		const solPrice = getSolPrice();
		const usdPrice = solPrice * solValue;

		if (usdPrice < 0.01) return '<$0.01';

		return `~$${usdPrice.toFixed(2)}`;
	}

	return (
		<Modal onClose={onClose} header="Priority Fees">
			<div className="flex flex-col max-w-full md:max-w-[480px] gap-4">
				<span className="text-text-tertiary">
					An extra fee added to your transactions to encourage Solana validators
					to process your transactions faster. Set a cap to prevent overpaying.
				</span>

				<div className="flex items-center gap-2">
					{PRIORITY_FEES_OPTIONS.map((option) => (
						<PriorityFeeOption
							key={option.value}
							selected={selectedPriorityFeeOption === option.value}
							label={option.label}
							subValue={
								option.value === 'dynamic' ? (
									<span>{baselineDynamicFee}</span>
								) : (
									option.subValue
								)
							}
							onClick={() => setSelectedPriorityFeeOption(option.value)}
						/>
					))}
				</div>

				<span className="text-text-tertiary">
					Automatically adjusts, targeting the 75th percentile of fees in the
					last 10 blocks.
				</span>

				{selectedPriorityFeeOption !== 'custom' && (
					<div className="flex items-center gap-4">
						<div className="flex flex-col flex-1">
							<div className="flex justify-between w-full">
								<span>Est. Fee</span>
								<span>{getUsdPrice(+estimatedDynamicFee)}</span>
							</div>
							<CollateralInput
								amount={estimatedDynamicFee}
								setAmount={() => {}}
								marketSymbol={SOL_MARKET.symbol}
							/>
						</div>
						<div className="flex flex-col flex-1">
							<div className="flex justify-between w-full">
								<span>Max Fee Cap</span>
								<span>{getUsdPrice(+maxFeeCap)}</span>
							</div>
							<CollateralInput
								amount={maxFeeCap}
								setAmount={handleMaxFeeCap}
								marketSymbol={SOL_MARKET.symbol}
							/>
						</div>
					</div>
				)}

				{selectedPriorityFeeOption === 'custom' && (
					<div className="flex flex-col flex-1">
						<div className="flex justify-between w-full">
							<span>Custom Fee</span>
							<span>{getUsdPrice(+customPriorityFee)}</span>
						</div>
						<CollateralInput
							amount={customPriorityFee}
							setAmount={handleCustomPriorityFee}
							marketSymbol={SOL_MARKET.symbol}
						/>
						<div>Max fee is {Env.priorityFee.maxFeeInSol} SOL.</div>
					</div>
				)}

				<div className="flex items-center justify-end gap-4">
					<Button secondary onClick={onClose}>
						Cancel
					</Button>
					<Button
						disabled={isSaveButtonDisabled}
						className="w-auto px-6 py-[10px]"
						onClick={onSave}
					>
						Save
					</Button>
				</div>
			</div>
		</Modal>
	);
}
