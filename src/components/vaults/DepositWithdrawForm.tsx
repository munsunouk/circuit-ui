import { useDevSwitchIsOn } from '@drift-labs/react';
import {
	BN,
	BigNum,
	PERCENTAGE_PRECISION,
	QUOTE_PRECISION,
	QUOTE_PRECISION_EXP,
	ZERO,
} from '@drift-labs/sdk';
import { VAULT_SHARES_PRECISION_EXP } from '@drift-labs/vaults-sdk';
import { useWallet } from '@solana/wallet-adapter-react';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import ConnectButton from '@/components/ConnectButton';

import { useAppActions } from '@/hooks/useAppActions';
import useAppStore from '@/hooks/useAppStore';
import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';
import useCurrentVaultDepositorAccData from '@/hooks/useCurrentVaultDepositorAccData';
import usePathToVaultPubKey from '@/hooks/usePathToVaultName';
import { useCurrentVault } from '@/hooks/useVault';
import { useCurrentVaultStats } from '@/hooks/useVaultStats';

import { redeemPeriodToString } from '@/utils/utils';

import { USDC_MARKET } from '@/constants/environment';

import Button from '../elements/Button';
import ButtonTabs from '../elements/ButtonTabs';
import FadeInDiv from '../elements/FadeInDiv';
import GradientBorderBox from '../elements/GradientBorderBox';
import Input from '../elements/Input';
import { ExternalLink } from '../icons';

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

const WITHDRAW_FLUCTUATION_DOC =
	'https://docs.circuit.trade/product-guides/deposit-and-withdraw-into-circuit-vaults';

const getWithdrawalDetails = (state: WithdrawalState) => {
	switch (state) {
		case WithdrawalState.UnRequested:
		case WithdrawalState.AvailableForWithdrawal:
			return (
				<span>
					Withdrawals can be requested at any time and will be available at the
					end of each quarter.
					<br />
					<br />
					The final amount received may differ from the amount requested.{' '}
					<a
						className="inline-flex items-center gap-1 underline transition-opacity cursor-pointer hover:opacity-80"
						href={WITHDRAW_FLUCTUATION_DOC}
						target="_blank"
						rel="noreferrer noopener"
					>
						<span>Learn More</span>
						<ExternalLink />
					</a>
				</span>
			);
		case WithdrawalState.Requested:
			return (
				<span>
					Only one withdrawal request can be made at a time.
					<br />
					<br />
					The vault manager <span className="font-semibold">may</span> transfer
					your funds over once the withdrawal becomes available. If not, you can
					return and initiate the withdrawal yourself.
					<br />
					<br />
					The final amount received may differ from the amount requested.{' '}
					<a
						className="inline-flex items-center gap-1 underline transition-opacity cursor-pointer hover:opacity-80"
						href={WITHDRAW_FLUCTUATION_DOC}
						target="_blank"
						rel="noreferrer noopener"
					>
						<span>Learn More</span>
						<ExternalLink />
					</a>
				</span>
			);
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
				'flex items-center justify-center flex-1 px-5 py-3 leading-relaxed cursor-pointer border-b border-container-border hover:bg-main-blue hover:text-black transition',
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

const handleOnValueChangeCurried =
	(setAmount: (amount: string) => void) => (newAmount: string) => {
		if (isNaN(+newAmount)) return;

		if (newAmount === '') {
			setAmount('');
			return;
		}

		const lastChar = newAmount[newAmount.length - 1];

		// if last char of string is a decimal point, don't format
		if (lastChar === '.') {
			setAmount(newAmount);
			return;
		}

		if (lastChar === '0') {
			// if last char of string is a zero in the decimal places, cut it off if it exceeds precision
			const numOfDigitsAfterDecimal = newAmount.split('.')[1]?.length ?? 0;
			if (numOfDigitsAfterDecimal > USDC_MARKET.precisionExp.toNumber()) {
				setAmount(newAmount.slice(0, -1));
			} else {
				setAmount(newAmount);
			}
			return;
		}

		const formattedAmount = Number(
			(+newAmount).toFixed(USDC_MARKET.precisionExp.toNumber())
		);
		setAmount(formattedAmount.toString());
	};

const DepositForm = () => {
	const { connected } = useWallet();
	const usdcBalance = useAppStore((s) => s.balances.usdc);
	const appActions = useAppActions();
	const vaultPubkey = usePathToVaultPubKey();
	const vaultAccountData = useCurrentVaultAccountData();
	const vaultDepositorAccountData = useCurrentVaultDepositorAccData();
	const vaultStats = useCurrentVaultStats();

	const [amount, setAmount] = useState('');
	const [loading, setLoading] = useState(false);

	const isNotWhitelistedUser =
		!!vaultAccountData?.permissioned && !vaultDepositorAccountData;
	const isWithdrawalInProcess =
		vaultDepositorAccountData?.lastWithdrawRequest.shares.gt(ZERO);
	const isBelowMinDepositAmount =
		+amount > 0 &&
		+amount * QUOTE_PRECISION.toNumber() <
			vaultAccountData?.minDepositAmount.toNumber();

	// Max amount that can be deposited
	const maxCapacity = vaultAccountData?.maxTokens;
	const tvlWithoutHistory = vaultStats.totalAccountValue;
	const maxAvailableCapacity = BigNum.from(
		maxCapacity?.sub(tvlWithoutHistory),
		USDC_MARKET.precisionExp
	);
	const usdcBalanceBigNum = BigNum.fromPrint(
		usdcBalance.toString(),
		VAULT_SHARES_PRECISION_EXP
	);
	let maxDepositAmount = maxAvailableCapacity.gt(usdcBalanceBigNum)
		? usdcBalanceBigNum.toNum()
		: maxAvailableCapacity.scale(99, 100).toNum();
	maxDepositAmount = Math.max(0, maxDepositAmount);

	const isButtonDisabled =
		+amount === 0 ||
		isWithdrawalInProcess ||
		isNotWhitelistedUser ||
		+amount > maxDepositAmount ||
		isBelowMinDepositAmount;

	const handleOnValueChange = handleOnValueChangeCurried(setAmount);

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

	const getExtraInfo = () => {
		let text = '';

		if (isNotWhitelistedUser) {
			text = 'You are not whitelisted';
		} else if (isWithdrawalInProcess) {
			text = 'Deposits are disabled while a withdrawal request is in progress.';
		} else if (isBelowMinDepositAmount) {
			text = `The minimum deposit amount is ${BigNum.from(
				vaultAccountData?.minDepositAmount,
				USDC_MARKET.precisionExp
			).toNum()} USDC.`;
		}

		if (!text) return null;

		return (
			<span
				className={twMerge(
					'w-full text-center py-2 text-text-emphasis px-2 bg-text-button-link-active'
				)}
			>
				{text}
			</span>
		);
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
				<div className="flex flex-col w-full">
					{getExtraInfo()}
					<Button
						className="text-xl"
						disabled={isButtonDisabled}
						onClick={handleDeposit}
						loading={loading}
					>
						Deposit
					</Button>
				</div>
			) : (
				<ConnectButton />
			)}
		</FadeInDiv>
	);
};

/**
 * The withdraw form's UI is designed to display the estimated USDC to withdraw.
 * It will calculate the max amount of shares (after profit share fee if in profit)
 * that the user can withdraw, and convert that amount to USDC. However, the max amount
 * of shares is always updating since the amount of profit is always changing.
 * Hence, we designed it so that we assign the max USDC value only once, on the first
 * calculation, so that both the max USDC value and percentage to withdraw remain
 * un-updated even if the max amount of shares after profit share fee changes due to
 * account data subscription.
 */
const WithdrawForm = () => {
	const { connected } = useWallet();
	const vaultPubkey = usePathToVaultPubKey();
	const vaultDepositorAccountData = useCurrentVaultDepositorAccData();
	const vaultAccountData = useCurrentVaultAccountData();
	const vault = useCurrentVault();
	const appActions = useAppActions();
	const vaultStats = useCurrentVaultStats();
	const vaultDepositorAccount = useAppStore(
		(s) => s.vaults[vaultPubkey?.toString() ?? '']?.vaultDepositorAccount
	);
	const { devSwitchIsOn } = useDevSwitchIsOn();

	const [maxSharesUsdcValue, setMaxSharesUsdcValue] = useState(new BN(0));
	const [amount, setAmount] = useState('');
	const [loading, setLoading] = useState(false);
	const [withdrawalState, setWithdrawalState] = useState<WithdrawalState>(
		WithdrawalState.Requested
	);

	const hasCalcMaxSharesOnce = useRef(false);

	const tvl = vaultStats.totalAccountValue;

	// withdrawal variables
	const withdrawalWaitingPeriod = redeemPeriodToString(
		vaultAccountData?.redeemPeriod.toNumber()
	);
	const withdrawalAvailableTs =
		vaultDepositorAccountData?.lastWithdrawRequest.ts.toNumber() +
		vaultAccountData?.redeemPeriod.toNumber();
	const lastRequestedShares =
		vaultDepositorAccountData?.lastWithdrawRequest.shares ?? new BN(0);
	const lastRequestedUsdcValue = calcLastRequestedUsdcValue();

	const isButtonDisabled =
		(+amount === 0 && withdrawalState === WithdrawalState.UnRequested) ||
		loading ||
		+amount > maxSharesUsdcValue.toNumber() / QUOTE_PRECISION.toNumber();

	// we only want to set the max shares once, when all data is available,
	// to prevent the max amount from constantly updating due to data change subscriptions.
	useEffect(() => {
		if (!vaultDepositorAccount) {
			hasCalcMaxSharesOnce.current = false;
			setMaxSharesUsdcValue(ZERO);
			return;
		}

		if (
			vault?.vaultAccount &&
			vaultAccountData &&
			vaultDepositorAccount !== undefined &&
			!tvl.eq(new BN(0)) &&
			!hasCalcMaxSharesOnce.current
		) {
			// apply management fee first
			const { totalShares: totalSharesAfterMgmtFees } =
				vault.vaultAccount.calcSharesAfterManagementFee(tvl);

			// user variables
			const userShares = vaultDepositorAccountData?.vaultShares ?? new BN(0);
			const userEquity = userShares.mul(tvl).div(totalSharesAfterMgmtFees);

			// profit share fee variables
			const vaultProfitShareFee = new BN(vaultAccountData.profitShare);
			const profitSharingFeePct = vaultDepositorAccount.calcProfitShareFeesPct(
				vaultProfitShareFee,
				userEquity
			);

			const profitShareFeeShares = userShares
				.mul(profitSharingFeePct)
				.div(PERCENTAGE_PRECISION);
			const userSharesAfterFees = userShares.sub(profitShareFeeShares);

			const maxSharesUsdcValue = userSharesAfterFees
				.mul(tvl)
				.div(totalSharesAfterMgmtFees);

			setMaxSharesUsdcValue(maxSharesUsdcValue);
			hasCalcMaxSharesOnce.current = true;
		}
	}, [vaultDepositorAccount, vaultAccountData, tvl]);

	// update withdrawal state
	useEffect(() => {
		const hasRequestedWithdrawal = lastRequestedShares.toNumber() > 0;
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
	}, [withdrawalAvailableTs, lastRequestedShares.toNumber()]);

	const handleOnValueChange = handleOnValueChangeCurried(setAmount);

	const handleOnClick = async () => {
		if (!vaultPubkey) return;

		try {
			setLoading(true);
			if (withdrawalState === WithdrawalState.UnRequested) {
				const pctToWithdraw = new BN(+amount * 10 ** QUOTE_PRECISION_EXP)
					.mul(PERCENTAGE_PRECISION)
					.div(maxSharesUsdcValue);

				await appActions.requestVaultWithdrawal(vaultPubkey, pctToWithdraw);
			} else if (withdrawalState === WithdrawalState.Requested) {
				await appActions.cancelRequestWithdraw(vaultPubkey);
			} else {
				await appActions.executeVaultWithdrawal(vaultPubkey);
				hasCalcMaxSharesOnce.current = false;
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	function calcLastRequestedUsdcValue() {
		if (!vault?.vaultAccount || tvl.eq(ZERO)) return ZERO;

		const { totalShares } =
			vault.vaultAccount.calcSharesAfterManagementFee(tvl);
		const lastRequestedUsdcValue =
			lastRequestedShares.mul(tvl).div(totalShares) ?? ZERO;

		return lastRequestedUsdcValue;
	}

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
					maxAmount={BigNum.from(
						maxSharesUsdcValue,
						QUOTE_PRECISION_EXP
					).toNum()}
					maxAmountString={`${BigNum.from(
						maxSharesUsdcValue,
						QUOTE_PRECISION_EXP
					).toFixed(2)} USDC`}
					setAmount={handleOnValueChange}
					amount={amount}
				/>
			)}

			{connected ? (
				<div className="flex flex-col items-center gap-4 text-center">
					<div className="flex flex-col w-full">
						{(withdrawalState === WithdrawalState.Requested ||
							withdrawalState === WithdrawalState.AvailableForWithdrawal) && (
							<>
								{/** Start of debugging */}
								{devSwitchIsOn && (
									<div className="flex flex-col w-full">
										<span className="flex justify-between w-full">
											<span>TVL:</span>
											<span>
												{BigNum.from(tvl, QUOTE_PRECISION_EXP).toNum()} USDC
											</span>
										</span>
										<span className="flex justify-between w-full">
											<span>Last Withdraw Requested Shares:</span>
											<span>
												{BigNum.from(
													lastRequestedShares,
													QUOTE_PRECISION_EXP
												).toNum()}{' '}
											</span>
										</span>
										<span className="flex justify-between w-full">
											<span>Total Shares (Before M-Fee):</span>
											<span>
												{BigNum.from(
													vaultAccountData?.totalShares,
													QUOTE_PRECISION_EXP
												).toNum()}{' '}
											</span>
										</span>
										<span className="flex justify-between w-full">
											<span>Total Shares (After M-Fee):</span>
											<span>
												{!tvl.eq(ZERO) &&
													BigNum.from(
														vault?.vaultAccount.calcSharesAfterManagementFee(
															tvl
														).totalShares ?? ZERO,
														QUOTE_PRECISION_EXP
													).toNum()}{' '}
											</span>
										</span>
										<span className="flex justify-between w-full">
											<span>Withdrawal Value (Before M-Fee):</span>
											<span>
												{BigNum.from(
													vaultDepositorAccountData?.lastWithdrawRequest.shares
														.mul(tvl)
														.div(vaultAccountData?.totalShares ?? ZERO) ?? ZERO,
													QUOTE_PRECISION_EXP
												).toNum()}{' '}
												USDC
											</span>
										</span>
										<span className="flex justify-between w-full">
											<span>Withdrawal Value (After M-Fee):</span>
											<span>
												{BigNum.from(
													lastRequestedUsdcValue,
													QUOTE_PRECISION_EXP
												).toNum()}{' '}
												USDC
											</span>
										</span>
									</div>
								)}
								{/** Start of debugging */}

								<span
									className={twMerge(
										'w-full text-center py-2 text-text-emphasis px-2',
										withdrawalState === WithdrawalState.Requested &&
											'bg-button-bg-disabled',
										withdrawalState ===
											WithdrawalState.AvailableForWithdrawal &&
											'bg-success-green-bg font-semibold'
									)}
								>
									{BigNum.from(
										lastRequestedUsdcValue,
										QUOTE_PRECISION_EXP
									).toPrecision(QUOTE_PRECISION_EXP)}{' '}
									{withdrawalState === WithdrawalState.Requested
										? 'USDC withdrawal requested'
										: 'USDC available for withdrawal'}
								</span>
							</>
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
						<span>
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
	const vaultDepositorAccountData = useCurrentVaultDepositorAccData();

	const isWithdrawalInProcess =
		vaultDepositorAccountData?.lastWithdrawRequest.shares.gt(ZERO);

	// default to withdrawal tab if withdrawal state is requested/available
	useEffect(() => {
		if (isWithdrawalInProcess) {
			setSelectedTab(Tab.Withdraw);
		}
	}, [isWithdrawalInProcess]);

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
