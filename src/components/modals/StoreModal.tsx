import {
	BigNum,
	PERCENTAGE_PRECISION,
	QUOTE_PRECISION_EXP,
} from '@drift-labs/sdk';
import dayjs from 'dayjs';
import { useState } from 'react';

import useAppStore from '@/hooks/useAppStore';
import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';
import useCurrentVaultDepositorAccData from '@/hooks/useCurrentVaultDepositorAccData';

import { redeemPeriodToString, shortenPubkey } from '@/utils/utils';

import ButtonTabs from '../elements/ButtonTabs';
import Row from '../elements/Row';
import { Modal } from './Modal';

enum Tab {
	VaultDepositor,
	Vault,
}

export default function StoreModal() {
	const setAppStore = useAppStore((s) => s.set);
	const vaultDepositor = useCurrentVaultDepositorAccData();
	const vault = useCurrentVaultAccountData();

	const [tab, setTab] = useState(Tab.Vault);

	const handleOnClose = () => {
		setAppStore((s) => {
			s.modals.showStoreModal = false;
		});
	};

	return (
		<Modal onClose={handleOnClose} header="Vault's Store" className="w-[500px]">
			<div className="flex flex-col">
				<ButtonTabs
					tabs={[
						{
							label: 'Vault',
							selected: tab === Tab.Vault,
							onSelect: () => setTab(Tab.Vault),
						},
						{
							label: 'Vault Depositor',
							selected: tab === Tab.VaultDepositor,
							onSelect: () => setTab(Tab.VaultDepositor),
						},
					]}
					className="mb-4"
				/>
				<div className="flex flex-col gap-1 text-sm">
					{tab === Tab.VaultDepositor && (
						<>
							<Row
								label="Vault Depositor Address"
								value={shortenPubkey(vaultDepositor?.pubkey.toString(), 8)}
							/>
							<Row
								label="Net Deposits"
								value={BigNum.from(
									vaultDepositor?.netDeposits,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
							/>
							<Row
								label="Total Deposits"
								value={BigNum.from(
									vaultDepositor?.totalDeposits,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
							/>
							<Row
								label="Total Withdraws"
								value={BigNum.from(
									vaultDepositor?.totalWithdraws,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
							/>

							<Row
								label="Cumulative Profit Share Amount"
								value={BigNum.from(
									vaultDepositor?.cumulativeProfitShareAmount,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
							/>
							<Row
								label="Vault Shares"
								value={BigNum.from(vaultDepositor?.vaultShares, 6)
									.toNum()
									.toString()}
							/>
							<Row
								label="Profit Share Fee Paid"
								value={BigNum.from(
									vaultDepositor?.profitShareFeePaid,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
							/>
							<Row
								label="Last Withdraw Request Timestamp"
								value={dayjs
									.unix(vaultDepositor?.lastWithdrawRequest.ts.toNumber() ?? 0)
									.format('DD MMM YYYY HH:mm:ss')}
							/>
							<Row
								label="Last Withdraw Request Shares"
								value={BigNum.from(
									vaultDepositor?.lastWithdrawRequest.shares,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
							/>
							<Row
								label="Last Withdraw Request Value"
								value={BigNum.from(
									vaultDepositor?.lastWithdrawRequest.value,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
							/>
						</>
					)}
					{tab === Tab.Vault && (
						<>
							<Row
								label="Vault Manager"
								value={shortenPubkey(vault?.manager.toString(), 8)}
							/>
							<Row
								label="User Account"
								value={shortenPubkey(vault?.user.toString(), 8)}
							/>
							<Row
								label="Delegate"
								value={shortenPubkey(vault?.delegate.toString(), 8)}
							/>
							<Row
								label="Liquidation Delegate"
								value={shortenPubkey(vault?.liquidationDelegate.toString(), 8)}
							/>
							<Row
								label="Liquidation Start Timestamp"
								value={
									vault?.liquidationStartTs.toNumber()
										? dayjs
												.unix(vault?.liquidationStartTs.toNumber())
												.format('DD MMM YYYY HH:mm:ss')
										: '-'
								}
							/>
							<Row
								label="User Shares"
								value={BigNum.from(vault?.userShares, 6)
									.toNum()
									.toString()}
							/>
							<Row
								label="Total Shares"
								value={BigNum.from(vault?.totalShares, 6)
									.toNum()
									.toString()}
							/>
							<Row
								label="Net Deposits"
								value={BigNum.from(
									vault?.netDeposits,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
							/>

							<Row
								label="Total Deposits"
								value={BigNum.from(
									vault?.totalDeposits,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
							/>
							<Row
								label="Total Withdrawals"
								value={BigNum.from(
									vault?.totalWithdraws,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
							/>
							<Row
								label="Manager Net Deposits"
								value={BigNum.from(
									vault?.managerNetDeposits,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
							/>
							<Row
								label="Manager Total Deposits"
								value={BigNum.from(
									vault?.managerTotalDeposits,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
							/>
							<Row
								label="Manager Total Withdraws"
								value={BigNum.from(
									vault?.managerTotalWithdraws,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
							/>
							<Row
								label="Manager Total Profit Share"
								value={BigNum.from(
									vault?.managerTotalProfitShare,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
							/>
							<Row
								label="Manager Total Fee"
								value={BigNum.from(
									vault?.managerTotalFee,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
							/>
							<Row
								label="Last Fee Update Timestamp"
								value={dayjs
									.unix(vault?.lastFeeUpdateTs.toNumber() ?? 0)
									.format('DD MMM YYYY HH:mm:ss')}
							/>
							<Row
								label="Total Withdraws Requested"
								value={BigNum.from(
									vault?.totalWithdrawRequested,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
							/>
							<Row
								label="Redemption Period"
								value={redeemPeriodToString(vault?.redeemPeriod.toNumber())}
							/>
							<Row
								label="Profit Share Fee"
								value={`${
									(vault?.profitShare ?? 0) / PERCENTAGE_PRECISION.toNumber()
								}%`}
							/>
							<Row
								label="Management Fee"
								value={`${
									(vault?.managementFee.toNumber() ?? 0) /
									PERCENTAGE_PRECISION.toNumber()
								}%`}
							/>
							<Row
								label="Minimum Deposit"
								value={`${vault?.minDepositAmount.toNumber()}`}
							/>
							<Row label="Hurdle Rate" value={vault?.hurdleRate.toString()} />
						</>
					)}
				</div>
			</div>
		</Modal>
	);
}
