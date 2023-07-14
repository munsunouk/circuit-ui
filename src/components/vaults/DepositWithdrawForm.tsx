import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import ConnectButton from '@/components/ConnectButton';

enum Tab {
	Deposit,
	Withdraw,
}

const FormTab = ({
	selected,
	label,
	onSelect,
}: {
	selected: boolean;
	label: string;
	onSelect: () => void;
}) => {
	return (
		<span
			className={twMerge(
				'flex items-center justify-center flex-1 px-5 py-3 leading-relaxed cursor-pointer border-b border-container-border hover:opacity-80 transition duration-300',
				selected &&
					'bg-container-bg-selected text-text-selected border-container-border-selected'
			)}
			onClick={onSelect}
		>
			{label}
		</span>
	);
};

const PercentageSelector = ({
	setAmount,
	label,
}: {
	label: string;
	setAmount: () => void;
}) => {
	return (
		<span
			onClick={setAmount}
			className="flex items-center justify-center flex-1 py-3 transition duration-300 cursor-pointer hover:opacity-80"
		>
			{label}
		</span>
	);
};

const Form = ({
	tab,
	amount,
	maxAmount,
	setAmount,
}: {
	tab: Tab;
	amount: number;
	maxAmount: number;
	setAmount: (amount: number) => void;
}) => {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex justify-between">
				<span className="text-lg text-text-emphasis">
					{tab === Tab.Deposit ? 'Deposit' : 'Withdraw'} Amount
				</span>
				<span>
					Max:{' '}
					<span
						className="underline cursor-pointer"
						onClick={() => setAmount(maxAmount)}
					>
						{maxAmount.toFixed(2)} USDC
					</span>
				</span>
			</div>
			<div className="flex items-center border border-container-border-light">
				<input
					type="number"
					className="w-full h-12 px-4 text-lg font-semibold bg-black focus:outline-none focus:border-container-border-selected text-text-emphasis"
					value={amount}
					onChange={(e) => setAmount(Number(e.target.value))}
				/>
				<span className="flex items-center justify-center h-full font-medium border-l border-container-border-light px-7">
					USDC
				</span>
			</div>
			<div className="flex items-center border divide-x border-container-border-light divide-container-border-light">
				<PercentageSelector
					setAmount={() => setAmount(maxAmount * 0.25)}
					label="25%"
				/>
				<PercentageSelector
					setAmount={() => setAmount(maxAmount * 0.5)}
					label="50%"
				/>
				<PercentageSelector
					setAmount={() => setAmount(maxAmount * 0.75)}
					label="75%"
				/>
				<PercentageSelector
					setAmount={() => setAmount(maxAmount)}
					label="Max"
				/>
			</div>
		</div>
	);
};

const DepositWithdrawForm = () => {
	const [selectedTab, setSelectedTab] = useState<Tab>(Tab.Deposit);
	const [maxAmount, setMaxAmount] = useState<number>(1);
	const [amount, setAmount] = useState<number>(0);

	return (
		<div className="w-full bg-black border border-container-border">
			<div className="flex">
				<FormTab
					selected={selectedTab === Tab.Deposit}
					label="Deposit"
					onSelect={() => setSelectedTab(Tab.Deposit)}
				/>
				<FormTab
					selected={selectedTab === Tab.Withdraw}
					label="Withdraw"
					onSelect={() => setSelectedTab(Tab.Withdraw)}
				/>
			</div>
			<div className="flex flex-col h-[400px] mt-9 mb-7 px-7 justify-between">
				<Form
					tab={selectedTab}
					maxAmount={maxAmount}
					setAmount={setAmount}
					amount={amount}
				/>

				<ConnectButton />
			</div>
		</div>
	);
};

export default DepositWithdrawForm;
