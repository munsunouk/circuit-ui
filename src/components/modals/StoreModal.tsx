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

import { redeemPeriodToString } from '@/utils/utils';

import ButtonTabs from '../elements/ButtonTabs';
import { Modal } from './Modal';

const Row = ({
	label,
	value,
}: {
	label: string;
	value: string | undefined;
}) => (
	<div className="flex justify-between w-full">
		<div>{label}</div>
		<div>{value}</div>
	</div>
);

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

	function shortenPubkey(pubkey: string | undefined) {
		if (!pubkey) return '';
		return `${pubkey.slice(0, 8)}...${pubkey.slice(36, 44)}`;
	}

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
								value={shortenPubkey(vaultDepositor?.pubkey.toString())}
							/>
							<Row
								label="Net Deposits"
								value={BigNum.from(
									vaultDepositor?.netDeposits,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP)}
							/>
							<Row
								label="Total Deposits"
								value={BigNum.from(
									vaultDepositor?.totalDeposits,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP)}
							/>
							<Row
								label="Total Withdraws"
								value={BigNum.from(
									vaultDepositor?.totalWithdraws,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP)}
							/>

							<Row
								label="Cumulative Profit Share Amount"
								value={BigNum.from(
									vaultDepositor?.cumulativeProfitShareAmount,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP)}
							/>
							<Row
								label="Vault Shares"
								value={vaultDepositor?.vaultShares.toString()}
							/>
							<Row
								label="Profit Share Fee Paid"
								value={vaultDepositor?.profitShareFeePaid?.toString() ?? '0'}
							/>
							<Row
								label="Last Withdraw Request Timestamp"
								value={dayjs
									.unix(vaultDepositor?.lastWithdrawRequest.ts.toNumber())
									.format('DD MMM YYYY HH:mm:ss')}
							/>
							<Row
								label="Last Withdraw Request Shares"
								value={BigNum.from(
									vaultDepositor?.lastWithdrawRequest.shares,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP)}
							/>
							<Row
								label="Last Withdraw Request Value"
								value={BigNum.from(
									vaultDepositor?.lastWithdrawRequest.value,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP)}
							/>
						</>
					)}
					{tab === Tab.Vault && (
						<>
							<Row
								label="Vault Manager"
								value={shortenPubkey(vault?.manager.toString())}
							/>
							<Row
								label="User Account"
								value={shortenPubkey(vault?.user.toString())}
							/>
							<Row
								label="Delegate"
								value={shortenPubkey(vault?.delegate.toString())}
							/>
							<Row
								label="Liquidation Delegate"
								value={shortenPubkey(vault?.liquidationDelegate.toString())}
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
								).toPrecision(QUOTE_PRECISION_EXP)}
							/>

							<Row
								label="Total Deposits"
								value={BigNum.from(
									vault?.totalDeposits,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP)}
							/>
							<Row
								label="Total Withdrawals"
								value={BigNum.from(
									vault?.totalWithdraws,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP)}
							/>
							<Row
								label="Manager Net Deposits"
								value={BigNum.from(
									vault?.managerNetDeposits,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP)}
							/>
							<Row
								label="Manager Total Deposits"
								value={BigNum.from(
									vault?.managerTotalDeposits,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP)}
							/>
							<Row
								label="Manager Total Withdraws"
								value={BigNum.from(
									vault?.managerTotalWithdraws,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP)}
							/>
							<Row
								label="Manager Total Profit Share"
								value={BigNum.from(
									vault?.managerTotalProfitShare,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP)}
							/>
							<Row
								label="Manager Total Fee"
								value={BigNum.from(
									vault?.managerTotalFee,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP)}
							/>
							<Row
								label="Last Fee Update Timestamp"
								value={dayjs
									.unix(vault?.lastFeeUpdateTs.toNumber())
									.format('DD MMM YYYY HH:mm:ss')}
							/>
							<Row
								label="Total Withdraws Requested"
								value={BigNum.from(
									vault?.totalWithdrawRequested,
									QUOTE_PRECISION_EXP
								).toPrecision(QUOTE_PRECISION_EXP)}
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
									(vault?.managementFee ?? 0) / PERCENTAGE_PRECISION.toNumber()
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
