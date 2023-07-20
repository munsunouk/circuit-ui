import { BN } from '@drift-labs/sdk';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import ConnectButton from '@/components/ConnectButton';

import { useAppActions } from '@/hooks/useAppActions';
import useAppStore from '@/hooks/useAppStore';
import usePathToVaultPubKey from '@/hooks/usePathToVaultName';

import { USDC_MARKET } from '@/constants/environment';

import Button from '../elements/Button';
import ButtonTabs from '../elements/ButtonTabs';

const PERCENTAGE_SELECTOR_OPTIONS = [
	{ label: '25%', value: 0.25 },
	{ label: '50%', value: 0.5 },
	{ label: '75%', value: 0.75 },
	{ label: 'Max', value: 1 },
];

enum WithdrawalState {
	UnRequested, // no withdrawal request has been made
	Requested, // a withdrawal request has been made but not yet available
	AvailableForWithdrawal, // a withdrawal request has been made and is available
}

const getWithdrawalDetails = (state: WithdrawalState) => {
	switch (state) {
		case WithdrawalState.UnRequested:
		case WithdrawalState.AvailableForWithdrawal:
			return 'Withdrawals can be requested at any time and will be available at the end of each quarter.';
		case WithdrawalState.Requested:
			return 'Only one withdrawal request can be made at a time.';
		default:
			return '';
	}
};

const getWithdrawButtonLabel = (state: WithdrawalState) => {
	switch (state) {
		case WithdrawalState.UnRequested:
			return 'Request Withdrawal';
		case WithdrawalState.Requested:
			return 'Cancel Request';
		case WithdrawalState.AvailableForWithdrawal:
			return 'Withdraw Funds';
		default:
			return '';
	}
};

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
	const [isFocused, setIsFocused] = useState(false);

	const handleFocus = () => {
		setIsFocused(true);
	};

	const handleBlur = () => {
		setIsFocused(false);
	};

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
			<div
				className={twMerge(
					'flex items-center border border-container-border-light',
					isFocused && 'border-container-border-selected'
				)}
			>
				<input
					type="number"
					className="w-full h-12 px-4 text-lg font-semibold bg-black focus:outline-none focus:border-container-border-selected text-text-emphasis"
					value={amount}
					onChange={(e) => setAmount(Number(e.target.value))}
					onFocus={handleFocus}
					onBlur={handleBlur}
				/>
				<div
					className={twMerge(
						'flex items-center justify-center flex-1 h-12 font-medium border-l border-container-border-light px-7',
						isFocused && 'border-container-border-selected'
					)}
				>
					USDC
				</div>
			</div>

			<ButtonTabs
				tabs={PERCENTAGE_SELECTOR_OPTIONS.map((option) => ({
					label: option.label,
					onSelect: () => setAmount(maxAmount * option.value),
					selected: amount === maxAmount * option.value,
				}))}
			/>
		</div>
	);
};

const DepositWithdrawForm = () => {
	const { connected } = useWallet();
	const vaultClient = useAppStore((s) => s.vaultClient);
	const maxAmount = useAppStore((s) => s.balances.usdc);
	const appActions = useAppActions();
	const vaultPubkey = usePathToVaultPubKey();

	const [selectedTab, setSelectedTab] = useState<Tab>(Tab.Deposit);
	const [amount, setAmount] = useState<number>(0);
	const [withdrawalState, setWithdrawalState] = useState<WithdrawalState>(
		WithdrawalState.AvailableForWithdrawal
	);
	const [amountRequested, setAmountRequested] = useState<number>(1_000_000.98);

	const isWithdrawTab = selectedTab === Tab.Withdraw;
	const isDepositTab = selectedTab === Tab.Deposit;
	const isButtonDisabled =
		(isDepositTab && amount === 0) ||
		(isWithdrawTab &&
			amount === 0 &&
			withdrawalState !== WithdrawalState.Requested);

	const handleOnValueChange = (newAmount: number) => {
		const formattedAmount = Number(
			newAmount.toFixed(USDC_MARKET.precisionExp.toNumber())
		);
		setAmount(formattedAmount);
	};

	const handleOnClick = () => {
		if (!vaultPubkey) return;

		const baseAmount = new BN(amount * USDC_MARKET.precision.toNumber());
		if (isDepositTab) {
			appActions.depositVault(vaultPubkey, baseAmount);
		}
	};

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
			<div
				className={twMerge(
					'flex flex-col gap-9 mt-9 mb-7 px-7',
					isDepositTab && 'justify-between h-[400px]'
				)}
			>
				{isWithdrawTab && (
					<span className="text-text-emphasis">
						{getWithdrawalDetails(withdrawalState)}
					</span>
				)}

				<Form
					tab={selectedTab}
					maxAmount={maxAmount}
					setAmount={handleOnValueChange}
					amount={amount}
				/>

				{connected ? (
					<div className="flex flex-col items-center gap-4">
						<div className="flex flex-col w-full">
							{isWithdrawTab &&
								(withdrawalState === WithdrawalState.Requested ||
									withdrawalState ===
										WithdrawalState.AvailableForWithdrawal) && (
									<span
										className={twMerge(
											'w-full text-center py-2 text-text-emphasis',
											withdrawalState === WithdrawalState.Requested &&
												'bg-button-bg-disabled',
											withdrawalState ===
												WithdrawalState.AvailableForWithdrawal &&
												'bg-success-green-bg font-semibold'
										)}
									>
										{amountRequested.toFixed(2)}{' '}
										{withdrawalState === WithdrawalState.Requested
											? 'withdrawal requested'
											: 'available for withdrawal'}
									</span>
								)}
							<Button
								className="text-xl"
								disabled={isButtonDisabled}
								onClick={handleOnClick}
							>
								{selectedTab === Tab.Deposit
									? 'Deposit'
									: getWithdrawButtonLabel(withdrawalState)}
							</Button>
						</div>
						{isWithdrawTab &&
							(withdrawalState === WithdrawalState.UnRequested ||
								withdrawalState === WithdrawalState.Requested) && (
								<span>Next withdrawal period: July 23-30, 2023</span>
							)}
					</div>
				) : (
					<ConnectButton />
				)}
			</div>
		</div>
	);
};

export default DepositWithdrawForm;
