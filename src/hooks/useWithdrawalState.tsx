import { BN } from '@drift-labs/sdk';
import { Vault, VaultDepositor } from '@drift-labs/vaults-sdk';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

export enum WithdrawalState {
	UnRequested, // no withdrawal request has been made
	Requested, // a withdrawal request has been made but not yet available
	AvailableForWithdrawal, // a withdrawal request has been made and is available
}

export const useWithdrawalState = (
	vaultDepositorAccountData: VaultDepositor | undefined,
	vaultAccountData: Vault | undefined
) => {
	const [withdrawalState, setWithdrawalState] = useState<WithdrawalState>(
		WithdrawalState.Requested
	);

	const withdrawalAvailableTs =
		(vaultDepositorAccountData?.lastWithdrawRequest.ts.toNumber() ?? 0) +
		(vaultAccountData?.redeemPeriod.toNumber() ?? 0);
	const lastRequestedShares =
		vaultDepositorAccountData?.lastWithdrawRequest.shares ?? new BN(0);
	const isFullWithdrawal = lastRequestedShares.eq(
		vaultDepositorAccountData?.vaultShares ?? new BN(0)
	);
  const isWithdrawalInProgress = withdrawalState !== WithdrawalState.UnRequested;

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

	return {withdrawalState, isFullWithdrawal, isWithdrawalInProgress};
};
