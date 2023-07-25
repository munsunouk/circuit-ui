import { BN } from '@drift-labs/sdk';
import { useWallet } from '@solana/wallet-adapter-react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import ConnectButton from '@/components/ConnectButton';

import { useAppActions } from '@/hooks/useAppActions';
import useAppStore from '@/hooks/useAppStore';
import useCurrentVault from '@/hooks/useCurrentVault';
import usePathToVaultPubKey from '@/hooks/usePathToVaultName';

import { redeemPeriodToString } from '@/utils/utils';

import { USDC_MARKET } from '@/constants/environment';

import Button from '../elements/Button';
import ButtonTabs from '../elements/ButtonTabs';
import GradientBorderBox from '../elements/GradientBorderBox';
import Input from '../elements/Input';

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
	maxAmountString,
	setAmount,
}: {
	tab: Tab;
	amount: number;
	maxAmount: number;
	maxAmountString: string;
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
			<div className="flex items-center justify-between">
				<span className="text-lg text-text-emphasis">
					{tab === Tab.Deposit ? 'Deposit' : 'Withdraw'} Amount
				</span>
				<span>
					Max:{' '}
					<span
						className="underline cursor-pointer"
						onClick={() => setAmount(maxAmount)}
					>
						{maxAmountString}
					</span>
				</span>
			</div>
			<div
				className={twMerge(
					'flex items-center border border-container-border-light',
					isFocused && 'border-container-border-selected'
				)}
			>
				<Input
					type="number"
					className="border-0"
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
					selected:
						amount.toFixed(USDC_MARKET.precisionExp) ===
							(maxAmount * option.value).toFixed(USDC_MARKET.precisionExp) &&
						amount !== 0,
				}))}
			/>
		</div>
	);
};

const DepositForm = () => {
	const { connected } = useWallet();
	const maxAmount = useAppStore((s) => s.balances.usdc);
	const appActions = useAppActions();
	const vaultPubkey = usePathToVaultPubKey();

	const [amount, setAmount] = useState<number>(0);

	const isButtonDisabled = amount === 0;

	const handleOnValueChange = (newAmount: number) => {
		const formattedAmount = Number(
			newAmount.toFixed(USDC_MARKET.precisionExp.toNumber())
		);
		setAmount(formattedAmount);
	};

	const handleDeposit = async () => {
		if (!vaultPubkey) return;

		const baseAmount = new BN(amount * USDC_MARKET.precision.toNumber());
		await appActions.depositVault(vaultPubkey, baseAmount);

		resetForm();
	};

	const resetForm = () => {
		setAmount(0);
	};

	return (
		<div className="flex flex-col justify-between h-full gap-9">
			<Form
				tab={Tab.Deposit}
				maxAmount={maxAmount}
				maxAmountString={`${maxAmount.toFixed(2)} USDC`}
				setAmount={handleOnValueChange}
				amount={amount}
			/>

			{connected ? (
				<Button
					className="text-xl"
					disabled={isButtonDisabled}
					onClick={handleDeposit}
				>
					Deposit
				</Button>
			) : (
				<ConnectButton />
			)}
		</div>
	);
};

const WithdrawForm = () => {
	const { connected } = useWallet();
	const vaultPubkey = usePathToVaultPubKey();
	const vault = useCurrentVault();
	const appActions = useAppActions();

	const [amount, setAmount] = useState<number>(0);
	const [maxAmount, setMaxAmount] = useState<number>(0);
	const [withdrawalState, setWithdrawalState] = useState<WithdrawalState>(
		WithdrawalState.Requested
	);

	const withdrawalWaitingPeriod = redeemPeriodToString(
		vault?.info?.redeemPeriod.toNumber()
	);
	const withdrawalAvailableTs =
		vault?.vaultDepositor?.lastWithdrawRequestTs.toNumber() +
		vault?.info?.redeemPeriod.toNumber();

	const userShares = vault?.vaultDepositor?.vaultShares ?? new BN(0);
	const lastRequestedAmount =
		vault?.vaultDepositor?.lastWithdrawRequestShares ?? new BN(0);

	const isButtonDisabled =
		amount === 0 && withdrawalState !== WithdrawalState.Requested;

	useEffect(() => {
		const hasRequestedWithdrawal = lastRequestedAmount.toNumber() > 0;
		const isBeforeWithdrawalAvailableDate = dayjs().isBefore(
			dayjs.unix(withdrawalAvailableTs)
		);

		if (hasRequestedWithdrawal) {
			if (isBeforeWithdrawalAvailableDate) {
				setWithdrawalState(WithdrawalState.Requested);
			} else {
				setWithdrawalState(WithdrawalState.AvailableForWithdrawal);
			}
		} else {
			setWithdrawalState(WithdrawalState.UnRequested);
		}
	}, [withdrawalAvailableTs, lastRequestedAmount.toNumber()]);

	useEffect(() => {
		if (withdrawalState === WithdrawalState.AvailableForWithdrawal) {
			setMaxAmount(lastRequestedAmount.toNumber());
		} else {
			setMaxAmount(userShares.toNumber());
		}
	}, [withdrawalState, lastRequestedAmount.toNumber(), userShares.toNumber()]);

	const handleOnValueChange = (newAmount: number) => {
		const formattedAmount = Number(
			newAmount.toFixed(USDC_MARKET.precisionExp.toNumber())
		);
		setAmount(formattedAmount);
	};

	const handleOnClick = () => {
		if (!vaultPubkey) return;

		if (withdrawalState === WithdrawalState.UnRequested) {
			appActions.requestVaultWithdrawal(vaultPubkey, new BN(amount));
		} else if (withdrawalState === WithdrawalState.Requested) {
			appActions.cancelRequestWithdraw(vaultPubkey);
		} else {
			appActions.executeVaultWithdrawal(vaultPubkey);
		}
	};

	return (
		<div className="flex flex-col justify-between h-full gap-9">
			<span className="text-text-emphasis">
				{getWithdrawalDetails(withdrawalState)}
			</span>

			<Form
				tab={Tab.Withdraw}
				maxAmount={maxAmount}
				maxAmountString={`${maxAmount} shares`}
				setAmount={handleOnValueChange}
				amount={amount}
			/>

			{connected ? (
				<div className="flex flex-col items-center gap-4">
					<div className="flex flex-col w-full">
						{(withdrawalState === WithdrawalState.Requested ||
							withdrawalState === WithdrawalState.AvailableForWithdrawal) && (
							<span
								className={twMerge(
									'w-full text-center py-2 text-text-emphasis',
									withdrawalState === WithdrawalState.Requested &&
										'bg-button-bg-disabled',
									withdrawalState === WithdrawalState.AvailableForWithdrawal &&
										'bg-success-green-bg font-semibold'
								)}
							>
								{lastRequestedAmount.toNumber()}{' '}
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
							{getWithdrawButtonLabel(withdrawalState)}
						</Button>
					</div>
					{withdrawalState === WithdrawalState.UnRequested && (
						<span>Withdrawal waiting period: {withdrawalWaitingPeriod}</span>
					)}
					{withdrawalState === WithdrawalState.Requested && (
						<span className="text-center">
							Withdrawal available on:{' '}
							{dayjs(withdrawalAvailableTs * 1000).format(
								'ddd, DD MMM YYYY HH:mm (Z)'
							)}
						</span>
					)}
				</div>
			) : (
				<ConnectButton />
			)}
		</div>
	);
};

const DepositWithdrawForm = () => {
	const [selectedTab, setSelectedTab] = useState<Tab>(Tab.Deposit);

	return (
		<GradientBorderBox className="w-full bg-black">
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
			<div className={twMerge('mt-9 mb-7 px-7 min-h-[400px] h-1')}>
				{selectedTab === Tab.Deposit ? <DepositForm /> : <WithdrawForm />}
			</div>
		</GradientBorderBox>
	);
};

export default DepositWithdrawForm;
