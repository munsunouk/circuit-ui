import useAppStore from '@/stores/app/useAppStore';
import { useCommonDriftStore, useDevSwitchIsOn } from '@drift-labs/react';
import {
	BASE_PRECISION_EXP,
	BN,
	BigNum,
	PERCENTAGE_PRECISION,
	SpotMarketConfig,
	ZERO,
} from '@drift-labs/sdk';
import { VaultDepositorAction } from '@drift-labs/vaults-sdk';
import { ENUM_UTILS } from '@drift/common';
import { useWallet } from '@solana/wallet-adapter-react';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import ConnectButton from '@/components/ConnectButton';

import { useAppActions } from '@/hooks/useAppActions';
import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';
import useCurrentVaultDepositorAccData from '@/hooks/useCurrentVaultDepositorAccData';
import usePathToVaultPubKey from '@/hooks/usePathToVaultName';
import { useCurrentVault } from '@/hooks/useVault';
import { useCurrentVaultStats } from '@/hooks/useVaultStats';
import { useWithdrawalState } from '@/hooks/useWithdrawalState';

import {
	handleOnValueChangeCurried,
	redeemPeriodToString,
} from '@/utils/utils';
import { getUiVaultConfig } from '@/utils/vaults';

import { USDC_MARKET } from '@/constants/environment';

import Button from '../elements/Button';
import ButtonTabs from '../elements/ButtonTabs';
import FadeInDiv from '../elements/FadeInDiv';
import { CollateralInput } from '../elements/Input';
import { Tooltip } from '../elements/Tooltip';
import { ExternalLink } from '../icons';
import Info from '../icons/Info';
import { VaultTab } from './VaultTabs';

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

const getWithdrawalDetails = (
	state: WithdrawalState,
	withdrawalWaitingPeriod: string
) => {
	switch (state) {
		case WithdrawalState.UnRequested:
		case WithdrawalState.AvailableForWithdrawal:
			return (
				<span>
					Withdrawals can be requested at any time and will be available after{' '}
					{withdrawalWaitingPeriod}. Profits will not be accrued during the
					redemption period, while losses can still be incurred.
					<br />
					<br />
					The maximum amount is after fees, while the final amount received may
					differ from the amount requested.{' '}
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
				'flex items-center justify-center flex-1 px-5 py-3 leading-relaxed cursor-pointer border-b border-container-border hover:bg-container-bg-selected hover:text-text-selected transition hover:border-container-border-selected',
				selected && 'border-container-border-selected bg-main-blue text-black'
			)}
			onClick={onSelect}
		>
			{label}
		</span>
	);
};

const MAX_DEPOSIT_WARNING_TOOLTIP_ID = 'max_deposit_reached_warning';

const Form = ({
	tab,
	amount,
	maxAmount,
	maxAmountString,
	setAmount,
	spotMarketConfig,
	showMaxDepositWarning,
}: {
	tab: Tab;
	amount: string;
	maxAmount: number;
	maxAmountString: string;
	setAmount: (amount: string) => void;
	spotMarketConfig: SpotMarketConfig;
	showMaxDepositWarning?: boolean;
}) => {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<span className="text-lg text-text-emphasis">
					{tab === Tab.Deposit ? 'Deposit' : 'Withdraw'} Amount
				</span>

				<span className="flex items-center">
					{showMaxDepositWarning && (
						<>
							<Tooltip id={MAX_DEPOSIT_WARNING_TOOLTIP_ID}>
								<div className="max-w-[300px]">
									Max amount is reduced due to the vault being at near capacity.
								</div>
							</Tooltip>
							<Info
								className="mr-1 [&>path]:stroke-[var(--warning-yellow-border)] w-4 h-4 cursor-help"
								data-tooltip-id={MAX_DEPOSIT_WARNING_TOOLTIP_ID}
							/>
						</>
					)}

					<span className="mr-1">Max:</span>
					<span
						className="underline cursor-pointer"
						onClick={() => setAmount(maxAmount.toString())}
					>
						{maxAmountString}
					</span>
				</span>
			</div>

			<CollateralInput
				amount={amount}
				setAmount={setAmount}
				marketSymbol={spotMarketConfig.symbol}
			/>

			<ButtonTabs
				tabs={PERCENTAGE_SELECTOR_OPTIONS.map((option) => ({
					key: option.label,
					label: option.label,
					onSelect: () => setAmount((maxAmount * option.value).toString()),
					selected:
						Number(amount).toFixed(spotMarketConfig.precisionExp.toNumber()) ===
							(maxAmount * option.value).toFixed(
								spotMarketConfig.precisionExp.toNumber()
							) && Number(amount) !== 0,
				}))}
			/>
		</div>
	);
};

const DepositForm = ({
	setUserPerformanceTab,
}: {
	setUserPerformanceTab: () => void;
}) => {
	const { connected } = useWallet();
	const balances = useAppStore((s) => s.balances);
	const appActions = useAppActions();
	const vaultPubkey = usePathToVaultPubKey();
	const vaultAccountData = useCurrentVaultAccountData();
	const vaultDepositorAccountData = useCurrentVaultDepositorAccData();
	const vaultStats = useCurrentVaultStats();
	const uiVault = getUiVaultConfig(vaultPubkey);
	const spotMarketConfig = uiVault?.market ?? USDC_MARKET;
	const baseAssetSymbol = spotMarketConfig.symbol;

	const depositAssetBalance = balances[spotMarketConfig?.symbol ?? ''] ?? 0;

	const [amount, setAmount] = useState('');
	const [loading, setLoading] = useState(false);

	const isNotWhitelistedUser =
		!!vaultAccountData?.permissioned && !vaultDepositorAccountData;
	const isWithdrawalInProcess =
		vaultDepositorAccountData?.lastWithdrawRequest.shares.gt(ZERO);
	const isBelowMinDepositAmount =
		+amount > 0 &&
		+amount * spotMarketConfig.precision.toNumber() <
			(vaultAccountData?.minDepositAmount.toNumber() ?? 0);

	// Max amount that can be deposited
	const maxCapacity = vaultAccountData?.maxTokens ?? ZERO;
	const hasMaxCapacity = maxCapacity.gt(ZERO); // if max capacity is 0, then there is no max capacity
	const maxAvailableCapacity = BigNum.from(
		maxCapacity?.sub(vaultStats.totalAccountBaseValue),
		spotMarketConfig.precisionExp
	);
	const depositBalanceBigNum = BigNum.fromPrint(
		depositAssetBalance.toString(),
		spotMarketConfig?.precisionExp ?? BASE_PRECISION_EXP
	);
	let maxDepositAmount = hasMaxCapacity
		? maxAvailableCapacity.gt(depositBalanceBigNum)
			? depositBalanceBigNum.toNum()
			: maxAvailableCapacity.scale(99, 100).toNum() // reduce fluctuations for max available capacity
		: depositBalanceBigNum.toNum();
	maxDepositAmount = Math.max(0, maxDepositAmount);

	const isButtonDisabled =
		+amount === 0 ||
		isWithdrawalInProcess ||
		isNotWhitelistedUser ||
		+amount > maxDepositAmount ||
		isBelowMinDepositAmount;

	const handleOnValueChange = handleOnValueChangeCurried(
		setAmount,
		spotMarketConfig
	);

	const handleDeposit = async () => {
		if (!vaultPubkey) return;

		const baseAmount = new BN(+amount * spotMarketConfig.precision.toNumber());

		setLoading(true);
		try {
			await appActions.depositVault(vaultPubkey, baseAmount);
			setUserPerformanceTab();
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
				spotMarketConfig.precisionExp
			).toNum()} ${baseAssetSymbol}.`;
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
				maxAmountString={`${maxDepositAmount.toFixed(2)} ${baseAssetSymbol}`}
				setAmount={handleOnValueChange}
				amount={amount}
				spotMarketConfig={spotMarketConfig}
				showMaxDepositWarning={maxAvailableCapacity.lt(depositBalanceBigNum)}
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
 * The withdraw form's UI is designed to display the estimated base asset to withdraw.
 * It will calculate the max amount of shares (after profit share fee if in profit)
 * that the user can withdraw, and convert that amount to base asset. However, the max amount
 * of shares is always updating since the amount of profit is always changing.
 * Hence, we designed it so that we assign the max base asset value only once, on the first
 * calculation, so that both the max base asset value and percentage to withdraw remain
 * un-updated even if the max amount of shares after profit share fee changes due to
 * account data subscription.
 */
const WithdrawForm = ({
	setUserPerformanceTab,
}: {
	setUserPerformanceTab: () => void;
}) => {
	const { connected } = useWallet();
	const emulationMode = useCommonDriftStore((s) => s.emulationMode);
	const vaultPubkey = usePathToVaultPubKey();
	const vaultDepositorAccountData = useCurrentVaultDepositorAccData();
	const vaultAccountData = useCurrentVaultAccountData();
	const vault = useCurrentVault();
	const appActions = useAppActions();
	const vaultStats = useCurrentVaultStats();
	const vaultDepositorAccount = useAppStore(
		(s) => s.vaults[vaultPubkey?.toString() ?? '']?.vaultDepositorAccount
	);
	const eventRecords = vault?.eventRecords?.records ?? [];

	const uiVault = getUiVaultConfig(vaultPubkey);
	const spotMarketConfig = uiVault?.market ?? USDC_MARKET;
	const baseAssetSymbol = spotMarketConfig.symbol;

	const { devSwitchIsOn } = useDevSwitchIsOn();

	const [maxSharesBaseValue, setMaxSharesBaseValue] = useState(new BN(0));
	const [amount, setAmount] = useState('');
	const [loading, setLoading] = useState(false);
	const { withdrawalState, isWithdrawalInProgress } = useWithdrawalState(
		vaultDepositorAccountData,
		vaultAccountData
	);

	const hasCalcMaxSharesOnce = useRef(false);

	const tvlBaseValue = vaultStats.totalAccountBaseValue;

	// withdrawal variables
	const withdrawalWaitingPeriod = redeemPeriodToString(
		vaultAccountData?.redeemPeriod.toNumber()
	);
	const withdrawalAvailableTs =
		(vaultDepositorAccountData?.lastWithdrawRequest.ts.toNumber() ?? 0) +
		(vaultAccountData?.redeemPeriod.toNumber() ?? 0);
	const lastRequestedShares =
		vaultDepositorAccountData?.lastWithdrawRequest.shares ?? new BN(0);
	const lastRequestedUsdcValue = calcLastRequestedBaseValue();

	const isButtonDisabled =
		(+amount === 0 && withdrawalState === WithdrawalState.UnRequested) ||
		loading ||
		+amount >
			maxSharesBaseValue.toNumber() / spotMarketConfig.precision.toNumber();

	// we only want to set the max shares once, when all data is available,
	// to prevent the max amount from constantly updating due to data change subscriptions.
	useEffect(() => {
		if (!vaultDepositorAccount) {
			hasCalcMaxSharesOnce.current = false;
			setMaxSharesBaseValue(ZERO);
			return;
		}

		if (
			vault?.vaultAccount &&
			vaultAccountData &&
			vaultDepositorAccount !== undefined &&
			!tvlBaseValue.eq(new BN(0)) &&
			!hasCalcMaxSharesOnce.current
		) {
			// apply management fee first
			const { totalShares: totalSharesAfterMgmtFees } =
				vault.vaultAccount.calcSharesAfterManagementFee(tvlBaseValue);

			// user variables
			const userShares = vaultDepositorAccountData?.vaultShares ?? new BN(0);
			const userEquity = userShares
				.mul(tvlBaseValue)
				.div(totalSharesAfterMgmtFees);

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

			const maxSharesBaseValue = userSharesAfterFees
				.mul(tvlBaseValue)
				.div(totalSharesAfterMgmtFees);

			setMaxSharesBaseValue(maxSharesBaseValue);
			hasCalcMaxSharesOnce.current = true;
		}
	}, [vaultDepositorAccount, vaultAccountData, tvlBaseValue]);

	const handleOnValueChange = handleOnValueChangeCurried(
		setAmount,
		spotMarketConfig
	);

	const handleOnClick = async () => {
		if (!vaultPubkey) return;

		try {
			setLoading(true);
			if (withdrawalState === WithdrawalState.UnRequested) {
				const pctToWithdraw = new BN(
					+amount * 10 ** spotMarketConfig.precisionExp.toNumber()
				)
					.mul(PERCENTAGE_PRECISION)
					.div(maxSharesBaseValue);

				await appActions.requestVaultWithdrawal(vaultPubkey, pctToWithdraw);
			} else if (withdrawalState === WithdrawalState.Requested) {
				await appActions.cancelRequestWithdraw(vaultPubkey);
			} else {
				await appActions.executeVaultWithdrawal(vaultPubkey, emulationMode);
				hasCalcMaxSharesOnce.current = false;
				setUserPerformanceTab();
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	// The maximum amount of base asset that can be withdrawn equals
	// min(sharesBasedWithdrawAmountAtRequestTime, sharesBasedWithdrawAmountAtWithdrawTime).
	// This means that the user cannot withdraw more than what they requested, and can
	// withdraw less than what they requested if the vault loses value in that period.
	// Any positive value accrued during the period of withdrawal is attributed to the rest
	// of the shares.
	function calcLastRequestedBaseValue() {
		if (!vault?.vaultAccount || tvlBaseValue.eq(ZERO)) return ZERO;

		const { totalShares } =
			vault.vaultAccount.calcSharesAfterManagementFee(tvlBaseValue);
		const currentBaseValueOfRequest =
			lastRequestedShares.mul(tvlBaseValue).div(totalShares) ?? ZERO;

		const lastWithdrawRequest = eventRecords.find((record) =>
			ENUM_UTILS.match(record.action, VaultDepositorAction.WITHDRAW_REQUEST)
		);
		if (!lastWithdrawRequest) {
			return currentBaseValueOfRequest;
		}
		const lastWithdrawRequestBaseValue = lastWithdrawRequest.amount;

		const minBaseValueRequested = BN.min(
			currentBaseValueOfRequest,
			lastWithdrawRequestBaseValue
		);

		return minBaseValueRequested;
	}

	return (
		<FadeInDiv
			className={'flex flex-col justify-between h-full gap-9 min-h-[400px]'}
		>
			<span className="text-text-emphasis">
				{getWithdrawalDetails(withdrawalState, withdrawalWaitingPeriod)}
			</span>

			{withdrawalState === WithdrawalState.UnRequested && (
				<Form
					tab={Tab.Withdraw}
					maxAmount={BigNum.from(
						maxSharesBaseValue,
						spotMarketConfig.precisionExp
					).toNum()}
					maxAmountString={`${BigNum.from(
						maxSharesBaseValue,
						spotMarketConfig.precisionExp
					).toFixed(2)} ${baseAssetSymbol}`}
					setAmount={handleOnValueChange}
					amount={amount}
					spotMarketConfig={spotMarketConfig}
				/>
			)}

			{connected || emulationMode ? (
				<div className="flex flex-col items-center gap-4 text-center">
					<div className="flex flex-col w-full">
						{isWithdrawalInProgress && (
							<>
								{/** Start of debugging */}
								{devSwitchIsOn && (
									<div className="flex flex-col w-full">
										<span className="flex justify-between w-full">
											<span>TVL:</span>
											<span>
												{BigNum.from(
													tvlBaseValue,
													spotMarketConfig.precisionExp
												).toNum()}{' '}
												{baseAssetSymbol}
											</span>
										</span>
										<span className="flex justify-between w-full">
											<span>Last Withdraw Requested Shares:</span>
											<span>
												{BigNum.from(
													lastRequestedShares,
													spotMarketConfig.precisionExp
												).toNum()}{' '}
											</span>
										</span>
										<span className="flex justify-between w-full">
											<span>Total Shares (Before M-Fee):</span>
											<span>
												{BigNum.from(
													vaultAccountData?.totalShares,
													spotMarketConfig.precisionExp
												).toNum()}{' '}
											</span>
										</span>
										<span className="flex justify-between w-full">
											<span>Total Shares (After M-Fee):</span>
											<span>
												{!tvlBaseValue.eq(ZERO) &&
													BigNum.from(
														vault?.vaultAccount.calcSharesAfterManagementFee(
															tvlBaseValue
														).totalShares ?? ZERO,
														spotMarketConfig.precisionExp
													).toNum()}{' '}
											</span>
										</span>
										<span className="flex justify-between w-full">
											<span>Withdrawal Value (Before M-Fee):</span>
											<span>
												{BigNum.from(
													vaultDepositorAccountData?.lastWithdrawRequest.shares
														.mul(tvlBaseValue)
														.div(vaultAccountData?.totalShares ?? ZERO) ?? ZERO,
													spotMarketConfig.precisionExp
												).toNum()}{' '}
												{baseAssetSymbol}
											</span>
										</span>
										<span className="flex justify-between w-full">
											<span>Withdrawal Value (After M-Fee):</span>
											<span>
												{BigNum.from(
													lastRequestedUsdcValue,
													spotMarketConfig.precisionExp
												).toNum()}{' '}
												{baseAssetSymbol}
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
										spotMarketConfig.precisionExp
									).toPrecision(spotMarketConfig.precisionExp.toNumber())}{' '}
									{withdrawalState === WithdrawalState.Requested
										? `${baseAssetSymbol} withdrawal requested`
										: `${baseAssetSymbol} available for withdrawal`}
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

const DepositWithdrawForm = ({
	setVaultTab,
}: {
	setVaultTab: (tab: VaultTab) => void;
}) => {
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
		<div className="w-full bg-black border border-main-blue">
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
				{selectedTab === Tab.Deposit ? (
					<DepositForm
						setUserPerformanceTab={() => setVaultTab(VaultTab.UserPerformance)}
					/>
				) : (
					<WithdrawForm
						setUserPerformanceTab={() => setVaultTab(VaultTab.UserPerformance)}
					/>
				)}
			</div>
		</div>
	);
};

export default DepositWithdrawForm;
