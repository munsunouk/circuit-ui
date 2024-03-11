import { DriftHistoryServerClient } from '@/clients/drift-history-server';
import { SerializedDepositHistory } from '@/types';
import { BigNum, PublicKey, ZERO } from '@drift-labs/sdk';
import { calcModifiedDietz } from '@drift-labs/vaults-sdk';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import { SPOT_MARKETS_LOOKUP } from '@/constants/environment';

import { useVaultStats } from './useVaultStats';

const REFRESH_INTERVAL = 1000 * 60 * 2;

const useVaultApyAndCumReturns = (
	vaultPubKeyString: string | undefined,
	vaultUserPubKey: string | undefined,
	marketIndex: number
) => {
	const { data, error } = useSWR<{
		data: {
			vaults: Record<
				string,
				{
					apy: number;
					returns: number;
				}
			>;
			ts: number;
		};
	}>(vaultPubKeyString ? '/api/apy-returns' : null, {
		refreshInterval: REFRESH_INTERVAL,
	});
	const vaultStats = useVaultStats(
		vaultPubKeyString ? new PublicKey(vaultPubKeyString) : undefined
	);

	const [stats, setStats] = useState<{
		apy: number;
		cumReturns: number;
		isLoading: boolean;
	}>({
		apy: 0,
		cumReturns: 0,
		isLoading: true,
	});

	useEffect(() => {
		if (!vaultPubKeyString) return;

		if (error || !data) {
			error && console.error(error);
			setStats({
				apy: 0,
				cumReturns: 0,
				isLoading: true,
			});
			return;
		}

		const vaultApyAndCumReturns = data.data.vaults[vaultPubKeyString];

		// Circuit unsupported vault
		if (!vaultApyAndCumReturns) {
			if (!vaultStats || vaultStats.totalAccountBaseValue.eq(ZERO)) {
				// ignore if vault has no deposits
				setStats({
					apy: 0,
					cumReturns: 0,
					isLoading: false,
				});
				return;
			} else {
				if (!vaultUserPubKey) {
					setStats({
						apy: 0,
						cumReturns: 0,
						isLoading: true,
					});
					return;
				} else {
					// fallback to fetching deposit history using RPC
					// calculate modified dietz here
					DriftHistoryServerClient.fetchUserAccountsDepositHistory(
						false,
						new PublicKey(vaultUserPubKey)
					).then((res) => {
						const depositHistory = res.data?.records[0];

						if (!depositHistory) {
							setStats({
								apy: 0,
								cumReturns: 0,
								isLoading: false,
							});
							return;
						}

						const { apy, returns } = calcModifiedDietz(
							BigNum.from(
								vaultStats.totalAccountBaseValue,
								SPOT_MARKETS_LOOKUP[marketIndex].precisionExp
							),
							SPOT_MARKETS_LOOKUP[marketIndex].precisionExp,
							depositHistory as SerializedDepositHistory[]
						);

						setStats({
							apy: apy * 100,
							cumReturns: returns * 100,
							isLoading: false,
						});

						return;
					});
				}
			}

			return;
		}

		setStats({
			apy: vaultApyAndCumReturns.apy * 100,
			cumReturns: vaultApyAndCumReturns.returns * 100,
			isLoading: false,
		});
	}, [
		data,
		error,
		vaultStats.totalAccountBaseValue.eq(ZERO),
		vaultPubKeyString,
		marketIndex,
	]);

	return stats;
};

export default useVaultApyAndCumReturns;
