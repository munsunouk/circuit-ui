import { BN, BigNum } from '@drift-labs/sdk';
import { VAULT_SHARES_PRECISION } from '@drift-labs/vaults-sdk';
import { useWallet } from '@solana/wallet-adapter-react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import ConnectButton from '@/components/ConnectButton';

import { useAppActions } from '@/hooks/useAppActions';
import useAppStore from '@/hooks/useAppStore';
import useCurrentVaultAccount from '@/hooks/useCurrentVaultAccount';
import useCurrentVaultDepositor from '@/hooks/useCurrentVaultDepositor';
import useCurrentVaultStats from '@/hooks/useCurrentVaultStats';
import usePathToVaultPubKey from '@/hooks/usePathToVaultName';

import { redeemPeriodToString } from '@/utils/utils';

import { USDC_MARKET } from '@/constants/environment';

import Button from '../elements/Button';
import ButtonTabs from '../elements/ButtonTabs';
import FadeInDiv from '../elements/FadeInDiv';
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
				'flex items-center justify-center flex-1 px-5 py-3 leading-relaxed cursor-pointer border-b border-container-border hover:bg-main-blue hover:text-black transition duration-300',
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
	amount: string;
	maxAmount: number;
	maxAmountString: string;
	setAmount: (amount: string) => void;
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
						onClick={() => setAmount(maxAmount.toString())}
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
					// type="number"
					className="border-0"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
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
					onSelect: () => setAmount((maxAmount * option.value).toString()),
					selected:
						Number(amount).toFixed(USDC_MARKET.precisionExp) ===
							(maxAmount * option.value).toFixed(USDC_MARKET.precisionExp) &&
						Number(amount) !== 0,
				}))}
			/>
		</div>
	);
};

const DepositForm = () => {
	const { connected } = useWallet();
	const usdcBalance = useAppStore((s) => s.balances.usdc);
	const appActions = useAppActions();
	const vaultPubkey = usePathToVaultPubKey();
	const vaultAccount = useCurrentVaultAccount();
	const vaultStats = useCurrentVaultStats();

	const [amount, setAmount] = useState('');
	const [loading, setLoading] = useState(false);

	const isButtonDisabled = +amount === 0;

	// Max amount that can be deposited
	const maxCapacity = vaultAccount?.maxTokens;
	const tvl = vaultStats.netUsdValue;
	const maxAvailableCapacity = BigNum.from(
		maxCapacity?.sub(tvl),
		USDC_MARKET.precisionExp
	);
	const usdcBalanceBigNum = BigNum.fromPrint(
		usdcBalance.toString(),
		VAULT_SHARES_PRECISION
	);
	let maxDepositAmount = maxAvailableCapacity.gt(usdcBalanceBigNum)
		? usdcBalanceBigNum.toNum()
		: maxAvailableCapacity.scale(99, 100).toNum();
	maxDepositAmount = Math.max(0, maxDepositAmount);

	const handleOnValueChange = (newAmount: string) => {
		if (isNaN(+newAmount)) return;

		if (+newAmount === 0) {
			setAmount(newAmount);
			return;
		}

		// if last char of string is a decimal point, don't format
		if (newAmount[newAmount.length - 1] === '.') {
			setAmount(newAmount);
			return;
		}

		const formattedAmount = Number(
			(+newAmount).toFixed(USDC_MARKET.precisionExp.toNumber())
		);
		setAmount(formattedAmount.toString());
	};

	const handleDeposit = async () => {
		if (!vaultPubkey) return;

		const baseAmount = new BN(+amount * USDC_MARKET.precision.toNumber());

		setLoading(true);
		try {
			await appActions.depositVault(vaultPubkey, baseAmount);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}

		resetForm();
	};

	const resetForm = () => {
		setAmount('');
	};

	return (
		<FadeInDiv className="flex flex-col justify-between h-[400px] gap-9">
			<Form
				tab={Tab.Deposit}
				maxAmount={maxDepositAmount}
				maxAmountString={`${maxDepositAmount.toFixed(2)} USDC`}
				setAmount={handleOnValueChange}
				amount={amount}
			/>

			{connected ? (
				<Button
					className="text-xl"
					disabled={isButtonDisabled}
					onClick={handleDeposit}
					loading={loading}
				>
					Deposit
				</Button>
			) : (
				<ConnectButton />
			)}
		</FadeInDiv>
	);
};

const WithdrawForm = () => {
	const { connected } = useWallet();
	const vaultPubkey = usePathToVaultPubKey();
	const vaultDepositor = useCurrentVaultDepositor();
	const vaultAccount = useCurrentVaultAccount();
	const appActions = useAppActions();

	const [amount, setAmount] = useState('');
	const [maxAmount, setMaxAmount] = useState<number>(0);
	const [loading, setLoading] = useState(false);
	const [withdrawalState, setWithdrawalState] = useState<WithdrawalState>(
		WithdrawalState.Requested
	);

	const withdrawalWaitingPeriod = redeemPeriodToString(
		vaultAccount?.redeemPeriod.toNumber()
	);
	const withdrawalAvailableTs =
		vaultDepositor?.lastWithdrawRequestTs.toNumber() +
		vaultAccount?.redeemPeriod.toNumber();

	const userShares = vaultDepositor?.vaultShares ?? new BN(0);
	const lastRequestedAmount =
		vaultDepositor?.lastWithdrawRequestShares ?? new BN(0);

	const isButtonDisabled =
		+amount === 0 && withdrawalState !== WithdrawalState.Requested;

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

	const handleOnValueChange = (newAmount: string) => {
		if (isNaN(+newAmount)) return;

		if (+newAmount === 0) {
			setAmount(newAmount);
			return;
		}

		const formattedAmount = Number(
			(+newAmount).toFixed(USDC_MARKET.precisionExp.toNumber())
		);
		setAmount(formattedAmount.toString());
	};

	const handleOnClick = async () => {
		if (!vaultPubkey) return;

		try {
			setLoading(true);
			if (withdrawalState === WithdrawalState.UnRequested) {
				const shares = new BN(+amount * 10 ** VAULT_SHARES_PRECISION);
				await appActions.requestVaultWithdrawal(vaultPubkey, new BN(shares));
			} else if (withdrawalState === WithdrawalState.Requested) {
				await appActions.cancelRequestWithdraw(vaultPubkey);
			} else {
				await appActions.executeVaultWithdrawal(vaultPubkey);
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<FadeInDiv
			className={'flex flex-col justify-between h-full gap-9 min-h-[400px]'}
		>
			<span className="text-text-emphasis">
				{getWithdrawalDetails(withdrawalState)}
			</span>

			{withdrawalState === WithdrawalState.UnRequested && (
				<Form
					tab={Tab.Withdraw}
					maxAmount={BigNum.from(maxAmount, VAULT_SHARES_PRECISION).toNum()}
					maxAmountString={`${BigNum.from(
						maxAmount,
						VAULT_SHARES_PRECISION
					).toPrecision(VAULT_SHARES_PRECISION)} shares`}
					setAmount={handleOnValueChange}
					amount={amount}
				/>
			)}

			{connected ? (
				<div className="flex flex-col items-center gap-4">
					<div className="flex flex-col w-full">
						{(withdrawalState === WithdrawalState.Requested ||
							withdrawalState === WithdrawalState.AvailableForWithdrawal) && (
							<span
								className={twMerge(
									'w-full text-center py-2 text-text-emphasis px-2',
									withdrawalState === WithdrawalState.Requested &&
										'bg-button-bg-disabled',
									withdrawalState === WithdrawalState.AvailableForWithdrawal &&
										'bg-success-green-bg font-semibold'
								)}
							>
								{BigNum.from(
									lastRequestedAmount,
									VAULT_SHARES_PRECISION
								).toPrecision(VAULT_SHARES_PRECISION)}{' '}
								{withdrawalState === WithdrawalState.Requested
									? 'shares withdrawal requested'
									: 'shares available for withdrawal'}
							</span>
						)}
						<Button
							className="text-xl"
							disabled={isButtonDisabled}
							onClick={handleOnClick}
							loading={loading}
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
		</FadeInDiv>
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
			<div className={twMerge('pt-9 pb-7 px-7 min-h-[400px]')}>
				{selectedTab === Tab.Deposit ? <DepositForm /> : <WithdrawForm />}
			</div>
		</GradientBorderBox>
	);
};

export default DepositWithdrawForm;
